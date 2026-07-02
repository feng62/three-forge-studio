import type { Engine } from '@forge/core'
import { labelRuntime } from '@forge/plugins'

export function registerLabelPlugin(engine: Engine) {
  // 注册解析器与运行时组合插件
  engine.use(labelRuntime)

  // 绑定事件钩子
  engine.addEventListener('plugin:LabelPlugin-show', (e: any) => {
    const id = e.detail?.id
    console.log(`[Label Plugin] Label shown (ID: ${id})`)
  })

  engine.addEventListener('plugin:LabelPlugin-hide', (e: any) => {
    const id = e.detail?.id
    console.log(`[Label Plugin] Label hidden (ID: ${id})`)
  })
}
