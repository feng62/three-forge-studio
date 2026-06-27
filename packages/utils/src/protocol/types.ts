import { Object3D } from 'three';

export interface DeserializeReport {
  /**
   * 解析状态：
   * SUCCESS - 完美解析，无任何问题
   * WARNING - 解析成功，但出现了版本不一致或部分未知扩展
   * FATAL - 存在严重版本冲突或数据损坏，放弃解析
   */
  status: 'SUCCESS' | 'WARNING' | 'FATAL';
  
  /**
   * 成功或带有警告解析出来的原生 Object3D 树（FATAL 状态下不存在）
   */
  scene?: Object3D;
  
  /**
   * 警告信息列表（低版本兼容、缺失插件等）
   */
  warnings: string[];
  
  /**
   * 错误信息列表（会导致 FATAL 的严重问题）
   */
  errors: string[];
}
