import { InteractionCorePlugin } from './core'
import { InteractionForgePlugin } from './serializer'

/**
 * 鼠标交互运行时组合插件
 * 供非编辑器的纯渲染环境（如 Preview 预览页或外部独立打包应用）使用。
 * 避免了引入包含 Vue 组件等完整 AppPlugin 导致的打包体积臃肿。
 */
export class InteractionRuntimePlugin {
  name = 'Interaction_Runtime_Bundle'
  
  private serializer = new InteractionForgePlugin()

  /**
   * 当被 engine.use 挂载时触发，自动向引擎注册内部真正干活的核心模块和反序列化器
   */
  onInstall(engine: any) {
    engine.use(InteractionCorePlugin)
    engine.use(this.serializer)
  }
}

// 导出一个默认实例供快速引入
export const interactionRuntime = new InteractionRuntimePlugin()
