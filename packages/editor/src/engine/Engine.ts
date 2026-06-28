import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import { RectAreaLightUniformsLib } from 'three-stdlib'
import gsap from 'gsap'

import { SceneManager } from './managers/SceneManager'
import { AssetManager } from './managers/AssetManager'
import { SelectionManager } from './managers/SelectionManager'
import { TransformManager } from './managers/TransformManager'

export class Engine extends THREE.EventDispatcher<{ objectTransformChanged: { type: 'objectTransformChanged', object: THREE.Object3D } }> {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public orbitControls!: OrbitControls

  // Managers
  public sceneManager: SceneManager
  public assetManager: AssetManager
  public selectionManager: SelectionManager
  public transformManager: TransformManager

  public container: HTMLElement | null = null
  private animationFrameId: number | null = null
  private clock: THREE.Clock
  private resizeObserver: ResizeObserver | null = null

  // State
  public selectedObjectUuid: string | null = null
  public currentTransformMode: 'select' | 'translate' | 'rotate' | 'scale' = 'select'

  // Callbacks
  public onSceneGraphChanged?: () => void
  public onObjectSelected?: (uuid: string | null) => void

  /**
   * 初始化引擎，创建场景、相机和渲染器，并配置基础辅助工具
   */
  constructor() {
    super()
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0f172a) // default dark background
    
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.clock = new THREE.Clock()

    // Instantiate Managers
    this.sceneManager = new SceneManager(this)
    this.assetManager = new AssetManager(this)
    this.selectionManager = new SelectionManager(this)
    this.transformManager = new TransformManager(this)

    RectAreaLightUniformsLib.init()

    this.sceneManager.setupHelpers()
  }

  /**
   * 将引擎渲染器挂载到指定的 HTML 容器中
   * @param {HTMLElement} container - 要挂载的父容器
   */
  public mount(container: HTMLElement) {
    if (this.container) {
      console.warn('Engine is already mounted.')
      return
    }
    
    this.container = container
    this.container.appendChild(this.renderer.domElement)
    
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.05

    // Mount managers
    this.selectionManager.mount()
    this.transformManager.mount()

    // 移除 ResizeObserver，在 render 循环中进行自适应，以杜绝动画时的闪烁
    this.start()
  }

  /**
   * 从当前容器中卸载引擎并清理事件和动画帧
   */
  public unmount() {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    
    this.selectionManager.unmount()
    this.transformManager.unmount()

    if (this.orbitControls) {
      this.orbitControls.dispose()
    }

    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
    this.container = null
  }

  private onResize = () => {
    // 保留给 window resize 事件
  }

  public resize() {
    // 手动调用保留用于强制刷新，但实际逻辑移入 render 循环
  }

  /**
   * 开启渲染循环 (requestAnimationFrame)
   */
  public start() {
    if (this.animationFrameId !== null) return
    this.clock.start()
    this.animate()
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate)

    // Update helpers
    this.selectionManager.updateHelpers()

    this.render()
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
   */
  public render() {
    // 自动适配容器尺寸防闪烁
    if (this.container) {
      const width = this.container.clientWidth
      const height = this.container.clientHeight
      const canvas = this.renderer.domElement
      
      if (canvas.width !== width || canvas.height !== height) {
        this.renderer.setSize(width, height, false)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
      }
    }

    if (this.orbitControls) {
      this.orbitControls.update()
    }
    this.renderer.render(this.scene, this.camera)
  }

  // =========================================================
  // Facade Methods - Delegating to Managers
  // =========================================================

  public selectObjectByUuid(uuid: string | null) {
    this.selectionManager.selectObjectByUuid(uuid)
  }

  public removeObjectByUuid(uuid: string) {
    this.sceneManager.removeObjectByUuid(uuid)
  }

  public setTransformMode(mode: 'select' | 'translate' | 'rotate' | 'scale') {
    this.transformManager.setTransformMode(mode)
  }

  public setCameraControlType(type: string) {
    console.log('[Engine] Camera control type requested:', type)
  }

  public setCameraControlEnabled(enabled: boolean) {
    if (this.orbitControls) {
      this.orbitControls.enabled = enabled
    }
  }

  public setTheme(themeId: string) {
    this.sceneManager.setTheme(themeId)
  }

  public clearScene() {
    this.sceneManager.clearScene()
  }

  public loadScene(newScene: THREE.Scene) {
    this.sceneManager.loadScene(newScene)
  }

  public addAsset(type: string, clientX?: number, clientY?: number, payload?: any) {
    this.assetManager.addAsset(type, clientX, clientY, payload)
  }

  public focusObject(uuid: string) {
    const obj = this.scene.getObjectByProperty('uuid', uuid)
    if (!obj) return

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(obj)
    if (box.isEmpty()) return

    const center = new THREE.Vector3()
    box.getCenter(center)

    const size = new THREE.Vector3()
    box.getSize(size)

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
    
    // Offset to ensure object is fully visible
    cameraZ *= 1.5 
    
    // Prevent getting stuck inside small objects
    cameraZ = Math.max(cameraZ, 1)

    // Current view direction
    const direction = new THREE.Vector3().subVectors(this.camera.position, this.orbitControls.target).normalize()
    if (direction.lengthSq() < 0.0001) {
      direction.set(0, 0, 1) // Fallback direction
    }

    const newCamPos = center.clone().add(direction.multiplyScalar(cameraZ))

    // Update camera and controls using GSAP for smooth transition
    gsap.to(this.camera.position, {
      x: newCamPos.x,
      y: newCamPos.y,
      z: newCamPos.z,
      duration: 0.6,
      ease: 'power3.out',
      onUpdate: () => {
        this.camera.updateProjectionMatrix()
      }
    })

    gsap.to(this.orbitControls.target, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: 0.6,
      ease: 'power3.out',
      onUpdate: () => {
        this.orbitControls.update()
      }
    })
  }
}
