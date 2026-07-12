import type { VisualLogicPluginState } from './types';
import { runHeadlessEngine } from './engine/runner';

/**
 * 交互逻辑 (Visual Logic) 核心控制插件
 */
export const VisualLogicCorePlugin = {
  name: 'Forge_VisualLogic_Core',
  
  engine: null as any,
  state: { logics: [], activeLogicId: null } as VisualLogicPluginState,
  statesMap: {} as Record<string, any>,

  onInstall(core: any) {
    this.engine = core;
    console.log("VisualLogic Core Plugin Installed");

    // 监听 interaction 插件抛出的交互事件
    this.engine.addEventListener('plugin:interaction-trigger', (e: any) => {
      this.triggerEvent({
        type: 'interaction',
        interactionEvent: e
      });
    });
  },

  setState(newState: VisualLogicPluginState) {
    this.state = newState;
  },

  /**
   * 触发无头执行流
   */
  async triggerEvent(payload: any) {
    if (this.engine && this.engine.isEditor) {
      console.log('[VisualLogic] 当前处于编辑器模式，跳过逻辑执行。');
      return;
    }

    if (!this.state.logics || this.state.logics.length === 0) return;

    const workflows = this.state.logics.map(logic => ({
      id: logic.id,
      name: logic.name,
      data: {
        nodes: logic.nodes || [],
        connections: logic.connections || [],
        variables: logic.variables || []
      }
    }));

    try {
      this.statesMap = await runHeadlessEngine(workflows as any, payload, this.statesMap);
    } catch (e) {
      console.error("[VisualLogic] Execution failed:", e);
    }
  }
};
