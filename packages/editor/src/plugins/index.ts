import { CameraAnimationPlugin, AnimationEditorPlugin } from '@forge/plugins'
import type { ForgeAppPlugin } from '@forge/types'

// This array serves as the central registry for all Editor UI plugins
export const uiPlugins: ForgeAppPlugin[] = [
  CameraAnimationPlugin,
  AnimationEditorPlugin
]
