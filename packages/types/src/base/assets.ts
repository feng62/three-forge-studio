/**
 * 场景资产库，用于资源的集中管理和去重引用
 */
export interface ForgeAssets {
  geometries?: any[];
  materials?: any[];
  textures?: any[];
  /** 外部模型引用资源 (如 GLB, FBX) */
  models?: Array<{
    uuid: string;
    url: string;
    format: string;
  }>;
  /** Forge 自定义维护的全局资源注册表，统一管理贴图、图片、模型来源 */
  registry?: Array<{
    uuid: string; // 对应的数据库 ID 或者内部统一 ID
    url: string;  // 外部链接，暂可为空
    type: 'model' | 'texture' | 'image';
    format: string; // 后缀名
    name: string;
  }>;
  [key: string]: any;
}
