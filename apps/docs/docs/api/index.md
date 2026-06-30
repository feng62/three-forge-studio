---
outline: deep
---

<style>
/* 放宽页面主内容区域最大宽度 */
:root {
  --vp-layout-max-width: 1440px;
}
.VPDoc.has-sidebar .container {
  max-width: 1200px !important;
}

/* 强制表格第一列（事件名）不换行 */
.vp-doc table th:nth-child(1),
.vp-doc table td:nth-child(1) {
  white-space: nowrap;
}
</style>

# Engine API 概览

`@forge/core` 提供的 `Engine` 是本编辑器的核心渲染引擎类，负责管理 WebGPU 渲染器、场景图、相机以及生命周期。`Engine` 继承自 `THREE.EventDispatcher`，对外暴露了丰富的事件钩子（Hooks），方便开发者在各类 UI 框架中无缝接入加载进度展示、性能监控以及其他后处理逻辑。

## 初始化与基本挂载

```typescript
import { Engine } from '@forge/core'

const engine = new Engine()

// 挂载到指定的 DOM 容器中
await engine.mount(document.getElementById('container'))

// 加载场景 JSON 数据
const json = await fetch('/three/scene.json').then(res => res.json())
await engine.loadJSON(json)

// 启动渲染循环
engine.start()
```

## 事件钩子 (Hooks) 列表

引擎在运行的各个阶段会派发对应的事件，你可以通过 `engine.addEventListener` 来监听。

### 1. 生命周期钩子

| 事件名 | 触发时机 | 参数 / 说明 |
| :--- | :--- | :--- |
| `mount` | 引擎及其 DOM 容器准备就绪时触发 | 无。引擎已绑定到页面。 |
| `unmount` | 引擎被卸载与销毁时触发 | 无。适用于在此进行内存清理、移除监听器等。 |

### 2. 场景与资产加载钩子

用于构建炫酷的加载动画和进度条。引擎内置了全局 `THREE.LoadingManager` 统一管理所有的模型和贴图解析进度。

| 事件名 | 触发时机 | 参数 / 说明 |
| :--- | :--- | :--- |
| `json-load-start` | 开始解析场景骨架 JSON 数据时触发 | 无。标志着整体场景构建流程的开始。 |
| `asset-load-start` | 某一个外部静态资产开始网络请求时触发 | `{ url }`：资源对应的网络路径或本地相对路径。 |
| `asset-load-progress`| 资产加载进度更新时触发 | `{ url, loaded, total }`：当前 URL、已加载文件数、需加载总数。 |
| `asset-load-complete`| 所有的外部资产网络请求已全部完成 | 无。 |
| `asset-load-error` | 某项资产加载失败时触发 | `{ url }`：失败的资源 URL。 |
| `json-load-complete` | 整个场景的数据还原完成时触发 | 无。包含所有内置材质、模型反序列化，可以安全对场景内容进行二次修改。 |

### 3. 渲染循环钩子

| 事件名 | 触发时机 | 参数 / 说明 |
| :--- | :--- | :--- |
| `before-render` | 每一帧调用原生 `renderer.render()` 之前触发 | `{ delta }`：距离上一帧的时间间隔（秒）。常用于物理引擎、逻辑位移更新。 |
| `after-render` | 每一帧渲染完毕后触发 | `{ delta }`：时间间隔。常用于自定义后处理(PostProcessing)、数据埋点、录屏截帧等。 |

---

## 最佳实践案例 (结合 Vue 3)

以下是一套完整的在 Vue 组件中结合状态（Loading, FPS）使用 Engine API 的标准范式代码：

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Engine } from '@forge/core'

const container = ref<HTMLElement | null>(null)
let engine: Engine | null = null

// UI 状态响应式
const isLoading = ref(true)
const loadingText = ref('初始化引擎...')
const loadingPercent = ref(0)
const fps = ref(0)

onMounted(async () => {
  if (!container.value) return

  engine = new Engine()

  // --- 挂载生命周期 ---
  engine.addEventListener('mount', () => console.log('引擎已挂载'))
  engine.addEventListener('unmount', () => console.log('引擎已卸载'))

  // --- 加载进度监控 ---
  engine.addEventListener('json-load-start', () => {
    isLoading.value = true
    loadingText.value = '解析场景结构中...'
    loadingPercent.value = 0
  })
  
  engine.addEventListener('asset-load-progress', (e: any) => {
    // 提取文件名用于展示
    const fileName = e.url.substring(e.url.lastIndexOf('/') + 1)
    loadingText.value = `正在加载资产: ${fileName}`
    
    // 计算并更新百分比
    loadingPercent.value = Math.round((e.loaded / e.total) * 100)
  })
  
  engine.addEventListener('json-load-complete', () => {
    // 隐藏加载遮罩
    isLoading.value = false
  })

  // --- 渲染循环与 FPS 监控 ---
  let frames = 0
  let lastTime = performance.now()
  
  engine.addEventListener('before-render', (e: any) => {
    // e.delta 可用于物理和动画更新
    frames++
    const now = performance.now()
    if (now - lastTime >= 1000) {
      fps.value = frames
      frames = 0
      lastTime = now
    }
  })

  // 挂载并启动引擎
  await engine.mount(container.value)
  
  try {
    const jsonObj = await fetch('/three/scene.json').then(r => r.json())
    await engine.loadJSON(jsonObj)
    engine.start()
  } catch (err) {
    console.error('加载场景失败:', err)
  }
})

onUnmounted(() => {
  if (engine) engine.unmount()
})
</script>

<template>
  <div class="h-screen w-screen relative">
    <!-- 渲染容器 -->
    <div ref="container" class="w-full h-full"></div>

    <!-- FPS 悬浮窗 -->
    <div class="absolute top-4 right-4 bg-black/50 text-green-400 font-mono px-2 py-1 rounded">
      FPS: {{ fps }}
    </div>

    <!-- 全屏加载遮罩层 -->
    <div v-if="isLoading" class="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center">
      <div class="text-white mb-2">{{ loadingText }}</div>
      <div class="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 transition-all duration-300" :style="{ width: `${loadingPercent}%` }"></div>
      </div>
    </div>
  </div>
</template>
```
