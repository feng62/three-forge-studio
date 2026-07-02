import { InteractionCorePlugin } from './core';

/**
 * 鼠标交互编辑器级插件层
 * 负责打通 UI 与底层的 Three.js 场景 userData，提供持久化数据的暂存和读取接口
 */
export const InteractionEditorPlugin = {
  name: 'Forge_Interaction_Editor',
  
  /** 挂载的编辑器实例引用 */
  editor: null as any,

  /**
   * 插件挂载时的初始化回调
   */
  onInstall(editor: any) {
    this.editor = editor;
    console.log("Interaction Editor Plugin Installed");
  },

  /**
   * 将交互事件数据保存到场景的 userData 中
   */
  saveData(data: any) {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return;
    
    // 强制深拷贝，避免 Vue proxy 污染 Three.js 对象
    const cleanData = JSON.parse(JSON.stringify(data));
    this.editor.engine.scene.userData.interactionEvents = cleanData;
    
    // 同步给核心插件更新 DOM 事件绑定
    InteractionCorePlugin.setState(cleanData);

    // 通知引擎场景图结构已变更
    if (this.editor.engine.onSceneGraphChanged) {
      this.editor.engine.onSceneGraphChanged();
    }
  },

  /**
   * 从当前场景的 userData 中读取
   */
  loadData(): any {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return { events: {} };
    return this.editor.engine.scene.userData.interactionEvents || { events: {} };
  }
};
