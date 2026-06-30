<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Engine } from '../../engine/Engine'
import { useTransformStore } from '../../stores/transformStore'
import { useCameraStore } from '../../stores/cameraStore'
import { useThemeStore } from '../../stores/themeStore'
import { useEngineStore } from '../../stores/engineStore'
import { Inspector } from 'three/addons/inspector/Inspector.js'

const containerRef = ref<HTMLElement | null>(null)
let engine: Engine | null = null
const transformStore = useTransformStore()
const cameraStore = useCameraStore()
const themeStore = useThemeStore()
const engineStore = useEngineStore()
let inspector: Inspector | null = null

onMounted(() => {
  if (containerRef.value) {
    engine = new Engine()
    
    // 绑定 Inspector (必须在 engine.mount 前绑定，以便 renderer.init 能自动初始化)
    if (engine.renderer) {
      inspector = new Inspector()
      ;(engine.renderer as any).inspector = inspector
    }

    engine.mount(containerRef.value)

    // Sync initial state
    engine.setTransformMode(transformStore.activeMode)
    engine.setCameraControlType(cameraStore.activeControlType)
    engine.setCameraControlEnabled(transformStore.activeMode === 'select')
    engine.setTheme(themeStore.currentTheme)

    engine.onSceneGraphChanged = () => {
      engineStore.incrementSceneGraphVersion()
    }
    
    engine.onObjectSelected = (uuid: string | null) => {
      engineStore.setSelectedObject(uuid)
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
  if (inspector) {
    if (inspector.domElement && inspector.domElement.parentNode) {
      inspector.domElement.parentNode.removeChild(inspector.domElement)
    }
    inspector = null
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

watch(() => engineStore.selectedObjectUuid, (newUuid) => {
  if (engine) {
    engine.selectObjectByUuid(newUuid)
  }
})

const handleDrop = (e: DragEvent) => {
  const data = e.dataTransfer?.getData('application/forge-asset')
  if (data && engine) {
    try {
      const parsed = JSON.parse(data)
      engine.addAsset(parsed.type, e.clientX, e.clientY, parsed)
    } catch (err) {
      console.error('Failed to parse dropped asset data:', err)
    }
  }
}
</script>

<template>
  <main 
    class="flex-1 h-full bg-transparent relative overflow-hidden flex items-center justify-center transition-colors duration-300"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
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

<style>
/* 修复 Tailwind CSS 干扰 Inspector 的样式 */
.three-inspector,
.three-inspector * {
  box-sizing: content-box !important;
}

.three-inspector button {
  background-color: transparent;
  border-width: 0;
  border-style: solid;
  border-color: transparent;
}
.three-inspector .profiler-panel.position-bottom {
  bottom: 0px !important;
  top: auto !important;
}

/* 强制 Inspector 相对 Viewport 容器定位，而不是整个浏览器窗口 */
.three-inspector .profiler-toggle,
.three-inspector .profiler-panel,
.three-inspector .detached-tab-panel {
  position: absolute !important;
}
</style>
