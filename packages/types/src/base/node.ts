import { ForgeExtensions } from './base';

/**
 * 场景树中的单个节点定义
 */
export interface ForgeSceneNode {
  uuid: string;
  name?: string;
  type: string;
  
  /** 本地变换矩阵 (16位浮点数数组)，压缩了 position, rotation, scale */
  matrix: number[];
  
  visible?: boolean;
  layers?: number;
  
  /** 相机特有属性 */
  fov?: number;
  near?: number;
  far?: number;

  /** Mesh 的资产引用 */
  geometry?: string;
  material?: string | string[];

  /** 灯光特有属性 */
  color?: number;
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  width?: number;
  height?: number;

  /** 该节点挂载的自定义插件扩展数据 */
  extensions?: ForgeExtensions;

  /** 预留给不需要被插件系统接管的普通业务用户数据 */
  userData?: Record<string, any>;

  /** 子节点列表 (递归) */
  children?: ForgeSceneNode[];
}
