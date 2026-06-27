import * as THREE from 'three'
import { ControlsManager, ControlType } from './managers/ControlsManager'

export class Engine {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controlsManager!: ControlsManager

  private container: HTMLElement | null = null
  private animationFrameId: number | null = null
  private clock: THREE.Clock

  public onSceneGraphChanged?: () => void

  /**
   * 初始化引擎，创建场景、相机和渲染器，并配置基础辅助工具
   */
  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0f172a) // default dark background
    
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.clock = new THREE.Clock()

    this.setupHelpers()
  }

  /**
   * 初始化场景中的辅助工具，例如网格和坐标轴
   */
  private setupHelpers() {
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    grid.userData.isHelper = true
    this.scene.add(grid)

    const axes = new THREE.AxesHelper(2)
    axes.userData.isHelper = true
    this.scene.add(axes)

    // 添加测试用的模拟 Box
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const randomColor = Math.floor(Math.random() * 0xffffff)
    const material = new THREE.MeshBasicMaterial({ color: randomColor, wireframe: true })
    const mockBox = new THREE.Mesh(geometry, material)
    mockBox.position.set(0, 0.5, 0)
    mockBox.name = 'MockTestBox'
    
    // 给测试 Box 挂载一个模拟的 dirtyOverrides 用于测试序列化
    mockBox.userData = {
      dirtyOverrides: {
        position: { x: 0, y: 0.5, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    }
    this.scene.add(mockBox)
  }

  /**
   * 将引擎渲染器挂载到指定的 HTML 容器中，并初始化 ControlsManager
   * @param {HTMLElement} container - 要挂载的父容器
   */
  public mount(container: HTMLElement) {
    if (this.container) {
      console.warn('Engine is already mounted.')
      return
    }
    
    this.container = container
    this.container.appendChild(this.renderer.domElement)
    
    this.controlsManager = new ControlsManager(this, this.renderer.domElement)

    this.resize()
    window.addEventListener('resize', this.onResize)
    
    this.start()
  }

  /**
   * 从当前容器中卸载引擎并清理事件和动画帧
   */
  public unmount() {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    if (this.controlsManager) {
      this.controlsManager.dispose()
    }
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
    this.container = null
  }

  private onResize = () => {
    this.resize()
  }

  /**
   * 处理画布调整大小事件，更新相机的纵横比和渲染器的尺寸
   */
  public resize() {
    if (!this.container) return
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
  }

  /**
   * 开启渲染循环 (requestAnimationFrame)
   */
  public start() {
    if (this.animationFrameId !== null) return
    this.clock.start()
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop)
      this.render()
    }
    loop()
  }

  /**
   * 停止渲染循环
   */
  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 每一帧调用的渲染函数
   * 更新控制器状态并将当前场景与相机推送到渲染器
   */
  public render() {
    const delta = this.clock.getDelta()
    const time = this.clock.getElapsedTime()

    if (this.controlsManager) {
      this.controlsManager.update(delta, time)
    }

    this.renderer.render(this.scene, this.camera)
  }

  /**
   * 从外部状态管理器调用 (如 Pinia)
   * 触发模型变换模式 (移动、旋转、缩放等)
   * @param {'select' | 'translate' | 'rotate' | 'scale'} mode - 变换模式
   */
  public setTransformMode(mode: 'select' | 'translate' | 'rotate' | 'scale') {
    console.log('[Engine] Transform mode updated:', mode)
    // TODO: implement TransformControls integration here
  }

  /**
   * 更新当前的相机控制器类型 (如 Orbit, Fly, FPS)
   * @param {ControlType} type - 控制器类型标识符
   */
  public setCameraControlType(type: ControlType) {
    if (this.controlsManager) {
      this.controlsManager.setControlType(type)
    }
  }

  /**
   * 开启或禁用当前的相机控制器操作
   * @param {boolean} enabled - 是否允许相机控制
   */
  public setCameraControlEnabled(enabled: boolean) {
    if (this.controlsManager) {
      this.controlsManager.setEnable(enabled)
    }
  }

  /**
   * 更新 Three.js 的场景背景以匹配系统当前选择的主题。
   * 对于玻璃拟态主题(Glassmorphism)，背景会被设置为 null，使得通过 CSS 控制的渐变色能够透过画笔展示。
   * 其他的主题则直接赋上相应的实心 THREE.Color 以匹配界面氛围。
   * @param {string} themeId - 从 themeStore 传来的主题标识符
   */
  public setTheme(themeId: string) {
    switch (themeId) {
      case 'theme-glass':
        this.scene.background = null // Let CSS show through
        break
      case 'theme-industrial':
        this.scene.background = new THREE.Color(0x1a1a1a)
        break
      case 'theme-pro':
      default:
        this.scene.background = new THREE.Color(0x0f172a)
        break
    }
  }

  /**
   * 清空并释放当前场景的所有网格和对象，恢复为一个崭新的工作区
   */
  public clearScene() {
    // 保留辅助工具和背景，只清除我们添加的模型等
    const objectsToRemove: THREE.Object3D[] = []
    
    this.scene.children.forEach(child => {
      // 不清除我们自己加的基础网格和坐标系 (isGridHelper / isAxesHelper 可用来判断)
      if (child.type === 'GridHelper' || child.type === 'AxesHelper') return
      objectsToRemove.push(child)
    })

    objectsToRemove.forEach(obj => {
      this.scene.remove(obj)
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
    console.log('[Engine] Scene cleared')
    if (this.onSceneGraphChanged) {
      this.onSceneGraphChanged()
    }
  }

  /**
   * 将反序列化后的新场景完整导入并替换当前场景
   * @param {THREE.Scene} newScene - 解析出来的新场景对象
   */
  public loadScene(newScene: THREE.Scene) {
    // 停止渲染循环防抖
    this.stop()
    
    // 我们保留原本相机的挂载，只把 newScene 的 child 都搬过来，或者直接替换 scene
    // 为了省事，直接拿新的 scene 顶掉旧的，但是要重新加上网格等 helpers
    this.scene = newScene
    
    // 如果导入的场景没有设置背景，给他赋个默认值以防全黑
    if (!this.scene.background) {
      this.scene.background = new THREE.Color(0x0f172a)
    }

    // 重新补充基础辅助工具
    let hasGrid = false
    let hasAxes = false
    this.scene.children.forEach(c => {
      if (c.type === 'GridHelper') hasGrid = true
      if (c.type === 'AxesHelper') hasAxes = true
    })
    
    if (!hasGrid) {
      const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
      grid.userData.isHelper = true
      this.scene.add(grid)
    }
    if (!hasAxes) {
      const axes = new THREE.AxesHelper(2)
      axes.userData.isHelper = true
      this.scene.add(axes)
    }

    console.log('[Engine] New scene loaded successfully', this.scene)
    if (this.onSceneGraphChanged) {
      this.onSceneGraphChanged()
    }
    this.start()
  }
}
