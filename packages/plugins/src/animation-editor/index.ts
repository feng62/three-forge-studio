import type { ForgeAppPlugin } from '@forge/types';
import AnimationEditorBottomPanel from './ui/AnimationEditorBottomPanel.vue';

/**
 * 动画编辑器插件
 * 提供底部的关键帧动画时间轴和轨道编辑功能
 */
export const AnimationEditorPlugin: ForgeAppPlugin = {
  /** 插件在系统中的唯一注册标识名称 */
  name: 'AnimationEditor',
  
  /** 插件提供的 UI 界面及注册配置 */
  ui: {
    /** 不提供侧边栏面板 */
    /** 提供底部的动画时间轴面板 */
    bottomPanel: AnimationEditorBottomPanel,
    /** 如果不需要侧边栏，这也可以省略 */
  }
  
  // 暂时不需要反序列化等核心功能
};
