export * from './core'
export * from './editor'
export * from './serializer'
export * from './types'

import CameraAnimationPanel from './ui/Panel.vue'
import { CameraAnimationForgePlugin } from './serializer'
import { CameraAnimationEditorPlugin } from './editor'
import type { ForgeAppPlugin } from '@forge/types'

/**
 * 视角漫游插件包总入口
 * 在此文件导出统一的插件 Bundle 对象，供主程序注册加载
 */
export const CameraAnimationPlugin: ForgeAppPlugin = {
  /** 插件在系统中的唯一注册标识名称 */
  name: 'CameraAnimation',
  
  /** 插件提供的 UI 界面及注册配置 */
  ui: {
    /** 侧边栏面板对应的 Vue 组件 */
    panel: CameraAnimationPanel,
    /** UI 左侧标签页显示的文字（支持按行拆分） */
    tabLabel: ['视角', '漫游']
  },
  
  /** 插件专属的数据序列化器实例，将被自动挂载至 IndexedDB 的存取流水线中 */
  serializer: new CameraAnimationForgePlugin(),
  
  /** 插件的核心业务逻辑（处理引擎层面的动画和数据流） */
  core: CameraAnimationEditorPlugin
}
