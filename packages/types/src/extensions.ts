import { ForgeSceneNode } from './base/node';

/**
 * ------------------------------------------------------------------------
 * 典型内置扩展类型定义参考
 * ------------------------------------------------------------------------
 */

/**
 * [扩展] 全局控制器配置 
 * 存储于: JSON根级 `extensions.Forge_Controls`
 */
export interface ForgeControlsExtension {
  type: 'OrbitControls' | 'FirstPersonControls' | 'TrackballControls';
  target: [number, number, number];
  enableDamping?: boolean;
  dampingFactor?: number;
  maxDistance?: number;
}

/**
 * [扩展] 外部模型覆写 (Overrides) 配置
 * 存储于: SceneNode 级别 `extensions.Forge_ModelReference`
 */
export interface ForgeModelReferenceExtension {
  /** 指向 assets.models 中定义的外部模型 UUID */
  assetUuid: string;
  /** 
   * 模型内部节点覆写规则
   * Key: 内部节点名字或层级路径 (如: "RootNode/Body/Shell")
   * Value: 覆写属性
   */
  overrides?: Record<string, Partial<Pick<ForgeSceneNode, 'matrix' | 'material' | 'visible' | 'extensions'>>>;
}
