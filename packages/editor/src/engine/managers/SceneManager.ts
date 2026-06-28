import * as THREE from 'three'
import { Engine } from '../Engine'
import { RemoveObjectCommand } from '../../history/RemoveObjectCommand'
import { historyManager } from '../../history/HistoryManager'

export class SceneManager {
  private engine: Engine

  constructor(engine: Engine) {
    this.engine = engine
  }

  /**
   * 初始化场景中的辅助工具，例如网格和坐标轴
   */
  public setupHelpers() {
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    grid.userData.isHelper = true
    this.engine.scene.add(grid)

    const axes = new THREE.AxesHelper(2)
    axes.userData.isHelper = true
    this.engine.scene.add(axes)

    // 添加默认环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    ambientLight.name = 'AmbientLight'
    this.engine.scene.add(ambientLight)

    // 添加默认自然光 (半球光)
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
    hemisphereLight.position.set(0, 10, 0)
    hemisphereLight.name = 'HemisphereLight'
    this.engine.scene.add(hemisphereLight)

    // 添加默认平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.name = 'DirectionalLight'
    this.engine.scene.add(directionalLight)
  }

  /**
   * 更新 Three.js 的场景背景以匹配系统当前选择的主题。
   */
  public setTheme(themeId: string) {
    switch (themeId) {
      case 'theme-glass':
        this.engine.scene.background = null // Let CSS show through
        break
      case 'theme-industrial':
        this.engine.scene.background = new THREE.Color(0x1a1a1a)
        break
      case 'theme-pro':
      default:
        this.engine.scene.background = new THREE.Color(0x0f172a)
        break
    }
  }

  /**
   * 清空并释放当前场景的所有网格和对象，恢复为一个崭新的工作区
   */
  public clearScene() {
    // 保留辅助工具和背景，只清除我们添加的模型等
    const objectsToRemove: THREE.Object3D[] = []
    
    this.engine.scene.children.forEach(child => {
      // 不清除我们自己加的基础网格、坐标系、相机和基础灯光
      if (
        child.type === 'GridHelper' || 
        child.type === 'AxesHelper' || 
        child.name === 'MainCamera' ||
        child.name === 'AmbientLight' ||
        child.name === 'HemisphereLight' ||
        child.name === 'DirectionalLight'
      ) {
        return
      }
      objectsToRemove.push(child)
    })

    objectsToRemove.forEach(obj => {
      this.engine.scene.remove(obj)
      if ((obj as any).geometry) {
        (obj as any).geometry.dispose()
      }
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose())
        } else {
          (obj as any).material.dispose()
        }
      }
    })
    console.log('[SceneManager] Scene cleared')
    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged()
    }
  }

  /**
   * 将反序列化后的新场景完整导入并替换当前场景
   */
  public loadScene(newScene: THREE.Scene) {
    // 停止渲染循环防抖
    this.engine.stop()
    
    this.engine.scene = newScene
    
    // 查找导入的场景中是否包含名为 MainCamera 的相机
    let loadedCamera = this.engine.scene.getObjectByName('MainCamera') as THREE.PerspectiveCamera
    if (loadedCamera && loadedCamera.isPerspectiveCamera) {
      this.engine.camera = loadedCamera
      
      if (this.engine.orbitControls) {
        this.engine.orbitControls.object = this.engine.camera
        
        if (loadedCamera.userData.orbitTarget) {
          this.engine.orbitControls.target.set(
            loadedCamera.userData.orbitTarget.x,
            loadedCamera.userData.orbitTarget.y,
            loadedCamera.userData.orbitTarget.z
          )
        } else {
          this.engine.orbitControls.target.set(0, 0, 0)
        }
        
        this.engine.orbitControls.update()
      }
      if (this.engine.transformManager?.transformControls) {
        (this.engine.transformManager.transformControls as any).camera = this.engine.camera
      }
      
      this.engine.resize()
    } else {
      // 如果没有名为 MainCamera 的相机，就把当前的塞进去
      this.engine.camera.name = 'MainCamera'
      this.engine.scene.add(this.engine.camera)
    }

    if (!this.engine.scene.background) {
      this.engine.scene.background = new THREE.Color(0x0f172a)
    }

    // 重新补充基础辅助工具
    let hasGrid = false
    let hasAxes = false
    this.engine.scene.children.forEach(c => {
      if (c.type === 'GridHelper') hasGrid = true
      if (c.type === 'AxesHelper') hasAxes = true
    })
    
    if (!hasGrid) {
      const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
      grid.userData.isHelper = true
      this.engine.scene.add(grid)
    }
    if (!hasAxes) {
      const axes = new THREE.AxesHelper(2)
      axes.userData.isHelper = true
      this.engine.scene.add(axes)
    }

    // 重新将包围盒挂载到新场景中
    if (this.engine.selectionManager?.boxHelper) {
      this.engine.scene.add(this.engine.selectionManager.boxHelper)
    }
    
    // 重新将变换控件挂载到新场景中
    if (this.engine.transformManager?.transformControls) {
      this.engine.scene.add(this.engine.transformManager.transformControls)
    }

    console.log('[SceneManager] New scene loaded successfully')
    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged()
    }
    this.engine.start()
  }

  /**
   * 删除指定的对象
   */
  public removeObjectByUuid(uuid: string) {
    const obj = this.engine.scene.getObjectByProperty('uuid', uuid)
    // 防止删除核心组件
    if (obj && obj !== this.engine.scene && !obj.userData.isHelper && obj.name !== 'MainCamera') {
      // 使用历史记录系统执行删除命令
      const cmd = new RemoveObjectCommand(this.engine, obj)
      historyManager.execute(cmd)
    }
  }
}
