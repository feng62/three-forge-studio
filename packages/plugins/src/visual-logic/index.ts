export * from './core'
export * from './editor'
export * from './serializer'
export * from './types'
export * from './runtime'

import VisualLogicPanel from './ui/Panel.vue'
import VisualLogicBottomPanel from './ui/BottomPanel.vue'
import { VisualLogicForgePlugin } from './serializer'
import { VisualLogicEditorPlugin } from './editor'
import { VisualLogicCorePlugin } from './core'
import type { ForgeAppPlugin } from '@forge/types'

export const VisualLogicPlugin: ForgeAppPlugin = {
  name: 'Forge_VisualLogic',
  
  ui: {
    panel: VisualLogicPanel,
    tabLabel: ['交互', '逻辑'],
    bottomPanel: VisualLogicBottomPanel,
    autoMaximizeBottomPanel: true
  },
  
  serializer: new VisualLogicForgePlugin(),
  
  core: VisualLogicEditorPlugin,

  runtime: VisualLogicCorePlugin
}
