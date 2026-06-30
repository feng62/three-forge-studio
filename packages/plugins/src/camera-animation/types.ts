/**
 * 视角切换动画的配置项
 */
export interface TransitionSetting {
  /** 是否启用过渡动画 */
  hasAnimation: boolean;
  /** 动画持续时间（单位：秒） */
  duration: number; 
  /** 动画缓动函数（例如：'power2.inOut'） */
  easing: string; 
}

/**
 * 视角的详细数据结构
 * 记录了在某一个视角下，相机的位置、朝向以及场景中模型的显隐状态
 */
export interface Viewpoint {
  /** 视角的唯一标识符 UUID */
  id: string;
  /** 视角名称（展示在UI中） */
  name: string;
  
  /** 相机在世界坐标系下的位置信息 */
  cameraPosition: { x: number; y: number; z: number };
  /** 相机的焦点位置 (LookAt目标) */
  cameraLookAt: { x: number; y: number; z: number };
  
  /** 切入到该视角时所使用的动画配置 (前进进入) */
  enterSetting: TransitionSetting;
  /** 离开该视角时所使用的动画配置 (退出返回) */
  exitSetting: TransitionSetting;
  
  /** 
   * 记忆模式
   * 若开启，退出该视角后再次进入时，是否恢复在该视角下曾被修改过但未显式保存的状态
   */
  memoryMode: boolean;
}

/**
 * 视角漫游插件整体的序列化数据结构
 */
export interface CameraAnimationData {
  /** 当前场景中保存的所有视角列表 */
  viewpoints: Viewpoint[];
}
