import type { Engine } from '@forge/core'
import { cameraAnimationRuntime } from '@forge/plugins'
import { ElMessage } from 'element-plus'

export function registerCameraAnimationPlugin(
  engine: Engine,
  onStateChange: (isAnimating: boolean, activeViewpointId: string) => void
) {
  // 注册运行时插件
  engine.use(cameraAnimationRuntime)

  // 绑定事件钩子
  engine.addEventListener('plugin:camera-animation-start', (e: any) => {
    onStateChange(true, e.viewpointId)
    ElMessage.info(`前往视角: ${e.viewpointName}`)
    console.log('[CameraAnimation Plugin] Start:', e)
  })
  
  engine.addEventListener('plugin:camera-animation-complete', (e: any) => {
    onStateChange(false, '')
    ElMessage.success(`已到达: ${e.viewpointName}`)
    console.log('[CameraAnimation Plugin] Complete:', e)
  })
}
