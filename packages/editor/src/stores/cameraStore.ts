import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ControlType = 
    'OrbitControls' | 'MapControls' | 'FirstPersonControls' | 
    'PointerLockControls' | 'DeviceOrientationControls' | 
    'TrackballControls' | 'ArcballControls' | 'FlyControls';

export const useCameraStore = defineStore('camera', () => {
  const activeControlType = ref<ControlType>('OrbitControls')

  /**
   * 设置当前的相机控制模式
   * 用于在 UI 和 3D 引擎的 ControlsManager 之间同步相机控制状态
   * @param {ControlType} type - 新的控制类型
   */
  function setControlType(type: ControlType) {
    activeControlType.value = type
  }

  return {
    activeControlType,
    setControlType
  }
})
