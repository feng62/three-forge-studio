import * as THREE from 'three';

/**
 * 获取对象相对于其所在的 ExternalModel 根节点的层级路径索引。
 * 例如返回 "0/1/2"
 * 如果该对象不在 ExternalModel 内或它就是 ExternalModel 本身，则返回 null。
 */
export function getPathToExternalRoot(object: THREE.Object3D): string | null {
  const path: number[] = [];
  let current = object;

  while (current && current.parent) {
    if (current.parent.userData && current.parent.userData.isExternalModel) {
      // 找到了外部模型根节点
      path.unshift(current.parent.children.indexOf(current));
      return path.join('/');
    }
    path.unshift(current.parent.children.indexOf(current));
    current = current.parent;
  }
  
  return null;
}

/**
 * 根据保存的层级路径索引，从 ExternalModel 根节点解析出具体的对象。
 */
export function resolvePath(root: THREE.Object3D, path: string): THREE.Object3D | null {
  if (!path) return null;
  const indices = path.split('/').map(p => parseInt(p, 10));
  
  let current = root;
  for (const index of indices) {
    if (!current.children || current.children.length <= index) {
      console.warn(`[ExternalModelUtils] Cannot resolve path ${path} on root ${root.name}`);
      return null;
    }
    current = current.children[index];
  }
  return current;
}

/**
 * 为特定的修改动作（Transform/Material/UserData）打上修改标记
 * 这些标记会在 serialize 时被收集
 */
export function markExternalModification(object: THREE.Object3D, type: 'transform' | 'material' | 'userData') {
  // 检查是否属于外部模型的子节点
  const path = getPathToExternalRoot(object);
  if (path) {
    if (!object.userData._externalModifications) {
      object.userData._externalModifications = {};
    }
    object.userData._externalModifications[type] = true;
  }
}
