/**
 * @forge/plugin-bloom (Core)
 * 暴露给 @forge/core 的渲染逻辑
 */

export const BloomCorePlugin = {
  name: 'Forge_Bloom_Core',
  onInstall(core: any) {
    console.log("Bloom Core Plugin Installed");
  },
  onAfterRender(deltaTime: number) {
    // TODO: UnrealBloomPass execution
  }
};
