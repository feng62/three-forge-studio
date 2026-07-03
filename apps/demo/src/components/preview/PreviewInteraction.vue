<script setup lang="ts">
import { interactionRuntime } from '@forge/plugins'
import { ElMessage } from 'element-plus'
import type { Engine } from '@forge/core'

const props = defineProps<{
  engine: Engine;
}>();

// 组件创建时，向引擎注册插件
props.engine.use(interactionRuntime)

// 绑定相关事件
props.engine.addEventListener('plugin:interaction-trigger', (e: any) => {
  const eventType = e.eventType
  const objectName = e.ref?.name || e.object?.name || '未命名对象'
  ElMessage.success(`触发了 [${eventType}] 事件 (目标: ${objectName})`)
})
</script>

<template>
  <!-- 该组件仅负责挂载交互逻辑事件，不渲染任何 UI -->
</template>
