/**
 * 视角漫游编辑器级插件层
 * 负责打通 UI 与底层的 Three.js 场景 userData，提供持久化数据的暂存和读取接口
 */
export const CameraAnimationEditorPlugin = {
  name: 'Forge_CameraAnimation_Editor',
  
  /** 挂载的编辑器实例引用 */
  editor: null as any,

  /**
   * 插件挂载时的初始化回调
   * @param editor 编辑器大类的实例上下文
   */
  onInstall(editor: any) {
    this.editor = editor
    console.log("CameraAnimation Editor Plugin Installed")
  },

  /**
   * 将视角数据保存到场景的 userData 中
   * 这个方法通常由 UI 面板在用户执行新增/修改视角操作后调用
   * @param data 要保存的完整视角配置数据
   */
  saveData(data: any) {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return
    // 强制进行深拷贝，以防 Vue 响应式代理对象污染底层引擎对象的引用类型
    this.editor.engine.scene.userData.cameraAnimations = JSON.parse(JSON.stringify(data)) 
    
    // 通知引擎场景图结构已变更，从而触发系统级别的自动保存或状态同步
    if (this.editor.engine.onSceneGraphChanged) {
      this.editor.engine.onSceneGraphChanged()
    }
  },

  /**
   * 从当前场景的 userData 中读取并解析视角漫游的配置数据
   * @returns 解析后的视角数据，如果尚未配置过，则返回一个初始化默认结构 { viewpoints: [] }
   */
  loadData(): any {
    if (!this.editor || !this.editor.engine || !this.editor.engine.scene) return { viewpoints: [] }
    return this.editor.engine.scene.userData.cameraAnimations || { viewpoints: [] }
  }
}
