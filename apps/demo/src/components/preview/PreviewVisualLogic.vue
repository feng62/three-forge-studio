<script setup lang="ts">
import { visualLogicRuntime } from '@forge/plugins'
import type { Engine } from '@forge/core'

const props = defineProps<{
  engine: Engine;
}>();

// 组件创建时，向引擎注册可视化逻辑运行时插件
props.engine.use(visualLogicRuntime)
</script>

<template>
  <!-- 该组件仅负责挂载可视化逻辑引擎层，不渲染任何 UI -->
</template>
