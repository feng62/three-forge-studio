import * as THREE from 'three'
import { Engine } from '../Engine'
import { AddObjectCommand } from '../../history/AddObjectCommand'
import { SetMaterialCommand } from '../../history/SetMaterialCommand'
import { historyManager } from '../../history/HistoryManager'
import { RaycastConfig } from '../../config/RaycastConfig'
import { GLTFLoader, FBXLoader } from 'three-stdlib'
import ModelWorker from '../../db/modelWorker?worker'

export class AssetManager {
  private engine: Engine
  private worker: Worker

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

    switch (type) {
      case 'Box':
        obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
        obj.name = 'Box'
        yOffset = 0.5
        break
      case 'Sphere':
        obj = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), material)
        obj.name = 'Sphere'
        yOffset = 0.5
        break
      case 'Plane':
        obj = new THREE.Mesh(
          new THREE.PlaneGeometry(5, 5), 
          new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide })
        )
        obj.name = 'Plane'
        obj.rotation.x = -Math.PI / 2
        yOffset = 0.01 // 稍微抬高一点防止z-fighting
        break
      case 'Cylinder':
        obj = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), material)
        obj.name = 'Cylinder'
        yOffset = 0.5
        break
      case 'AmbientLight':
        obj = new THREE.AmbientLight(0xffffff, 0.5)
        obj.name = 'AmbientLight'
        yOffset = 0
        break
      case 'PointLight':
        obj = new THREE.PointLight(0xffffff, 1, 100)
        obj.name = 'PointLight'
        yOffset = 2
        break
      case 'SpotLight':
        obj = new THREE.SpotLight(0xffffff, 1)
        obj.name = 'SpotLight';
        (obj as THREE.SpotLight).angle = Math.PI / 6
        yOffset = 5
        break
      case 'DirectionalLight':
        obj = new THREE.DirectionalLight(0xffffff, 1)
        obj.name = 'DirectionalLight'
        yOffset = 5
        break
      case 'RectAreaLight':
        obj = new THREE.RectAreaLight(0xffffff, 5, 2, 2)
        obj.name = 'RectAreaLight'
        obj.lookAt(0, 0, 0)
        yOffset = 3
        break
    }

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
      let newMaterial: THREE.Material | null = null
      const color = 0xcccccc
      
      switch (type) {
        case 'Material_Basic':
          newMaterial = new THREE.MeshBasicMaterial({ color })
          newMaterial.name = '基础材质'
          break
        case 'Material_Standard':
          newMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 })
          newMaterial.name = '标准材质'
          break
        case 'Material_Physical':
          newMaterial = new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0.1, clearcoat: 1.0 })
          newMaterial.name = '物理材质'
          break
        case 'Material_Lambert':
          newMaterial = new THREE.MeshLambertMaterial({ color })
          newMaterial.name = '兰伯特材质'
          break
        case 'Material_Phong':
          newMaterial = new THREE.MeshPhongMaterial({ color, shininess: 30 })
          newMaterial.name = '冯氏材质'
          break
        case 'Material_Metal':
          newMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 1.0 })
          newMaterial.name = '金属材质'
          break
        case 'Material_Glass':
          newMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0xffffff, transmission: 1.0, opacity: 1, transparent: true, roughness: 0.1, ior: 1.5 
          })
          newMaterial.name = '玻璃材质'
          break
        case 'Material_Depth':
          newMaterial = new THREE.MeshDepthMaterial()
          newMaterial.name = '深度材质'
          break
        case 'Material_Normal':
          newMaterial = new THREE.MeshNormalMaterial()
          newMaterial.name = '法线材质'
          break
        case 'Material_Wireframe':
          newMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
          newMaterial.name = '线框材质'
          break
      }

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
   * 从 IndexedDB 通过 Web Worker 加载外部模型并加入场景
   * @param {number} id - 模型在 DB 中的 ID
   * @param {number} [clientX] - 落点 X
   * @param {number} [clientY] - 落点 Y
   * @param {THREE.Object3D} [attachTo] - 可选，直接挂载到指定的节点而不是主场景
   */
  public async loadExternalModelFromDB(id: number, clientX?: number, clientY?: number, attachTo?: THREE.Object3D): Promise<THREE.Object3D | null> {
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
      
      try {
        let loadedObject: THREE.Object3D | null = null

        if (ext === 'gltf' || ext === 'glb') {
          const loader = new GLTFLoader()
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
                placed = true
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
    } catch (err) {
      console.error(`[AssetManager] Error loading external model from DB:`, err)
    }
    return null
  }
}
