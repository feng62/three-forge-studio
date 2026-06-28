import * as THREE from 'three'
import { Engine } from '../Engine'
import { RaycastConfig } from '../../config/RaycastConfig'
import { RectAreaLightHelper } from 'three-stdlib'

export class SelectionManager {
  private engine: Engine
  public raycaster: THREE.Raycaster
  public mouse: THREE.Vector2
  public boxHelper: THREE.BoxHelper
  
  public activeLightHelper: THREE.Object3D | null = null

  private clickStartPos = { x: 0, y: 0 }

  constructor(engine: Engine) {
    this.engine = engine
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // 包围盒辅助器 (初始不绑定对象，隐藏)
    this.boxHelper = new THREE.BoxHelper(new THREE.Mesh())
    this.boxHelper.visible = false
    this.boxHelper.material.depthTest = false // 让包围盒始终可见，不被模型挡住
    this.boxHelper.material.transparent = true;
    (this.boxHelper.material as THREE.LineBasicMaterial).color.setHex(0xffff00)
    this.boxHelper.userData.isHelper = true
  }

  /**
   * 将相关辅助工具挂载到场景中并绑定事件
   */
  public mount() {
    this.engine.scene.add(this.boxHelper)

    if (this.engine.container) {
      const dom = this.engine.renderer.domElement
      dom.addEventListener('pointerdown', this.onPointerDown)
      dom.addEventListener('pointerup', this.onPointerUp)
      dom.addEventListener('dblclick', this.onDoubleClick)
    }
  }

  /**
   * 卸载事件
   */
  public unmount() {
    if (this.engine.container) {
      const dom = this.engine.renderer.domElement
      dom.removeEventListener('pointerdown', this.onPointerDown)
      dom.removeEventListener('pointerup', this.onPointerUp)
      dom.removeEventListener('dblclick', this.onDoubleClick)
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    this.clickStartPos.x = e.clientX
    this.clickStartPos.y = e.clientY
  }

  private onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - this.clickStartPos.x
    const dy = e.clientY - this.clickStartPos.y
    // 如果位移超过 5 像素，认为是拖拽视角，不是点击
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return

    // 如果当前正在悬停或操作变换控制器（坐标轴），则忽略点击事件，防止误触取消选择
    if (this.engine.transformManager?.transformControls) {
      if ((this.engine.transformManager.transformControls as any).axis !== null) {
        return
      }
    }

    this.performRaycast(e.clientX, e.clientY, false)
  }

  private onDoubleClick = (e: MouseEvent) => {
    this.performRaycast(e.clientX, e.clientY, true)
  }

  private performRaycast(clientX: number, clientY: number, isDoubleClick: boolean = false) {
    if (!this.engine.container) return
    const rect = this.engine.container.getBoundingClientRect()
    
    // 计算标准设备坐标 (NDC: -1 to +1)
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.engine.camera)
    
    const intersects = this.raycaster.intersectObjects(this.engine.scene.children, true)
    
    // 过滤掉不可点击的物体
    const validIntersects = intersects.filter(i => RaycastConfig.isClickable(i.object))

    if (validIntersects.length > 0) {
      let hitObj = validIntersects[0].object

      // 如果不是双击，并且物体属于某个具名组或者是外部模型子节点，则向上查找到根部
      if (!isDoubleClick) {
        while (hitObj.parent && hitObj.parent !== this.engine.scene) {
          if (hitObj.userData && hitObj.userData.isExternalModel) {
            break
          }
          if (hitObj.name) {
            // Check if any parent has isExternalModel before breaking just for name
            let hasExternalModelParent = false;
            let p = hitObj.parent;
            while (p && p !== this.engine.scene) {
              if (p.userData && p.userData.isExternalModel) {
                hasExternalModelParent = true;
                break;
              }
              p = p.parent;
            }
            if (!hasExternalModelParent) break;
          }
          hitObj = hitObj.parent
        }
      }
      
      this.selectObjectByUuid(hitObj.uuid)
      if (this.engine.onObjectSelected) {
        this.engine.onObjectSelected(hitObj.uuid)
      }
    } else {
      // 点击空白处，取消选择
      this.selectObjectByUuid(null)
      if (this.engine.onObjectSelected) {
        this.engine.onObjectSelected(null)
      }
    }
  }

  /**
   * 供外部调用的选择对象接口 (同步 SceneTree)
   */
  public selectObjectByUuid(uuid: string | null) {
    this.engine.selectedObjectUuid = uuid
    
    // 清除当前的灯光辅助器
    if (this.activeLightHelper) {
      this.engine.scene.remove(this.activeLightHelper)
      if ((this.activeLightHelper as any).dispose) {
        (this.activeLightHelper as any).dispose()
      }
      this.activeLightHelper = null
    }

    if (!uuid) {
      this.boxHelper.visible = false
      if (this.engine.transformManager?.transformControls) {
        this.engine.transformManager.transformControls.detach()
      }
      return
    }

    const obj = this.engine.scene.getObjectByProperty('uuid', uuid)
    if (obj) {
      // 判断是否是灯光，添加灯光辅助器
      if ((obj as any).isLight) {
        switch (obj.type) {
          case 'PointLight':
            this.activeLightHelper = new THREE.PointLightHelper(obj as THREE.PointLight, 0.5)
            break
          case 'SpotLight':
            this.activeLightHelper = new THREE.SpotLightHelper(obj as THREE.SpotLight)
            break
          case 'DirectionalLight':
            this.activeLightHelper = new THREE.DirectionalLightHelper(obj as THREE.DirectionalLight, 1)
            break
          case 'RectAreaLight':
            this.activeLightHelper = new RectAreaLightHelper(obj as any)
            break
          default:
            // AmbientLight 等没有特定辅助器
            break
        }
        if (this.activeLightHelper) {
          this.activeLightHelper.userData.isHelper = true
          this.engine.scene.add(this.activeLightHelper)
        }
      }

      // 无论是否灯光，BoxHelper 可以选择显示 (或者灯光就隐藏包围盒)
      // 为了直观，灯光可以不显示黄色的方框包围盒
      if ((obj as any).isLight) {
        this.boxHelper.visible = false
      } else {
        this.boxHelper.setFromObject(obj)
        this.boxHelper.visible = true
        this.boxHelper.update()
      }
      
      // 如果当前模式不是 select，就附加 transformControls
      if (this.engine.currentTransformMode !== 'select' && this.engine.transformManager?.transformControls) {
        this.engine.transformManager.transformControls.attach(obj)
      } else if (this.engine.transformManager?.transformControls) {
        this.engine.transformManager.transformControls.detach()
      }
    } else {
      this.boxHelper.visible = false
    }
  }

  /**
   * 在主渲染循环中调用，更新可能存在的辅助器
   */
  public updateHelpers() {
    if (this.activeLightHelper && (this.activeLightHelper as any).update) {
      (this.activeLightHelper as any).update()
    }
  }
}
