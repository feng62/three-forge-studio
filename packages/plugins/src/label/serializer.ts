import type { ForgePlugin } from '@forge/types';
import * as THREE from 'three';

export class LabelForgePlugin implements ForgePlugin {
  name = 'Labels';

  /**
   * 序列化时提取根节点的 labels 配置数据
   * @param scene Three.js 根场景
   */
  serializeRoot(scene: THREE.Object3D): any {
    if (scene.userData && scene.userData.labels) {
      // 深拷贝一份并返回，该数据会被塞进 json.extensions.Labels 中
      return JSON.parse(JSON.stringify(scene.userData.labels));
    }
    return undefined;
  }

  /**
   * 反序列化时，读取 json.extensions.Labels 恢复到 userData 中
   * @param extensionData 存放在 extension 中的对应数据
   * @param scene 反序列化出的 Three.js 场景
   */
  deserializeRoot(extensionData: any, scene: THREE.Object3D): void {
    if (extensionData) {
      if (!scene.userData) scene.userData = {};
      scene.userData.labels = extensionData;
    }
  }

  /** 不处理单个节点的序列化 */
  serializeNode(node: THREE.Object3D): any {
    return undefined;
  }

  /** 不处理单个节点的反序列化 */
  deserializeNode(node: THREE.Object3D, extensionData: any): void {
    // DO NOTHING
  }
}
