import type { ForgePlugin } from '@forge/types';
import { Object3D } from 'three';
import { resolvePath } from '@forge/utils/src/protocol/ExternalModelUtils';
import type { InteractionPluginState } from './types';
import { InteractionCorePlugin } from './core';

/**
 * 交互事件插件序列化器
 * 实现 ForgePlugin 接口，负责在保存/读取项目时处理交互事件的持久化数据
 */
export class InteractionForgePlugin implements ForgePlugin {
  name = 'Forge_InteractionEvents';
  version = '1.0.0';

  /**
   * 在保存项目时触发
   */
  serializeRoot(scene: Object3D): Record<string, any> | undefined {
    if (scene.userData && scene.userData.interactionEvents) {
      return JSON.parse(JSON.stringify(scene.userData.interactionEvents));
    }
    return undefined;
  }

  /**
   * 在加载项目时触发
   * 必须在外部模型解析和实例创建完毕后调用
   */
  deserializeRoot(extensionData: any, scene: Object3D): void {
    if (!extensionData) return;
    
    const state: InteractionPluginState = extensionData;
    // 直接恢复状态，不再进行强校验，因为外部模型加载是异步的，
    // 在 deserializeRoot 时外部模型的子节点 (GLTF) 可能还未生成，
    // 强制检查会导致原本正确的绑定数据被错误剔除。
    scene.userData.interactionEvents = state;

    // 通知核心引擎恢复监听状态
    InteractionCorePlugin.setState(state);
  }
}
