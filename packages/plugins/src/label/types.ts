import type { LabelAnchor } from './HtmlLabelSystem';

export type TargetType = 'coordinate' | 'model';
export type RenderType = 'html' | 'vue';

export interface LabelObject {
  /** 唯一标识符 */
  id: string;
  
  /** 绑定类型 */
  targetType: TargetType;
  
  /** 绑定的空间坐标 */
  targetPosition: [number, number, number];
  
  /** 绑定的模型 UUID */
  targetModelUuid: string;
  
  /** 外部模型子节点相对路径 (可选) */
  targetModelPath?: string;
  
  /** 局部偏移量 [x,y,z] */
  offset: [number, number, number];
  
  /** 是否是 3D 标签 */
  is3D?: boolean;
  
  /** 是否需要被遮挡 */
  occluded?: boolean;
  
  /** 是否固定视角 (只在 is3D=true 时有效) */
  fixedRotation?: boolean;
  
  /** 跟随相机的轴向 (只在 fixedRotation=true 时有效) */
  followAxis?: 'none' | 'x' | 'y' | 'z';
  
  /** 旋转角度 (度数) [x,y,z] */
  rotation?: [number, number, number];
  
  /** 渲染引擎类型 */
  renderType: RenderType;
  
  /** 标签的原始代码字符串 (单文件兼容模式或 App.vue 默认代码) */
  code: string;
  
  /** 多文件组件系统的虚拟文件树 */
  files?: Record<string, string>;
  
  /** 二维平面锚点坐标 [-100, 100] */
  anchor: LabelAnchor;
  
  /** 控制默认显示/隐藏 */
  visible: boolean;
  
  /** 显示名称(UI辅助用) */
  name: string;
  
  /** 注入给标签的响应式数据源对象 */
  _data?: any;
}

export interface LabelPluginState {
  labels: LabelObject[];
}
