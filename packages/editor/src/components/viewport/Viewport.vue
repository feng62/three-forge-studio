<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Engine } from '../../engine/Engine'
import { useTransformStore } from '../../stores/transformStore'
import { useCameraStore } from '../../stores/cameraStore'
import { useThemeStore } from '../../stores/themeStore'
import { useEngineStore } from '../../stores/engineStore'

const containerRef = ref<HTMLElement | null>(null)
let engine: Engine | null = null
const transformStore = useTransformStore()
const cameraStore = useCameraStore()
const themeStore = useThemeStore()
const engineStore = useEngineStore()

onMounted(() => {
  if (containerRef.value) {
    engine = new Engine()
    engine.mount(containerRef.value)

    // Sync initial state
    engine.setTransformMode(transformStore.activeMode)
    engine.setCameraControlType(cameraStore.activeControlType)
    engine.setCameraControlEnabled(transformStore.activeMode === 'select')
    engine.setTheme(themeStore.currentTheme)

    engine.onSceneGraphChanged = () => {
      engineStore.incrementSceneGraphVersion()
    }
    // trigger once to populate initial tree
    engineStore.incrementSceneGraphVersion()

    engineStore.setEngine(engine)
  }
})

onUnmounted(() => {
  if (engine) {
    engine.unmount()
    engine = null
    engineStore.setEngine(null)
  }
})

watch(() => transformStore.activeMode, (newMode) => {
  if (engine) {
    engine.setTransformMode(newMode)
    engine.setCameraControlEnabled(newMode === 'select')
  }
})

watch(() => cameraStore.activeControlType, (newType) => {
  if (engine) {
    engine.setCameraControlType(newType)
  }
})

watch(() => themeStore.currentTheme, (newTheme) => {
  if (engine) {
    engine.setTheme(newTheme)
  }
})
</script>

<template>
  <main class="flex-1 h-full bg-transparent relative overflow-hidden flex items-center justify-center transition-colors duration-300">
    <!-- Grid Background Pattern -->
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-300" 
         style="background-image: radial-gradient(var(--color-text-main) 1px, transparent 1px); background-size: 24px 24px;">
    </div>
    
    <!-- 3D Canvas Container -->
    <div ref="containerRef" class="absolute inset-0 z-0"></div>
    
    <div class="text-text-muted opacity-60 text-lg flex flex-col items-center gap-2 pointer-events-none z-10 hidden">
      <span class="font-medium tracking-widest uppercase text-sm">3D Viewport</span>
      <span class="text-xs">@forge/core will mount here</span>
    </div>
  </main>
</template>
