import { Object3D } from 'three';

/**
 * 插件接口：用于让插件参与到 Forge 协议的序列化和反序列化流程中。
 */
export interface ForgePlugin {
  /**
   * 插件的唯一命名空间/名称，例如 'Forge_Physics'。
   * 它将作为 extensions 字典中的键值。
   */
  name: string;

  /**
   * 插件版本号，用于进行细粒度的生态扩展防坑和升版比对。
   */
  version?: string;

  /**
   * 序列化节点钩子：在序列化场景树中的每个节点时被调用。
   * @param node 正在被序列化的原生 Three.js Object3D 实例。
   * @returns 返回包含该插件针对此节点的扩展数据对象，或 undefined。
   */
  serializeNode?: (node: Object3D) => Record<string, any> | undefined;

  /**
   * 序列化根节点钩子：在序列化整个场景/JSON 根部时被调用。
   * @param scene 根部的原生 Three.js Object3D 实例（通常是 Scene）。
   * @returns 返回包含该插件全局扩展数据的对象，或 undefined。
   */
  serializeRoot?: (scene: Object3D) => Record<string, any> | undefined;

  /**
   * 反序列化节点钩子：在反序列化场景树中的每个节点时被调用。
   * @param extensionData 从该节点 extensions 中提取出的当前插件的数据。
   * @param node 已经实例化出来的 Three.js Object3D。
   */
  deserializeNode?: (extensionData: any, node: Object3D) => void | Promise<void>;

  /**
   * 反序列化根节点钩子：在反序列化整个场景/JSON 根部时被调用。
   * @param extensionData 从根部 extensions 中提取出的当前插件的全局数据。
   * @param scene 已经实例化出来的根部 Three.js Object3D（通常是 Scene）。
   */
  deserializeRoot?: (extensionData: any, scene: Object3D) => void | Promise<void>;
}
