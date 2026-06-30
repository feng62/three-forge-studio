import * as THREE from 'three'
import { Engine } from '../Engine'
import { createBuiltInAsset, createBuiltInMaterial } from '../../config/BuiltinAssets'
import { AddObjectCommand } from '../../history/AddObjectCommand'
import { SetMaterialCommand } from '../../history/SetMaterialCommand'
import { historyManager } from '../../history/HistoryManager'
import { RaycastConfig } from '../../config/RaycastConfig'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import ModelWorker from '../../db/modelWorker?worker'
import { db } from '../../db/db'

import dracoWasmWrapperUrl from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url'
import dracoDecoderWasmUrl from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url'

// 初始化 DRACOLoader 单例
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath({
  js: dracoWasmWrapperUrl,
  wasm: dracoDecoderWasmUrl
})

export interface ForgeAssetRegistryItem {
  uuid: string;
  url: string;
  type: 'model' | 'texture' | 'image';
  format: string;
  name: string;
}

export class AssetManager {
  private engine: Engine
  private worker: Worker
  public projectAssets = new Map<string, ForgeAssetRegistryItem>()

  constructor(engine: Engine) {
    this.engine = engine
    this.worker = new ModelWorker()
  }

  /**
   * 添加内置资产（模型/灯光）到场景中
   * @param {string} type 资产类型
   * @param {number} [clientX] 落点屏幕X坐标
   * @param {number} [clientY] 落点屏幕Y坐标
   */
  public addAsset(type: string, clientX?: number, clientY?: number, payload?: any) {
    // 外部模型走专属多线程加载通道
    if (type === 'ExternalModel' && payload?.id) {
      this.loadExternalModelFromDB(payload.id, clientX, clientY)
      return
    }

    let obj: THREE.Object3D | null = null
    const color = Math.floor(Math.random() * 0xffffff)
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 })
    
    // 如果是材质，独立处理逻辑
    if (type.startsWith('Material_')) {
      this.handleMaterialDrop(type, clientX, clientY)
      return
    }

    // 默认高度偏移，防止物体一半嵌在地下
    let yOffset = 0

    const builtin = createBuiltInAsset(type, material)
    obj = builtin.obj
    if (obj) yOffset = builtin.yOffset

    if (obj) {
      // 计算放置位置
      let placed = false
      if (clientX !== undefined && clientY !== undefined && this.engine.container) {
        const rect = this.engine.container.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1
        )
        // 借助 SelectionManager 的 raycaster
        const raycaster = this.engine.selectionManager?.raycaster || new THREE.Raycaster()
        raycaster.setFromCamera(mouse, this.engine.camera)
        const intersects = raycaster.intersectObjects(this.engine.scene.children, true)
        
        // 使用 DroppableSurface 过滤器，允许落在网格面上
        const validIntersects = intersects.filter(i => RaycastConfig.isDroppableSurface(i.object))

        if (validIntersects.length > 0) {
          const hit = validIntersects[0]
          // 放在命中点，并沿着法线稍微偏移，防止穿模
          obj.position.copy(hit.point)
          if (hit.face) {
            obj.position.addScaledVector(hit.face.normal, yOffset)
          } else {
            obj.position.y += yOffset
          }
          placed = true
        }
      }

      if (!placed) {
        this.placeInFrontOfCamera(obj, yOffset)
      }

      this.finalizeAssetAddition(obj, type)
    } else {
      console.warn(`[AssetManager] Unknown asset type: ${type}`)
    }
  }

  private placeInFrontOfCamera(obj: THREE.Object3D, yOffset: number = 0) {
    const dir = new THREE.Vector3()
    this.engine.camera.getWorldDirection(dir)
    obj.position.copy(this.engine.camera.position).add(dir.multiplyScalar(5))
    if (obj.position.y < yOffset) obj.position.y = yOffset
  }

  private finalizeAssetAddition(obj: THREE.Object3D, type: string) {
    // 避免重名导致阅读困难，给它加个唯一编号
    if (!obj.name) obj.name = type
    obj.name = `${obj.name}_${Math.floor(Math.random() * 1000)}`
    
    this.engine.scene.add(obj)
    console.log(`[AssetManager] Added asset: ${type}`)
    
    // 使用历史记录系统执行添加操作
    const cmd = new AddObjectCommand(this.engine, obj)
    historyManager.execute(cmd)

    // 自动选中新生成的物体
    if (this.engine.selectionManager) {
      this.engine.selectionManager.selectObjectByUuid(obj.uuid)
    }
  }

  /**
   * 处理拖拽材质到场景的逻辑
   */
  private handleMaterialDrop(type: string, clientX?: number, clientY?: number) {
    if (clientX === undefined || clientY === undefined || !this.engine.container) return

    const rect = this.engine.container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    
    const raycaster = this.engine.selectionManager?.raycaster || new THREE.Raycaster()
    raycaster.setFromCamera(mouse, this.engine.camera)
    
    // 只跟 Mesh 交互，忽略辅助网格和灯光等
    const intersects = raycaster.intersectObjects(this.engine.scene.children, true)
    const validIntersects = intersects.filter(i => {
      // 只能将材质赋给非辅助对象的 Mesh
      return i.object instanceof THREE.Mesh && RaycastConfig.isClickable(i.object)
    })

    if (validIntersects.length > 0) {
      let hitObj = validIntersects[0].object as THREE.Mesh
      
      // 生成对应材质
      let newMaterial: THREE.Material | null = createBuiltInMaterial(type)

      if (newMaterial) {
        // 使用历史记录系统执行替换材质
        const cmd = new SetMaterialCommand(this.engine, hitObj, newMaterial)
        historyManager.execute(cmd)
        console.log(`[AssetManager] Assigned material ${type} to object ${hitObj.name}`)
      }
    } else {
      console.log(`[AssetManager] No mesh found to assign material ${type}`)
    }
  }

  /**
   * 注册资产到当前项目的注册表中
   */
  public registerAsset(uuid: string, url: string, type: 'model' | 'texture' | 'image', format: string, name: string) {
    if (!this.projectAssets.has(uuid)) {
      this.projectAssets.set(uuid, { uuid, url, type, format, name })
      console.log(`[AssetManager] Registered asset: ${name} (${uuid})`)
    }
  }

  /**
   * 从 IndexedDB 通过 Web Worker 加载外部模型并加入场景
   * @param {string} id - 模型在 DB 中的 ID
   * @param {number} [clientX] - 落点 X
   * @param {number} [clientY] - 落点 Y
   * @param {THREE.Object3D} [attachTo] - 可选，直接挂载到指定的节点而不是主场景
   */
  public async loadExternalModelFromDB(id: string, clientX?: number, clientY?: number, attachTo?: THREE.Object3D): Promise<THREE.Object3D | null> {
    try {
      console.log(`[AssetManager] Requesting model ${id} from Worker...`)
      
      const data = await new Promise<any>((resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (e.data.id === id) {
            this.worker.removeEventListener('message', handler)
            if (e.data.type === 'MODEL_LOADED') {
              resolve(e.data)
            } else {
              reject(new Error(e.data.error))
            }
          }
        }
        this.worker.addEventListener('message', handler)
        this.worker.postMessage({ type: 'LOAD_MODEL', id })
      })

      console.log(`[AssetManager] Received model data from Worker, parsing...`)
      
      const { data: buffer, ext, name } = data
      const blob = new Blob([buffer])
      const url = URL.createObjectURL(blob)
      
      this.registerAsset(id, '', 'model', ext, name)
      
      try {
        let loadedObject: THREE.Object3D | null = null

        if (ext === 'gltf' || ext === 'glb') {
          const loader = new GLTFLoader()
          loader.setDRACOLoader(dracoLoader as any)
          const gltf = await loader.loadAsync(url)
          loadedObject = gltf.scene || gltf.scenes[0]
        } else if (ext === 'fbx') {
          const loader = new FBXLoader()
          loadedObject = await loader.loadAsync(url)
        } else {
          console.warn(`[AssetManager] Unsupported file extension: ${ext}`)
          return null
        }

        if (loadedObject) {
          // Compute BVH for raycasting optimization
          loadedObject.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
              child.geometry.computeBoundsTree()
            }
          })
          
          // 不管是初次加载还是反序列化，loadedObject 本身都不再作为外部模型根节点。
          // 外部模型的根节点统一由 Wrapper 承担。
          
          let finalObject: THREE.Object3D;

          if (attachTo) {
            // 反序列化时，ObjectLoader 已经创建了 Wrapper 节点 (attachTo)
            attachTo.add(loadedObject)
            finalObject = attachTo
          } else {
            // 初次从面板拖拽到场景时，主动创建一个 Wrapper 节点
            const wrapper = new THREE.Group()
            wrapper.name = name
            wrapper.userData.isExternalModel = true
            wrapper.userData.externalModelId = id
            wrapper.add(loadedObject)

            // 如果有放置坐标，计算碰撞点并赋给 Wrapper
            if (clientX !== undefined && clientY !== undefined && this.engine.container) {
              const rect = this.engine.container.getBoundingClientRect()
              const mouse = new THREE.Vector2(
                ((clientX - rect.left) / rect.width) * 2 - 1,
                -((clientY - rect.top) / rect.height) * 2 + 1
              )
              const raycaster = this.engine.selectionManager?.raycaster || new THREE.Raycaster()
              raycaster.setFromCamera(mouse, this.engine.camera)
              const intersects = raycaster.intersectObjects(this.engine.scene.children, true)
              const validIntersects = intersects.filter(i => RaycastConfig.isDroppableSurface(i.object))

              if (validIntersects.length > 0) {
                const hit = validIntersects[0]
                wrapper.position.copy(hit.point)
              }
            }

            this.finalizeAssetAddition(wrapper, 'ExternalModel')
            finalObject = wrapper
          }
          return finalObject
        }
      } finally {
        URL.revokeObjectURL(url)
      }
      return null
    } catch (err) {
      console.error(`[AssetManager] Failed to load external model:`, err)
      return null
    }
  }

  /**
   * 从 IndexedDB 加载贴图数据并转化为 THREE.Texture
   */
  public async loadTextureFromDB(dbId: string): Promise<THREE.Texture | null> {
    try {
      const asset = await db.assets.get(dbId)
      if (!asset || !asset.data) return null
      
      this.registerAsset(dbId, '', 'texture', asset.type, asset.name)

      let blob: Blob
      if (asset.data instanceof Blob) {
        blob = asset.data
      } else if (asset.data instanceof ArrayBuffer) {
        blob = new Blob([asset.data], { type: asset.type })
      } else {
        return null
      }

      const url = URL.createObjectURL(blob)
      let texture: THREE.Texture

      const ext = (asset.type || '').toLowerCase()
      
      if (ext === 'hdr') {
        const loader = new HDRLoader()
        texture = await loader.loadAsync(url)
        texture.mapping = THREE.EquirectangularReflectionMapping
      } else if (ext === 'exr') {
        const loader = new EXRLoader()
        texture = await loader.loadAsync(url)
        texture.mapping = THREE.EquirectangularReflectionMapping
      } else {
        const loader = new THREE.TextureLoader()
        texture = await loader.loadAsync(url)
        texture.colorSpace = THREE.SRGBColorSpace
      }

      if (ext !== 'hdr' && ext !== 'exr') {
        texture.userData.previewUrl = url
      } else {
        URL.revokeObjectURL(url)
        texture.userData.previewUrl = asset.preview || null
      }
      
      texture.userData.dbId = dbId
      texture.name = asset.name
      return texture
    } catch (err) {
      console.error('[AssetManager] Failed to load texture from DB:', err)
      return null
    }
  }
}
