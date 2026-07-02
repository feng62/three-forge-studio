import type { Engine } from '@forge/core'
import { interactionRuntime } from '@forge/plugins'
import { ElMessage } from 'element-plus'

export function registerInteractionPlugin(engine: Engine) {
  // 注册运行时插件
  engine.use(interactionRuntime)

  // 绑定事件钩子
  engine.addEventListener('plugin:interaction-trigger', (e: any) => {
    // 这里执行配置好的交互回调
    const eventType = e.eventType
    
    // 我们在 core.ts 增强了抛出的数据，现在它会带上实际绑定的信息
    const objectName = e.ref?.name || e.object.name || '未命名对象'
    
    // 实际业务中，可以根据对象名称或其他属性执行特定的业务逻辑
    ElMessage.success(`触发了 [${eventType}] 事件 (目标: ${objectName})`)
    console.log('[Interaction Plugin] Triggered:', e)
  })
}
