import type { VisualLogicPluginState } from './types';

/**
 * 交互逻辑编辑器级插件层
 */
export const VisualLogicEditorPlugin = {
  name: 'Forge_VisualLogic_Editor',
  
  editor: null as any,

  onInstall(editor: any) {
    this.editor = editor;
    console.log("VisualLogic Editor Plugin Installed");
  },

  saveData(data: VisualLogicPluginState) {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return;
    this.editor.engine.scene.userData.visualLogic = JSON.parse(JSON.stringify(data)); 
  },

  loadData(): VisualLogicPluginState {
    const defaultState: VisualLogicPluginState = { logics: [], activeLogicId: null };
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return defaultState;
    const saved = this.editor.engine.scene.userData.visualLogic;
    if (saved && Array.isArray(saved.logics)) {
      return saved;
    }
    return defaultState;
  }
};
