import { LabelCorePlugin } from './core';
import type { LabelPluginState, LabelObject } from './types';

/**
 * 标签编辑器级插件层
 * 负责打通 UI 与底层的 Three.js 场景 userData，提供持久化数据的暂存和读取接口
 */
export const LabelEditorPlugin = {
  name: 'Forge_Label_Editor',
  
  /** 挂载的编辑器实例引用 */
  editor: null as any,

  onInstall(editor: any) {
    this.editor = editor;
    console.log("Label Editor Plugin Installed");
  },

  /**
   * 将标签事件数据保存到场景的 userData 中
   */
  saveData(data: any) {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return;
    
    try {
      // 强制深拷贝，避免 Vue proxy 污染 Three.js 对象
      const cleanData = JSON.parse(JSON.stringify(data));
      this.editor.engine.scene.userData.labels = cleanData;
      
      // 同步给核心插件更新 DOM 事件绑定
      LabelCorePlugin.setState(cleanData);
      
      // 通知引擎场景图结构已变更
      if (this.editor.engine.onSceneGraphChanged) {
        this.editor.engine.onSceneGraphChanged();
      }
    } catch (e) {
      console.warn("Failed to save label state to scene", e);
    }
  },

  /**
   * 从当前场景的 userData 中读取
   */
  loadData(): any {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return { labels: [] };
    
    try {
      const saved = this.editor.engine.scene.userData.labels;
      if (saved && Array.isArray(saved.labels)) {
        return saved;
      }
    } catch (e) {
      console.warn("Failed to load label state from scene", e);
    }
    return { labels: [] };
  }
};
