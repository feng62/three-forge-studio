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
  
  /** 渲染引擎类型 */
  renderType: RenderType;
  
  /** 标签的原始代码字符串 */
  code: string;
  
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
