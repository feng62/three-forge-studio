import type { ForgePlugin } from '@forge/types';
import { Object3D } from 'three';

/**
 * 视角漫游核心序列化插件
 * 实现 ForgePlugin 接口，负责在保存/读取项目时处理插件的持久化数据
 */
export class CameraAnimationForgePlugin implements ForgePlugin {
  /** 序列化时写在 extensions 节点下的插件名称键值 */
  name = 'Forge_CameraAnimation';
  /** 插件数据结构的版本号，用于未来可能的数据兼容升级 */
  version = '1.0.0';

  /**
   * 在保存项目时触发
   * 从根场景对象的 userData 中提取视角数据，并返回以供序列化写入 JSON 
   */
  serializeRoot(scene: Object3D): Record<string, any> | undefined {
    if (scene.userData && scene.userData.cameraAnimations) {
      // 深度拷贝以避免引用污染
      return JSON.parse(JSON.stringify(scene.userData.cameraAnimations));
    }
    return undefined; // 若返回 undefined，序列化器会自动忽略此扩展字段
  }

  /**
   * 在加载项目时触发
   * 接收 JSON 文件中读取出的扩展数据，并将其恢复到当前构建出的根场景 userData 中
   */
  deserializeRoot(extensionData: any, scene: Object3D): void {
    if (extensionData) {
      scene.userData.cameraAnimations = extensionData;
    }
  }
}
