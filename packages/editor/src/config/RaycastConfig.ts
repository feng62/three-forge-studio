import * as THREE from 'three';

/**
 * 射线检测与选择配置文件
 * 用于集中管理各种操作（如点击、拖拽放置）中射线应如何与场景物体相交的逻辑。
 */
export const RaycastConfig = {
  /**
   * 判断一个物体是否允许被点击选中
   * 默认排除所有隐藏物体和具有 isHelper 标记的辅助对象。
   * @param {THREE.Object3D} obj 检查的对象
   * @returns {boolean} 是否可点击
   */
  isClickable: (obj: THREE.Object3D | null): boolean => {
    while (obj) {
      if (!obj.visible) return false;
      if (obj.userData.isHelper) return false;
      obj = obj.parent;
    }
    return true;
  },

  /**
   * 判断一个物体是否可以作为拖拽生成的依托表面
   * 与 isClickable 不同，这里允许辅助网格 (GridHelper) 作为依托面，
   * 以便用户在空中拖拽时能自动落在地上。
   * @param {THREE.Object3D} obj 检查的对象
   * @returns {boolean} 是否可作为承载面
   */
  isDroppableSurface: (obj: THREE.Object3D | null): boolean => {
    while (obj) {
      if (!obj.visible) return false;
      // 如果它是辅助对象，只有 GridHelper 允许相交
      if (obj.userData.isHelper && obj.type !== 'GridHelper') {
        return false;
      }
      obj = obj.parent;
    }
    return true;
  }
};
