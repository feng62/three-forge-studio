import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale'

export const useTransformStore = defineStore('transform', () => {
  const activeMode = ref<TransformMode>('select')

  /**
   * 设置当前选中的模型变换模式
   * 用于在 UI 栏与引擎内部的 TransformControls (移动/旋转/缩放) 同步状态
   * @param {TransformMode} mode - 新的变换模式
   */
  function setTransformMode(mode: TransformMode) {
    activeMode.value = mode
  }

  return {
    activeMode,
    setTransformMode
  }
})
