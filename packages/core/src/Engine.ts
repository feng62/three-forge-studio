import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { OrbitControls } from 'three-stdlib'
import { RectAreaLightUniformsLib } from 'three-stdlib'
import { ForgeSceneJSON, ForgePlugin } from '@forge/types'
import { ForgeDeserializer } from '@forge/utils'
import { PreviewExternalModelPlugin } from './plugins/PreviewExternalModelPlugin'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

export class Engine {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: WebGPURenderer
  public orbitControls!: OrbitControls

  public container: HTMLElement | null = null
  private isAnimating: boolean = false
  private timer: THREE.Timer
  private plugins: ForgePlugin[] = []

  /**
   * 初始化核心引擎，包含 WebGPU 渲染器、场景和相机
   */
  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0f172a)
    
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)
    
    this.renderer = new WebGPURenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.timer = new THREE.Timer()

    RectAreaLightUniformsLib.init()

    // 默认内置注册外部模型解析插件
    this.use(new PreviewExternalModelPlugin())
  }

  /**
   * 注册插件（如 ExternalModelPlugin, ScriptPlugin 等）
   */
  public use(plugin: ForgePlugin) {
    this.plugins.push(plugin)
    return this
  }

  /**
   * 通过给定的 Forge JSON 数据反序列化重建场景
   * @param json 序列化好的项目数据
   */
  public async loadJSON(json: ForgeSceneJSON) {
    // 注入 JSON registry 到插件
    for (const plugin of this.plugins) {
      if (typeof (plugin as any).setRegistry === 'function') {
        (plugin as any).setRegistry(json.assets?.registry || []);
      }
    }

    const deserializer = new ForgeDeserializer(this.plugins)
    const report = await deserializer.deserialize(json)
    
    if (report.status === 'FATAL') {
      throw new Error(`Failed to load JSON: ${report.errors.join(', ')}`)
    }

    if (report.scene) {
      const loadedScene = report.scene as THREE.Scene
      // 保持现有的环境，仅替换子节点
      this.scene.clear()
      while (loadedScene.children.length > 0) {
        this.scene.add(loadedScene.children[0])
      }
      
      // 1. 处理背景和环境光 (因为原生 ObjectLoader 无法直接加载 HDR)
      if (json.scene?.background || json.scene?.environment) {
        await this.resolveEnvironment(json)
      } else {
        if (loadedScene.background) this.scene.background = loadedScene.background
        if (loadedScene.environment) this.scene.environment = loadedScene.environment
      }

      // 2. 处理相机的接管
      let loadedCamera = this.scene.getObjectByName('MainCamera') || this.scene.getObjectByProperty('type', 'PerspectiveCamera')
      if (loadedCamera && (loadedCamera as any).isPerspectiveCamera) {
        this.camera = loadedCamera as THREE.PerspectiveCamera
        if (this.orbitControls) {
          this.orbitControls.object = this.camera
          if (this.camera.userData.orbitTarget) {
            this.orbitControls.target.set(
              this.camera.userData.orbitTarget.x,
              this.camera.userData.orbitTarget.y,
              this.camera.userData.orbitTarget.z
            )
          } else {
            this.orbitControls.target.set(0, 0, 0)
          }
          this.orbitControls.update()
        }
        this.onResize()
      }
    }
    return report
  }

  /**
   * 手动解析并加载 HDR 背景和环境贴图
   */
  private async resolveEnvironment(json: ForgeSceneJSON) {
    const bgUuid = json.scene?.background
    const envUuid = json.scene?.environment

    const loadTexture = async (textureUuid: string) => {
      // 1. 从 textures 中找到 texture 节点
      const texNode = json.assets?.textures?.find(t => t.uuid === textureUuid)
      if (!texNode) return null
      
      // 2. 找到对应的 registry 资产 uuid (用户指定存储在 userData.dbId)
      const assetUuid = texNode.userData?.dbId
      if (!assetUuid) return null

      // 3. 在 registry 中寻找对应的 url
      const regItem = json.assets?.registry?.find(r => r.uuid === assetUuid)
      if (!regItem || !regItem.url) return null

      const ext = (regItem.format || regItem.url.split('.').pop() || '').toLowerCase()
      if (ext === 'hdr') {
        const loader = new HDRLoader()
        const texture = await loader.loadAsync(regItem.url)
        texture.mapping = THREE.EquirectangularReflectionMapping
        return texture
      } else {
        const loader = new THREE.TextureLoader()
        const texture = await loader.loadAsync(regItem.url)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.mapping = THREE.EquirectangularReflectionMapping
        return texture
      }
    }

    if (bgUuid) {
      if (typeof bgUuid === 'number') {
        this.scene.background = new THREE.Color(bgUuid)
      } else if (typeof bgUuid === 'string') {
        const tex = await loadTexture(bgUuid)
        if (tex) this.scene.background = tex
      }
    }

    if (envUuid && typeof envUuid === 'string') {
      const tex = await loadTexture(envUuid)
      if (tex) this.scene.environment = tex
    }
  }

  /**
   * 挂载到 HTML 容器上，完成 WebGPU 初始化
   */
  public async mount(container: HTMLElement) {
    if (this.container) {
      console.warn('Engine is already mounted.')
      return
    }
    
    this.container = container
    this.container.appendChild(this.renderer.domElement)
    
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.05

    await this.renderer.init()
    
    window.addEventListener('resize', this.onResize)
    this.onResize()

    // 默认不自动启动，由外部调用 start()
  }

  public unmount() {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
    this.container = null
  }

  private onResize = () => {
    if (!this.container) return
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
  }

  /**
   * 启动渲染循环
   */
  public start() {
    if (this.isAnimating) return
    this.isAnimating = true
    this.renderer.setAnimationLoop(this.animate)
  }

  /**
   * 停止渲染循环
   */
  public stop() {
    this.isAnimating = false
    this.renderer.setAnimationLoop(null)
  }

  private animate = () => {
    if (!this.isAnimating) return
    
    this.timer.update()
    const delta = this.timer.getDelta()
    
    if (this.orbitControls) {
      this.orbitControls.update()
    }

    // 触发所有插件的 tick 钩子
    for (const plugin of this.plugins) {
      if (typeof (plugin as any).tick === 'function') {
        (plugin as any).tick(delta)
      }
    }

    this.renderer.render(this.scene, this.camera)
  }
}
