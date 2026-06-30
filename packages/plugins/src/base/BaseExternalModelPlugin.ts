import * as THREE from 'three';
import { resolvePath } from '@forge/utils';
import { ForgePlugin } from '@forge/types';

export abstract class BaseExternalModelPlugin implements ForgePlugin {
  abstract name: string;
  abstract deserializeNode(data: any, object: THREE.Object3D): Promise<void>;

  /**
   * 应用外部模型记录的 modifications（矩阵变换和材质修改）
   * @param rootObject 该外部模型的最外层 wrapper 节点
   * @param modifications JSON 中的 modifications 数据
   * @param materialsSource 用于查找被替换材质的源：数组或一个包含材质的 Scene
   * @param isEditorMode 是否是编辑器模式。如果是，会自动为修改过的节点添加 `userData._externalModifications` 标记
   */
  protected applyExternalModifications(
    rootObject: THREE.Object3D,
    modifications: Record<string, any>,
    materialsSource: THREE.Material[] | THREE.Scene,
    isEditorMode: boolean = false
  ) {
    if (!modifications) return;

    Object.entries(modifications).forEach(([path, mod]: [string, any]) => {
      const targetChild = resolvePath(rootObject, path);
      if (!targetChild) return;

      // 1. 还原变换 (matrix)
      if (mod.matrix) {
        targetChild.matrix.fromArray(mod.matrix);
        targetChild.matrix.decompose(targetChild.position, targetChild.quaternion, targetChild.scale);
        if (isEditorMode) {
          targetChild.userData._externalModifications = targetChild.userData._externalModifications || {};
          targetChild.userData._externalModifications.transform = true;
        }
      } else if (mod.transform) {
        targetChild.position.fromArray(mod.transform.position);
        targetChild.rotation.fromArray(mod.transform.rotation);
        targetChild.scale.fromArray(mod.transform.scale);
        if (isEditorMode) {
          targetChild.userData._externalModifications = targetChild.userData._externalModifications || {};
          targetChild.userData._externalModifications.transform = true;
        }
      }

      // 2. 还原材质 (material)
      if ((targetChild as any).isMesh && mod.material) {
        const isArray = Array.isArray(mod.material);
        const uuids = isArray ? mod.material : [mod.material];
        
        let targetMaterials: THREE.Material[] = [];

        if (Array.isArray(materialsSource)) {
          // 直接在给定的材质数组中查找 (Editor 模式通常使用)
          targetMaterials = uuids.map((uuid: string) => materialsSource.find(m => m.uuid === uuid)).filter(Boolean) as THREE.Material[];
        } else {
          // 在整个 Scene 中全局查找 (Preview 模式使用)
          const scene = materialsSource as THREE.Scene;
          const foundMap = new Map<string, THREE.Material>();
          scene.traverse((node: any) => {
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach((m: any) => {
                  if (uuids.includes(m.uuid)) foundMap.set(m.uuid, m);
                });
              } else if (uuids.includes(node.material.uuid)) {
                foundMap.set(node.material.uuid, node.material);
              }
            }
          });
          targetMaterials = uuids.map((uuid: string) => foundMap.get(uuid)).filter(Boolean) as THREE.Material[];
        }

        if (targetMaterials.length > 0) {
          (targetChild as any).material = isArray ? targetMaterials : targetMaterials[0];
          if (isEditorMode) {
            targetChild.userData._externalModifications = targetChild.userData._externalModifications || {};
            targetChild.userData._externalModifications.material = true;
          }
        } else {
          console.warn(`[BaseExternalModelPlugin] Material ${mod.material} not found for path ${path}`);
        }
      }

      // 3. 还原 userData
      if (mod.userData) {
        Object.assign(targetChild.userData, mod.userData);
        if (isEditorMode) {
          targetChild.userData._externalModifications = targetChild.userData._externalModifications || {};
          targetChild.userData._externalModifications.userData = true;
        }
      }
    });
  }
}
