/**
 * @forge/types
 * 存放所有的 JSON 场景 Schema 接口定义和事件类型声明
 */

export interface ForgeSceneJSON {
  version: string;
  metadata?: Record<string, any>;
  extensions?: Record<string, any>;
  nodes: any[];
}
