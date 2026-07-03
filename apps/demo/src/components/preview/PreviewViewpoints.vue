<script setup lang="ts">
import { ref, watch } from 'vue'
import { cameraAnimationRuntime } from '@forge/plugins'
import { ElMessage } from 'element-plus'
import type { Engine } from '@forge/core'

const props = defineProps<{
  engine: Engine;
  isLoading: boolean;
}>();

const viewpoints = ref<any[]>([])
const activeViewpointId = ref('')
const isAnimating = ref(false)

// 组件创建时，向引擎注册插件
props.engine.use(cameraAnimationRuntime)

// 绑定事件钩子
props.engine.addEventListener('plugin:camera-animation-start', (e: any) => {
  isAnimating.value = true
  activeViewpointId.value = e.viewpointId
  ElMessage.info(`前往视角: ${e.viewpointName}`)
})

props.engine.addEventListener('plugin:camera-animation-complete', (e: any) => {
  isAnimating.value = false
  activeViewpointId.value = ''
  ElMessage.success(`已到达: ${e.viewpointName}`)
})

// 当场景加载完成后（isLoading 变为 false），获取视角数据
watch(() => props.isLoading, (loading) => {
  if (!loading) {
    viewpoints.value = cameraAnimationRuntime.getViewpoints()
  }
}, { immediate: true })

const switchToViewpoint = (vp: any) => {
  if (!vp || isAnimating.value) return
  cameraAnimationRuntime.switchToViewpoint(vp, viewpoints.value)
}
</script>

<template>
  <div v-if="viewpoints.length > 0" class="flex flex-col gap-4 bg-panel/80 backdrop-blur border border-border p-4 rounded-xl shadow-xl w-full min-w-[200px]">
    <span class="text-xs text-text-muted font-bold uppercase tracking-wider">视角漫游</span>
    <div class="flex flex-col gap-2">
      <button
        v-for="vp in viewpoints"
        :key="vp.id"
        @click="switchToViewpoint(vp)"
        class="px-3 py-2 rounded-lg text-sm font-medium transition-all text-left truncate"
        :class="activeViewpointId === vp.id ? 'bg-primary text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-text-main'"
        :disabled="isAnimating"
      >
        {{ vp.name }}
      </button>
    </div>
  </div>
</template>
