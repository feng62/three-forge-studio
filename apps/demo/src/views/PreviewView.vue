<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Engine } from '@forge/core'

const router = useRouter()
const container = ref<HTMLElement | null>(null)
let engine: Engine | null = null

const goBack = () => {
  router.push('/')
}

onMounted(async () => {
  if (!container.value) return

  engine = new Engine()
  await engine.mount(container.value)

  try {
    const res = await fetch('/three/scene.json')
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const jsonObj = await res.json()
    
    // 开始加载
    await engine.loadJSON(jsonObj)
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
</script>

<template>
  <div class="h-screen w-screen relative bg-slate-900">
    <div ref="container" class="w-full h-full"></div>
    
    <button 
      @click="goBack"
      class="absolute top-6 left-6 px-4 py-2 bg-panel/80 backdrop-blur text-text border border-border rounded-lg shadow-lg hover:bg-panel hover:text-primary transition-all flex items-center gap-2 z-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="currentColor" d="M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8"/></svg>
      返回编辑器
    </button>
  </div>
</template>
