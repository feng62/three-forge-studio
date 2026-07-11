/**
 * 单个交互逻辑图数据
 */
export interface VisualLogicGraph {
  id: string;
  name: string;
  nodes: any[];
  connections: any[];
  variables?: any[];
}

/**
 * 执行流 (Visual Logic) 插件整体状态配置
 */
export interface VisualLogicPluginState {
  logics: VisualLogicGraph[];
  activeLogicId: string | null;
}
