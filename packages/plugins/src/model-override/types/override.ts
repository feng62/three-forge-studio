export interface NodeOverrideData {
  /** 被修改的局部位置 [x, y, z] */
  position?: [number, number, number];
  /** 被修改的局部旋转（欧拉角） [x, y, z] */
  rotation?: [number, number, number];
  /** 被修改的局部缩放 [x, y, z] */
  scale?: [number, number, number];
  /** 是否被隐藏 */
  visible?: boolean;
  /** 覆写的新材质的 UUID */
  material?: string;
}

export interface ModelOverrideExtension {
  /**
   * 记录外部模型内被修改过的所有子节点。
   * key 可以是子节点的 uuid，也可以是 name (为了在模型重导时依然能尝试匹配)。
   */
  overrides: Record<string, NodeOverrideData>;
}
