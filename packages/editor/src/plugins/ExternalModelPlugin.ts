import { Object3D, Mesh, Material } from 'three';
import { AssetManager } from '../engine/managers/AssetManager';
import { BaseExternalModelPlugin } from '@forge/plugins';

/**
 * 核心外部模型插件：负责解析反序列化过程中的外部模型节点
 */
export class CoreExternalModelPlugin extends BaseExternalModelPlugin {
  name = 'core_external_model';
  
  constructor(private assetManager: AssetManager) {
    super();
  }

  public async deserializeNode(data: any, node: Object3D): Promise<void> {
    if (data && data.id) {
      // 恢复标识，使序列化和射线检测能够识别它是外部模型根节点
      node.userData.isExternalModel = true;
      node.userData.externalModelId = data.id;
      
      try {
        // 从 IndexedDB 中加载模型并将其挂载到当前 wrapper 节点下
        // wrapper 节点已经由原生 ObjectLoader 恢复了正确的 position/rotation/scale
        await this.assetManager.loadExternalModelFromDB(data.id, undefined, undefined, node);
        console.log(`[CoreExternalModelPlugin] Successfully restored external model: ${data.id}`);
        
        // 如果有针对内部子节点的修改记录，则进行还原
        if (data.modifications) {
          // 查找当前场景（或直接从场景树往上找）中包含反序列化出的材质的 __ForgeDummy__ 节点
          let dummyHolder: Mesh | null = null;
          let current: Object3D | null = node;
          while (current && current.parent) current = current.parent; // find root
          if (current) {
            dummyHolder = current.getObjectByName('__ForgeDummy__') as Mesh;
          }

          const dummyMaterials = dummyHolder && Array.isArray(dummyHolder.material) 
            ? (dummyHolder.material as Material[]) 
            : [];
            
          this.applyExternalModifications(node, data.modifications, dummyMaterials, true);
        }
      } catch (err) {
        console.error(`[CoreExternalModelPlugin] Failed to restore external model: ${data.id}`, err);
      }
    }
  }
}
