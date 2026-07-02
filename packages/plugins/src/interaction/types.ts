/**
 * 支持监听的鼠标事件枚举池
 */
export const EVENT_POOL = [
  'click',
  'dblclick',
  'contextmenu',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave'
] as const;

export type SupportedEvent = typeof EVENT_POOL[number];

/**
 * 单个模型的引用信息
 */
export interface ModelReference {
  /**
   * 模型的 UUID。
   * 如果是普通模型，则为模型自身的 UUID。
   * 如果是外部模型（如 GLTF），则为其根 Wrapper 节点的 UUID。
   */
  uuid: string;
  
  /**
   * 模型在外部模型内部的层级路径，例如 "0/1/2"。
   * 仅当引用的是外部模型内部的子节点时才存在。
   */
  path?: string;
  
  /**
   * 为了 UI 友好显示而缓存的模型名称（不会严格用于解析）
   */
  name?: string;
}

/**
 * 插件状态定义：各种事件类型所绑定的模型引用列表
 */
export interface InteractionPluginState {
  events: Record<string, ModelReference[]>;
}
