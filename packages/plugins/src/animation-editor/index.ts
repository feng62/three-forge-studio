import type { ForgeAppPlugin } from '@forge/types';
import AnimationEditorBottomPanel from './ui/AnimationEditorBottomPanel.vue';
import AnimationEditorPanel from './ui/AnimationEditorPanel.vue';

/**
 * 动画编辑器插件
 * 提供底部的关键帧动画时间轴和侧边栏的轨道片段管理功能
 */
export const AnimationEditorPlugin: ForgeAppPlugin = {
  /** 插件在系统中的唯一注册标识名称 */
  name: 'AnimationEditor',
  
  /** 插件提供的 UI 界面及注册配置 */
  ui: {
    /** 侧边栏的动画列表面板 */
    panel: AnimationEditorPanel,
    tabLabel: ['动画', '编辑'],
    /** 提供底部的动画时间轴面板 */
    bottomPanel: AnimationEditorBottomPanel,
  }
  
  // 暂时不需要反序列化等核心功能
};
