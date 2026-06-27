/**
 * @forge/plugin-physics (Core)
 * 暴露给 @forge/core 的渲染与物理步进解析逻辑
 */

export const PhysicsCorePlugin = {
  name: 'Forge_Physics_Core',
  onInstall(_core: any) {
    console.log("Physics Core Plugin Installed");
  },
  onBeforeRender(_deltaTime: number) {
    // TODO: physics step simulation
  }
};
