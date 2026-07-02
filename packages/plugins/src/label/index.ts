export * from './core';
export * from './editor';
export * from './serializer';
export * from './types';
export * from './HtmlLabelSystem';
export * from './runtime';

import LabelPanel from './ui/LabelPanel.vue';
import { LabelEditorPlugin } from './editor';
import { LabelCorePlugin } from './core';
import { LabelForgePlugin } from './serializer';
import type { ForgeAppPlugin } from '@forge/types';

export const LabelPlugin: ForgeAppPlugin = {
  name: 'Labels',
  
  ui: {
    panel: LabelPanel,
    tabLabel: ['标签', 'UI']
  },
  
  serializer: new LabelForgePlugin(),
  
  core: LabelEditorPlugin,
  runtime: LabelCorePlugin
};
