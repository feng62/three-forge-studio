/**
 * @forge/plugin-physics (Editor)
 * 暴露给 @forge/editor 的逻辑与 UI
 */

export const PhysicsEditorPlugin = {
  name: 'Forge_Physics_Editor',
  onInstall(_editor: any) {
    console.log("Physics Editor Plugin Installed");
  }
};
