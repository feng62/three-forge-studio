import { CameraAnimationCorePlugin } from './core'
import { CameraAnimationForgePlugin } from './serializer'

/**
 * 视角漫游运行时组合插件
 * 专门供非编辑器的纯渲染环境（如 Preview 预览页或外部独立打包应用）使用。
 * 这样做避免了引入包含 Vue 组件等完整 AppPlugin 导致的打包体积臃肿。
 */
export class CameraAnimationRuntimePlugin {
  name = 'CameraAnimation_Runtime_Bundle'
  
  private serializer = new CameraAnimationForgePlugin()

  /**
   * 当被 engine.use 挂载时触发，自动向引擎注册内部真正干活的核心模块和反序列化器
   */
  onInstall(engine: any) {
    engine.use(CameraAnimationCorePlugin)
    engine.use(this.serializer)
  }

  // ========== 代理向外暴露的便捷业务 API ==========

  /**
   * 获取场景中已配置的所有视角列表
   */
  getViewpoints() {
    return CameraAnimationCorePlugin.getViewpoints()
  }

  /**
   * 切换到目标视角
   * @param viewpoint 目标视角的配置数据
   * @param viewpoints 所有的视角列表
   * @param onComplete 完成后的回调
   */
  switchToViewpoint(viewpoint: any, viewpoints: any[], onComplete?: () => void) {
    CameraAnimationCorePlugin.switchToViewpoint(viewpoint, viewpoints, onComplete)
  }
}

// 导出一个默认实例供快速引入
export const cameraAnimationRuntime = new CameraAnimationRuntimePlugin()
