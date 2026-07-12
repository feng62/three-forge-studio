<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Engine } from '@forge/core'

import PreviewViewpoints from '../components/preview/PreviewViewpoints.vue'
import PreviewLabels from '../components/preview/PreviewLabels.vue'
import PreviewInteraction from '../components/preview/PreviewInteraction.vue'
import PreviewVisualLogic from '../components/preview/PreviewVisualLogic.vue'

const router = useRouter()
const container = ref<HTMLElement | null>(null)
const engineRef = shallowRef<Engine | null>(null)

// 状态
const isLoading = ref(true)
const loadingText = ref('初始化引擎...')
const loadingPercent = ref(0)
const fps = ref(0)

const goBack = () => {
  router.push('/')
}

onMounted(async () => {
  if (!container.value) return

  const engine = new Engine()
  engineRef.value = engine

  // 等待 Vue 更新 DOM，使得包裹在 v-show="!isLoading" 下的子组件被挂载
  // 子组件挂载后，会向 engine 注册它们自己的运行时插件
  await nextTick()

  // 1. 挂载与卸载钩子
  engine.addEventListener('mount', () => console.log('Engine mounted'))
  engine.addEventListener('unmount', () => console.log('Engine unmounted'))

  // 2. 加载流程钩子
  engine.addEventListener('json-load-start', () => {
    isLoading.value = true
    loadingText.value = '解析场景结构中...'
    loadingPercent.value = 0
  })
  engine.addEventListener('asset-load-start', (e: any) => {
    loadingText.value = `请求加载: ${e.url.substring(e.url.lastIndexOf('/') + 1)}`
  })
  engine.addEventListener('asset-load-progress', (e: any) => {
    loadingText.value = `正在加载: ${e.url.substring(e.url.lastIndexOf('/') + 1)}`
    loadingPercent.value = Math.round((e.loaded / e.total) * 100)
  })
  engine.addEventListener('json-load-complete', () => {
    isLoading.value = false
  })

  // 4. 渲染循环钩子 (计算 FPS)
  let frames = 0
  let lastTime = performance.now()
  engine.addEventListener('before-render', (e: any) => {
    frames++
    const now = performance.now()
    if (now - lastTime >= 1000) {
      fps.value = frames
      frames = 0
      lastTime = now
    }
  })

  await engine.mount(container.value)

  try {
    const res = await fetch('/three/scene.json')
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const jsonObj = await res.json()
    
    // 开始加载 (此时所有插件都已通过子组件的挂载完成了 use 注册)
    await engine.loadJSON(jsonObj)
    engine.start()
  } catch (err) {
    console.error('Preview failed to load scene:', err)
  }
})

onUnmounted(() => {
  if (engineRef.value) {
    engineRef.value.unmount()
  }
})
</script>

<template>
  <div class="h-screen w-screen relative bg-slate-900">
    <div ref="container" class="w-full h-full"></div>
    
    <!-- 返回按钮 -->
    <button 
      @click="goBack"
      class="absolute top-6 left-6 px-4 py-2 bg-panel/80 backdrop-blur text-text border border-border rounded-lg shadow-lg hover:bg-panel hover:text-primary transition-all flex items-center gap-2 z-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="currentColor" d="M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8"/></svg>
      返回编辑器
    </button>

    <!-- 交互逻辑等无 UI 依赖的后台组件 -->
    <PreviewInteraction v-if="engineRef" :engine="engineRef" />
    <PreviewVisualLogic v-if="engineRef" :engine="engineRef" />

    <!-- FPS 显示 (通过 render 钩子更新) -->
    <div class="absolute top-6 right-6 px-3 py-1 bg-black/50 backdrop-blur text-green-400 font-mono text-sm rounded-md shadow pointer-events-none z-50">
      FPS: {{ fps }}
    </div>

    <!-- 控制栏：业务功能集合 (放置在右侧，自上而下排列) -->
    <div 
      v-show="!isLoading" 
      class="absolute top-20 right-6 flex flex-col gap-4 z-50 items-end"
    >
      <!-- 视角漫游 -->
      <PreviewViewpoints
        v-if="engineRef"
        :engine="engineRef"
        :isLoading="isLoading"
      />

      <!-- 标签开关 -->
      <PreviewLabels 
        v-if="engineRef"
        :engine="engineRef"
        :isLoading="isLoading"
      />
    </div>

    <!-- 加载遮罩 (通过 load 钩子更新) -->
    <div 
      v-if="isLoading"
      class="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-500"
    >
      <div class="w-64">
        <div class="flex justify-between text-text text-sm mb-2">
          <span>{{ loadingText }}</span>
          <span class="text-primary font-bold">{{ loadingPercent }}%</span>
        </div>
        <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            class="h-full bg-primary transition-all duration-300 ease-out"
            :style="{ width: `${loadingPercent}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
