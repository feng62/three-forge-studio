import { Object3D, Mesh } from 'three';
import { ForgePlugin } from '@forge/types';
import { resolvePath } from '@forge/utils';
import { AssetManager } from '../engine/managers/AssetManager';

/**
 * 核心外部模型插件：负责解析反序列化过程中的外部模型节点
 */
export class CoreExternalModelPlugin implements ForgePlugin {
  name = 'core_external_model';
  
  constructor(private assetManager: AssetManager) {}

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

          const dummyMaterials = dummyHolder && Array.isArray(dummyHolder.material) ? dummyHolder.material : [];

          for (const path in data.modifications) {
            // path 是相对于 node (外部模型 wrapper) 计算的，
            // 序列化时由于 wrapper 只有这一个加载的模型子节点，其索引必然是 0。
            // 反序列化时 ObjectLoader 生成的 wrapper 也没有子节点，
            // assetManager 加载的真实模型挂载后同样是索引 0。
            const child = resolvePath(node, path);
            if (child) {
              const mod = data.modifications[path];
              // 还原变换
              if (mod.matrix) {
                child.matrix.fromArray(mod.matrix);
                child.matrix.decompose(child.position, child.quaternion, child.scale);
                child.userData._externalModifications = child.userData._externalModifications || {};
                child.userData._externalModifications.transform = true;
              } else if (mod.transform) {
                child.position.fromArray(mod.transform.position);
                child.rotation.fromArray(mod.transform.rotation);
                child.scale.fromArray(mod.transform.scale);
                // 标记一下，防止再次反序列化时漏掉
                child.userData._externalModifications = child.userData._externalModifications || {};
                child.userData._externalModifications.transform = true;
              }
              // 还原材质
              if (mod.material) {
                const isArray = Array.isArray(mod.material);
                const uuids = isArray ? mod.material : [mod.material];
                const matchedMaterials = uuids.map((uuid: string) => dummyMaterials.find(m => m.uuid === uuid)).filter(Boolean);
                
                if (matchedMaterials.length > 0) {
                  (child as any).material = isArray ? matchedMaterials : matchedMaterials[0];
                  child.userData._externalModifications = child.userData._externalModifications || {};
                  child.userData._externalModifications.material = true;
                } else {
                  console.warn(`[CoreExternalModelPlugin] Material ${mod.material} not found for path ${path}`);
                }
              }
              // 还原 userData
              if (mod.userData) {
                Object.assign(child.userData, mod.userData);
                child.userData._externalModifications = child.userData._externalModifications || {};
                child.userData._externalModifications.userData = true;
              }
            }
          }
        }
      } catch (err) {
        console.error(`[CoreExternalModelPlugin] Failed to restore external model: ${data.id}`, err);
      }
    }
  }
}
