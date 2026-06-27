/**
 * 运行时全局配置 (Settings)
 * 决定了 Core 引擎启动时的默认表现
 */
export interface ForgeSettings {
  /** 当前激活的主相机的 UUID，Core 引擎启动时会用它作为默认渲染相机 */
  activeCamera?: string;
  /** 全局背景色或环境贴图的 UUID（可选） */
  background?: string;
  /** 环境光 HDR 贴图的 UUID（可选） */
  environment?: string;
}
