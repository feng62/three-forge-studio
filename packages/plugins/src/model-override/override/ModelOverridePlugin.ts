import { Object3D } from 'three';
import { ForgePlugin } from '@forge/utils';
import { ModelOverrideExtension } from '../types/override';

export class ModelOverridePlugin implements ForgePlugin {
  public name = 'Forge_ModelOverride';
  public version = '1.0.0';

  /**
   * 序列化时：
   * 如果该节点（外部模型根节点）内部有子节点被修改，则提取这些被修改的数据
   */
  public serializeNode(node: Object3D): Record<string, any> | undefined {
    // 假设我们在编辑器里修改外部模型的子节点时，会在根节点打上 userData.dirtyOverrides = { [childUuid]: NodeOverrideData }
    if (node.userData && node.userData.dirtyOverrides) {
      const extensionData: ModelOverrideExtension = {
        overrides: node.userData.dirtyOverrides
      };
      return extensionData as unknown as Record<string, any>;
    }
    return undefined;
  }

  /**
   * 反序列化时：
   * 在基础结构（Object3D）还原完毕后，把提取出来的修改数据重新应用到模型子节点上
   */
  public deserializeNode(extensionData: any, node: Object3D): void {
    const data = extensionData as ModelOverrideExtension;
    if (!data.overrides) return;

    // 重新挂载到 userData，以便在编辑器中继续追踪
    node.userData.dirtyOverrides = data.overrides;

    // 遍历每一个被覆写的子节点
    for (const [childId, overrideData] of Object.entries(data.overrides)) {
      // 尝试通过 uuid 或者 name 找到子节点
      let targetChild = node.getObjectByProperty('uuid', childId);
      if (!targetChild) {
        targetChild = node.getObjectByName(childId);
      }

      if (targetChild) {
        // 应用覆写数据
        if (overrideData.position) {
          targetChild.position.fromArray(overrideData.position);
        }
        if (overrideData.rotation) {
          // @ts-ignore
          targetChild.rotation.fromArray(overrideData.rotation as [number, number, number], 'XYZ');
        }
        if (overrideData.scale) {
          targetChild.scale.fromArray(overrideData.scale);
        }
        if (overrideData.visible !== undefined) {
          targetChild.visible = overrideData.visible;
        }
        
        // 注意：材质的实际替换可能需要等待资源管理器加载完成
        // 这里仅记录供以后流程使用
        if (overrideData.material) {
          targetChild.userData.overrideMaterialId = overrideData.material;
        }
      } else {
        console.warn(`ModelOverridePlugin: Cannot find child node [${childId}] to apply overrides.`);
      }
    }
  }
}

