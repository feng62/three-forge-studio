import gsap from 'gsap'
import type { Viewpoint, TransitionSetting } from './types'

/**
 * 视角漫游核心控制插件
 * 负责解析视角数据，利用 GSAP 驱动相机的位姿补间动画，并控制场景内模型的显隐状态。
 */
export const CameraAnimationCorePlugin = {
  name: 'Forge_CameraAnimation_Core',
  
  /** 三维引擎实例引用 */
  engine: null as any,
  /** 当前正处于的视角 ID */
  currentViewpointId: null as string | null,
  /** 记忆模式的缓存，用于临时存储用户在某视角下游离后的相机位姿 */
  memoryCache: new Map<string, { position: { x: number, y: number, z: number }, lookAt: { x: number, y: number, z: number } }>(),

  /**
   * 插件挂载时的初始化回调
   * @param core 传入的三维引擎 Engine 实例
   */
  onInstall(core: any) {
    this.engine = core
    console.log("CameraAnimation Core Plugin Installed")
  },

  /**
   * 切换到目标视角
   * @param viewpoint 目标视角的详细配置数据
   * @param viewpoints 所有的视角列表（用于判断前进还是返回逻辑）
   * @param onComplete 切换动画完成后的回调函数
   */
  switchToViewpoint(viewpoint: Viewpoint, viewpoints: Viewpoint[], onComplete?: () => void) {
    if (!this.engine || !this.engine.camera) return

    // 1. 判断过渡动画所使用的配置
    // 如果是往后方的视角切换（即目标索引 > 当前索引），使用“前进进入配置 (enterSetting)”
    // 如果是往前面的视角切换（即目标索引 < 当前索引），使用“退出返回配置 (exitSetting)”
    // 若从无关场景首次进入，默认使用“前进进入配置”
    let isForward = true
    
    if (this.currentViewpointId) {
      const currentIndex = viewpoints.findIndex(v => v.id === this.currentViewpointId)
      const targetIndex = viewpoints.findIndex(v => v.id === viewpoint.id)
      if (currentIndex !== -1 && targetIndex !== -1 && targetIndex < currentIndex) {
        isForward = false
      }
    }

    const setting: TransitionSetting = isForward ? viewpoint.enterSetting : viewpoint.exitSetting

    // 2. 如果之前所处的视角开启了“记忆模式”，在离开前先将其当前实际相机的位姿缓存起来
    this.saveMemoryIfEnabled(viewpoints)

    // 3. 确定目标相机的最终位姿
    // 如果目标视角开启了“记忆模式”，且缓存中存在该视角的游离位姿，则优先使用缓存数据
    let targetPos = viewpoint.cameraPosition
    let targetLookAt = viewpoint.cameraLookAt

    if (viewpoint.memoryMode && this.memoryCache.has(viewpoint.id)) {
      const cached = this.memoryCache.get(viewpoint.id)!
      targetPos = cached.position
      targetLookAt = cached.lookAt
    }

    // 更新场景中所有模型的显隐状态 (当前采用瞬间切换机制，无需动画过渡)
    this.applyVisibility(viewpoint.hiddenModels)

    // 4. 执行相机过渡动画
    if (setting.hasAnimation && setting.duration > 0) {
      const controls = this.engine.orbitControls
      // 获取当前相机的焦点（若存在 OrbitControls 则取其 target，否则默认为原点）
      const currentLookAt = controls?.target ? controls.target.clone() : { x: 0, y: 0, z: 0 }
      
      // 构建一个包含位置和焦点的临时数据对象，供 GSAP 进行数值补间
      const animData = {
        posX: this.engine.camera.position.x,
        posY: this.engine.camera.position.y,
        posZ: this.engine.camera.position.z,
        lookX: currentLookAt.x,
        lookY: currentLookAt.y,
        lookZ: currentLookAt.z
      }

      gsap.to(animData, {
        posX: targetPos.x,
        posY: targetPos.y,
        posZ: targetPos.z,
        lookX: targetLookAt.x,
        lookY: targetLookAt.y,
        lookZ: targetLookAt.z,
        duration: setting.duration,
        ease: setting.easing || 'power2.inOut',
        // 每一帧动画更新时，将计算出的数值同步给相机与控制器
        onUpdate: () => {
          this.engine.camera.position.set(animData.posX, animData.posY, animData.posZ)
          if (controls && controls.target) {
            controls.target.set(animData.lookX, animData.lookY, animData.lookZ)
            controls.update()
          } else {
            this.engine.camera.lookAt(animData.lookX, animData.lookY, animData.lookZ)
          }
          // 手动触发渲染器渲染一帧
          this.engine.renderer.render(this.engine.scene, this.engine.camera)
        },
        onComplete: () => {
          this.currentViewpointId = viewpoint.id
          if (onComplete) onComplete()
        }
      })
    } else {
      // 若未开启过渡动画，则瞬间跳转到目标位姿
      this.engine.camera.position.set(targetPos.x, targetPos.y, targetPos.z)
      const controls = this.engine.orbitControls
      if (controls && controls.target) {
        controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z)
        controls.update()
      } else {
        this.engine.camera.lookAt(targetLookAt.x, targetLookAt.y, targetLookAt.z)
      }
      this.engine.renderer.render(this.engine.scene, this.engine.camera)
      this.currentViewpointId = viewpoint.id
      if (onComplete) onComplete()
    }
  },

  /**
   * 将当前相机状态保存至内存缓存中（仅针对开启了记忆模式的视角）
   * @param viewpoints 当前完整的视角列表数据
   */
  saveMemoryIfEnabled(viewpoints: Viewpoint[]) {
    if (!this.currentViewpointId) return
    const vp = viewpoints.find(v => v.id === this.currentViewpointId)
    if (vp && vp.memoryMode) {
      const controls = this.engine.orbitControls
      const currentLookAt = controls?.target ? controls.target.clone() : { x: 0, y: 0, z: 0 }
      
      this.memoryCache.set(vp.id, {
        position: { x: this.engine.camera.position.x, y: this.engine.camera.position.y, z: this.engine.camera.position.z },
        lookAt: { x: currentLookAt.x, y: currentLookAt.y, z: currentLookAt.z }
      })
    }
  },

  /**
   * 批量应用模型的隐藏/显示状态
   * @param hiddenModels 需要被隐藏的模型 UUID 数组
   */
  applyVisibility(hiddenModels: string[]) {
    if (!this.engine || !this.engine.scene) return
    this.engine.scene.traverse((child: any) => {
      // 仅对实体模型、组节点和外部模型操作，过滤掉所有辅助标识对象（Helper）
      if ((child.isMesh || child.isGroup || child.isObject3D) && !child.userData?.isHelper) {
        if (hiddenModels.includes(child.uuid)) {
          child.visible = false
        } else {
          child.visible = true
        }
      }
    })
  }
}
