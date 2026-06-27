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
  [key: string]: any;
}
