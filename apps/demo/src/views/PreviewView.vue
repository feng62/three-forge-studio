<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Engine } from '@forge/core'
import { cameraAnimationRuntime } from '@forge/plugins'
import { ElMessage } from 'element-plus'

const router = useRouter()
const container = ref<HTMLElement | null>(null)
let engine: Engine | null = null

// 状态
const isLoading = ref(true)
const loadingText = ref('初始化引擎...')
const loadingPercent = ref(0)
const fps = ref(0)

const viewpoints = ref<any[]>([])
const activeViewpointId = ref('')
const isAnimating = ref(false)

const goBack = () => {
  router.push('/')
}

onMounted(async () => {
  if (!container.value) return

  engine = new Engine()

  // 仅仅注册运行时纯净版插件，避免引入编辑器的 Vue UI 代码
  engine.use(cameraAnimationRuntime)

  // 1. 挂载与卸载钩子
  engine.addEventListener('mount', () => console.log('Engine mounted'))
  engine.addEventListener('unmount', () => console.log('Engine unmounted'))

  // 2. 视角漫游插件钩子
  engine.addEventListener('plugin:camera-animation-start', (e: any) => {
    isAnimating.value = true
    activeViewpointId.value = e.viewpointId
    ElMessage.info(`前往视角: ${e.viewpointName}`)
  })
  
  engine.addEventListener('plugin:camera-animation-complete', (e: any) => {
    isAnimating.value = false
    ElMessage.success(`已到达: ${e.viewpointName}`)
  })

  // 3. 加载流程钩子
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

  // 3. 渲染循环钩子 (计算 FPS)
  let frames = 0
  let lastTime = performance.now()
  engine.addEventListener('before-render', (e: any) => {
    // e.delta 可以用来更新物理引擎、后处理等
    frames++
    const now = performance.now()
    if (now - lastTime >= 1000) {
      fps.value = frames
      frames = 0
      lastTime = now
    }
  })
  engine.addEventListener('after-render', () => {
    // 渲染完成后的钩子，比如可以做截图保存等
  })

  await engine.mount(container.value)

  try {
    const res = await fetch('/three/scene.json')
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const jsonObj = await res.json()
    
    // 开始加载
    await engine.loadJSON(jsonObj)
    
    // 从场景获取所有视角数据
    viewpoints.value = cameraAnimationRuntime.getViewpoints()

    engine.start()
  } catch (err) {
    console.error('Preview failed to load scene:', err)
  }
})

onUnmounted(() => {
  if (engine) {
    engine.unmount()
  }
})

const goToViewpoint = (vp: any) => {
  if (!vp || isAnimating.value) return
  cameraAnimationRuntime.switchToViewpoint(vp, viewpoints.value)
}
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

    <!-- FPS 显示 (通过 render 钩子更新) -->
    <div class="absolute top-6 right-6 px-3 py-1 bg-black/50 backdrop-blur text-green-400 font-mono text-sm rounded-md shadow pointer-events-none z-50">
      FPS: {{ fps }}
    </div>

    <!-- 视角漫游控制栏 -->
    <div 
      v-if="viewpoints.length > 0 && !isLoading" 
      class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-panel/80 backdrop-blur border border-border p-1.5 rounded-xl shadow-xl z-50"
    >
      <button
        v-for="vp in viewpoints"
        :key="vp.id"
        @click="goToViewpoint(vp)"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="activeViewpointId === vp.id ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-700/50 text-text-main'"
        :disabled="isAnimating"
      >
        {{ vp.name }}
      </button>
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
