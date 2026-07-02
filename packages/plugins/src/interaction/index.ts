export * from './core';
export * from './editor';
export * from './serializer';
export * from './types';
export * from './runtime';

import InteractionPanel from './ui/Panel.vue';
import { InteractionForgePlugin } from './serializer';
import { InteractionEditorPlugin } from './editor';
import { InteractionCorePlugin } from './core';
import type { ForgeAppPlugin } from '@forge/types';

/**
 * 鼠标交互事件插件包总入口
 * 导出一个统一的 Bundle 对象供主程序注册
 */
export const InteractionPlugin: ForgeAppPlugin = {
  name: 'InteractionEvents',
  
  ui: {
    panel: InteractionPanel,
    tabLabel: ['交互', '事件']
  },
  
  serializer: new InteractionForgePlugin(),
  
  core: InteractionEditorPlugin,

  runtime: InteractionCorePlugin
};
