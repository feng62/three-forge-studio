/**
 * 场景元数据
 */
export interface ForgeMetadata {
  /** 协议版本号，用于向下兼容 */
  version: string;
  /** 生成器名称，如 "ThreeForgeStudio" */
  generator: string;
}

/**
 * 业务/项目基础信息
 */
export interface ForgeProject {
  name: string;
  createdAt: number;
  updatedAt?: number;
}
