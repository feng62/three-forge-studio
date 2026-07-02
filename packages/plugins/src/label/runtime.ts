import { LabelCorePlugin } from './core'
import { LabelForgePlugin } from './serializer'

/**
 * 标签系统运行时组合插件
 * 供非编辑器的纯渲染环境（如 Preview 预览页或外部独立打包应用）使用。
 * 自动向引擎注册核心渲染模块和反序列化器。
 */
export class LabelRuntimePlugin {
  name = 'Label_Runtime_Bundle'
  
  private serializer = new LabelForgePlugin()

  onInstall(engine: any) {
    engine.use(LabelCorePlugin)
    engine.use(this.serializer)
  }
}

// 导出一个默认实例供快速引入
export const labelRuntime = new LabelRuntimePlugin()
