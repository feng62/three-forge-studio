<script setup lang="ts">
import { ref, watch } from 'vue'
import { labelRuntime } from '@forge/plugins'
import type { Engine } from '@forge/core'

const props = defineProps<{
  engine: Engine;
  isLoading: boolean;
}>();

const labels = ref<any[]>([])

// 组件创建时，向引擎注册插件
props.engine.use(labelRuntime)

// 绑定相关事件（可选）
props.engine.addEventListener('plugin:LabelPlugin-show', (e: any) => {
  console.log(`[Label Plugin] Label shown (ID: ${e.detail?.id})`)
})

props.engine.addEventListener('plugin:LabelPlugin-hide', (e: any) => {
  console.log(`[Label Plugin] Label hidden (ID: ${e.detail?.id})`)
})

// 当场景加载完成后（isLoading 变为 false），获取标签数据
watch(() => props.isLoading, (loading) => {
  if (!loading) {
    labels.value = labelRuntime.getLabels()
  }
}, { immediate: true })

const toggleLabelVisibility = (label: any) => {
  label.visible = !label.visible
  labelRuntime.setLabelVisible(label.id, label.visible)
}
</script>

<template>
  <div v-if="labels.length > 0" class="flex flex-col gap-4 bg-panel/80 backdrop-blur border border-border p-4 rounded-xl shadow-xl w-full min-w-[200px]">
    <span class="text-xs text-text-muted font-bold uppercase tracking-wider">3D 标签</span>
    <div class="flex flex-col gap-2">
      <button
        v-for="label in labels"
        :key="label.id"
        @click="toggleLabelVisibility(label)"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-all text-left flex justify-between items-center"
        :class="label.visible !== false ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 hover:bg-slate-700 text-text-main border border-transparent'"
      >
        <span class="truncate pr-2">{{ label.name }}</span>
        <span class="w-2 h-2 rounded-full shrink-0" :class="label.visible !== false ? 'bg-green-400' : 'bg-slate-500'"></span>
      </button>
    </div>
  </div>
</template>
