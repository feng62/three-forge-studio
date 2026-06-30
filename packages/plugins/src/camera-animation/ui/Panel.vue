<script setup lang="ts">
import { ref, watch } from 'vue'
import { CameraAnimationEditorPlugin } from '../editor'
import { CameraAnimationCorePlugin } from '../core'
import type { Viewpoint, CameraAnimationData } from '../types'
import * as THREE from 'three'
import { Plus, Delete, VideoPlay, Aim } from '@element-plus/icons-vue'

const props = defineProps<{
  /** 父级传入的 Three.js 引擎实例，包含场景、相机、渲染器等 */
  engine: any,
  /** 场景数据的版本号，用于监听场景状态变动从而刷新插件的本地数据 */
  sceneGraphVersion: number
}>()

const emit = defineEmits<{
  /** 通知父组件（编辑器面板）将最新的底层场景数据持久化至 IndexedDB */
  (e: 'save'): void
}>()

/** 当前组件内存中的视角列表状态 */
const viewpoints = ref<Viewpoint[]>([])
/** 当前用户激活的视角 ID */
const currentViewpointId = ref<string | null>(null)

// 监听引擎实例，如果被注入，则初始化编辑器插件并读取存量视角数据
watch(() => props.engine, (newEngine) => {
  if (newEngine) {
    CameraAnimationEditorPlugin.onInstall({ engine: newEngine })
    loadData()
  }
}, { immediate: true })

// 监听场景图版本更新，确保在别的面板导入新模型/清空场景时，插件的视角数据也能同步重置或刷新
watch(() => props.sceneGraphVersion, () => {
  loadData()
})

/** 从 userData 加载数据渲染到组件内存 */
const loadData = () => {
  const data = CameraAnimationEditorPlugin.loadData() as CameraAnimationData
  if (data && data.viewpoints) {
    viewpoints.value = data.viewpoints
  }
}

/** 触发底层保存到 userData，并通知父级落盘 */
const saveData = () => {
  CameraAnimationEditorPlugin.saveData({ viewpoints: viewpoints.value })
  // Trigger save to immediately update the Scene Details JSON viewer
  emit('save')
}

/**
 * 新增视角
 * 捕获当前相机的真实坐标、焦点（LookAt）以及当前场景中被隐藏的模型
 */
const addViewpoint = () => {
  if (!props.engine || !props.engine.camera) return
  
  const cam = props.engine.camera
  const controls = props.engine.orbitControls
  const lookAt = controls?.target ? controls.target.clone() : new THREE.Vector3(0,0,0)

  const newVp: Viewpoint = {
    id: THREE.MathUtils.generateUUID(),
    name: `视角 ${viewpoints.value.length + 1}`,
    cameraPosition: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
    cameraLookAt: { x: lookAt.x, y: lookAt.y, z: lookAt.z },
    memoryMode: false,
    enterSetting: { hasAnimation: true, duration: 1.5, easing: 'power2.inOut' },
    exitSetting: { hasAnimation: true, duration: 1.5, easing: 'power2.inOut' }
  }

  viewpoints.value.push(newVp)
  saveData()
}

/** 删除指定视角 */
const deleteViewpoint = (id: string) => {
  viewpoints.value = viewpoints.value.filter(v => v.id !== id)
  saveData()
}

/**
 * 将某个视角的配置更新为当前画布中最新的相机状态和显隐状态
 */
const updateViewpointCamera = (vp: Viewpoint) => {
  if (!props.engine || !props.engine.camera) return
  const cam = props.engine.camera
  const controls = props.engine.orbitControls
  const lookAt = controls?.target ? controls.target.clone() : new THREE.Vector3(0,0,0)
  
  vp.cameraPosition = { x: cam.position.x, y: cam.position.y, z: cam.position.z }
  vp.cameraLookAt = { x: lookAt.x, y: lookAt.y, z: lookAt.z }
  
  saveData()
}

/**
 * 触发漫游核心插件的补间动画，跳转至目标视角
 */
const playViewpoint = (vp: Viewpoint) => {
  if (!props.engine) return
  // 确保核心插件已经被初始化
  if (!CameraAnimationCorePlugin.engine) {
     CameraAnimationCorePlugin.onInstall(props.engine)
  }
  CameraAnimationCorePlugin.switchToViewpoint(vp, viewpoints.value, () => {
    currentViewpointId.value = vp.id
  })
}

</script>

<template>
  <div class="camera-animation-panel flex flex-col h-full w-full bg-panel">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
      <div class="flex items-center justify-between">
        <span class="text-xs text-text-muted">场景视角列表</span>
        <el-button size="small" type="primary" @click="addViewpoint">
          <el-icon class="mr-1"><Plus /></el-icon> 添加视角
        </el-button>
      </div>

      <div v-if="viewpoints.length === 0" class="text-xs text-center text-text-muted py-8">
        暂无视角，点击添加当前视角
      </div>

      <div v-for="vp in viewpoints" :key="vp.id" 
           class="bg-bg-base p-3 rounded border flex flex-col gap-3 transition-colors"
           :class="currentViewpointId === vp.id ? 'border-accent' : 'border-border'">
        
        <div class="flex items-center justify-between">
          <el-input v-model="vp.name" size="small" class="w-32 font-semibold" @change="saveData" />
          <div class="flex items-center gap-1">
            <el-button size="small" title="更新为当前相机位姿与显隐" @click="updateViewpointCamera(vp)">
              <el-icon><Aim /></el-icon>
            </el-button>
            <el-button size="small" type="success" title="播放到该视角" @click="playViewpoint(vp)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
            <el-button size="small" type="danger" link @click="deleteViewpoint(vp.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="flex flex-col gap-2 text-xs">
          <!-- Memory Mode -->
          <div class="flex items-center justify-between bg-panel p-1 rounded">
            <span class="text-text-muted" title="再次返回时是否恢复被修改过的视角">记忆模式</span>
            <el-switch v-model="vp.memoryMode" size="small" @change="saveData" />
          </div>

          <!-- Enter Setting -->
          <div class="text-text-muted mt-1 font-semibold border-b border-border pb-1">前进进入配置</div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center justify-between">
              <span class="text-text-muted">启用动画</span>
              <el-switch v-model="vp.enterSetting.hasAnimation" size="small" @change="saveData" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">时长(s)</span>
              <el-input-number v-model="vp.enterSetting.duration" :min="0" :step="0.5" size="small" class="w-[88px]" @change="saveData" />
            </div>
          </div>

          <!-- Exit Setting -->
          <div class="text-text-muted mt-1 font-semibold border-b border-border pb-1">退出返回配置</div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center justify-between">
              <span class="text-text-muted">启用动画</span>
              <el-switch v-model="vp.exitSetting.hasAnimation" size="small" @change="saveData" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">时长(s)</span>
              <el-input-number v-model="vp.exitSetting.duration" :min="0" :step="0.5" size="small" class="w-[88px]" @change="saveData" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-dark, #4c4d4f);
  border-radius: 4px;
}
</style>
