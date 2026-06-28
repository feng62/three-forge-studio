<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useEngineStore } from '../../stores/engineStore'
import * as THREE from 'three'
import { PropertyRegistry, PropertyGroup, PropertyField } from '../../config/PropertyRegistry'
import { SetPropertyCommand } from '../../history/SetPropertyCommand'
import { historyManager } from '../../history/HistoryManager'

import NumberInput from './widgets/NumberInput.vue'
import Vector3Input from './widgets/Vector3Input.vue'
import ColorInput from './widgets/ColorInput.vue'
import BooleanInput from './widgets/BooleanInput.vue'
import StringInput from './widgets/StringInput.vue'
import SelectInput from './widgets/SelectInput.vue'
import TextureInput from './widgets/TextureInput.vue'
import UserDataEditor from './UserDataEditor.vue'

const engineStore = useEngineStore()
const selectedObject = ref<THREE.Object3D | null>(null)
const propertyGroups = ref<PropertyGroup[]>([])

// 为了方便双向绑定，我们需要一个本地的状态快照
// 这里我们只是在 change 的时候提交 Command
const localState = ref<Record<string, any>>({})

watch(() => [engineStore.selectedObjectUuid, engineStore.sceneGraphVersion], () => {
  const newUuid = engineStore.selectedObjectUuid
  if (!newUuid || !engineStore.engine?.scene) {
    selectedObject.value = null
    propertyGroups.value = []
    localState.value = {}
    return
  }
  
  const obj = engineStore.engine.scene.getObjectByProperty('uuid', newUuid)
  selectedObject.value = obj || null

  if (obj) {
    propertyGroups.value = PropertyRegistry.getGroupsForObject(obj)
    // 根据字段初始化本地 state
    syncTransformToLocalState(obj, true)
  }
}, { immediate: true })

const syncTransformToLocalState = (obj: THREE.Object3D, syncAll: boolean = false) => {
  propertyGroups.value.forEach(group => {
    group.fields.forEach(field => {
      // 只有同步全部，或者当前字段是变换相关字段时才同步
      if (syncAll || ['position', 'rotation', 'scale'].includes(field.path)) {
        let val = getValueByPath(obj, field.path)
        
        // 特殊处理 rotation，转换为角度
        if (field.path === 'rotation' && val && val.isEuler) {
          val = {
            x: THREE.MathUtils.radToDeg(val.x),
            y: THREE.MathUtils.radToDeg(val.y),
            z: THREE.MathUtils.radToDeg(val.z)
          }
        } else if (field.type === 'vector3' && val && typeof val.x === 'number') {
          val = { x: val.x, y: val.y, z: val.z } // copy to trigger reactivity
        }
        
        localState.value[field.id] = val
      }
    })
  })
}

const onObjectTransformChanged = (event: any) => {
  if (selectedObject.value && event.object && selectedObject.value.uuid === event.object.uuid) {
    syncTransformToLocalState(selectedObject.value)
  }
}

onMounted(() => {
  if (engineStore.engine) {
    engineStore.engine.addEventListener('objectTransformChanged', onObjectTransformChanged)
  }
})

onUnmounted(() => {
  if (engineStore.engine) {
    engineStore.engine.removeEventListener('objectTransformChanged', onObjectTransformChanged)
  }
})

const getValueByPath = (obj: any, path: string) => {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current === undefined || current === null) return undefined
    current = current[key]
  }
  return current
}

const getWidgetComponent = (type: string) => {
  switch (type) {
    case 'number': return NumberInput
    case 'vector3': return Vector3Input
    case 'color': return ColorInput
    case 'boolean': return BooleanInput
    case 'string': return StringInput
    case 'select': return SelectInput
    case 'texture': return TextureInput
    default: return StringInput
  }
}

// 记录拖拽开始时的初始值，用于 Command
const dragStartValues: Record<string, any> = {}

const handleFieldInput = (field: PropertyField, val: any) => {
  if (!selectedObject.value || !engineStore.engine) return
  
  // 记录初始值
  if (!(field.id in dragStartValues)) {
    let oldVal = getValueByPath(selectedObject.value, field.path)
    if (field.path === 'rotation' && oldVal && oldVal.isEuler) {
      oldVal = new THREE.Euler(oldVal.x, oldVal.y, oldVal.z, oldVal.order)
    } else if (oldVal && typeof oldVal.clone === 'function') {
      oldVal = oldVal.clone()
    }
    dragStartValues[field.id] = oldVal
  }

  // 转换回来（如果需要）
  let finalVal = val
  if (field.path === 'rotation' && val && typeof val.x === 'number') {
    // UI 传过来的是角度，需要转为弧度
    finalVal = new THREE.Euler(
      THREE.MathUtils.degToRad(val.x),
      THREE.MathUtils.degToRad(val.y),
      THREE.MathUtils.degToRad(val.z),
      'XYZ'
    )
  } else if (field.type === 'vector3' && val && typeof val.x === 'number') {
    finalVal = new THREE.Vector3(val.x, val.y, val.z)
  } else if (field.type === 'color' && typeof val === 'number') {
    finalVal = new THREE.Color(val)
  }

  // 实时修改对象本身，但不记入历史
  const keys = field.path.split('.')
  let current = selectedObject.value as any
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] == null) {
      if (keys[i] === 'fog') {
        current[keys[i]] = new THREE.Fog(0xcccccc, 1, 100)
      } else {
        break
      }
    }
    current = current[keys[i]]
  }
  const finalKey = keys[keys.length - 1]

  if (current[finalKey] && typeof current[finalKey].copy === 'function' && finalVal && typeof finalVal.copy === 'function') {
    current[finalKey].copy(finalVal)
  } else {
    current[finalKey] = finalVal
  }

  // 针对相机的特殊处理
  if (selectedObject.value && (selectedObject.value as any).isPerspectiveCamera && ['fov', 'near', 'far'].includes(finalKey)) {
    (selectedObject.value as any).updateProjectionMatrix()
  }
}

const handleFieldChange = (field: PropertyField, val: any) => {
  if (!selectedObject.value || !engineStore.engine) return
  
  const oldVal = dragStartValues[field.id]
  delete dragStartValues[field.id]

  let finalVal = val
  if (field.path === 'rotation' && val && typeof val.x === 'number') {
    finalVal = new THREE.Euler(
      THREE.MathUtils.degToRad(val.x),
      THREE.MathUtils.degToRad(val.y),
      THREE.MathUtils.degToRad(val.z),
      'XYZ'
    )
  } else if (field.type === 'vector3' && val && typeof val.x === 'number') {
    finalVal = new THREE.Vector3(val.x, val.y, val.z)
  } else if (field.type === 'color' && typeof val === 'number') {
    finalVal = new THREE.Color(val)
  }

  // 如果没有改变，不记录
  if (oldVal !== undefined) {
    const cmd = new SetPropertyCommand(
      engineStore.engine,
      selectedObject.value,
      field.path,
      finalVal,
      oldVal
    )
    historyManager.execute(cmd)
  }
}

const groupRefs = ref<HTMLElement[]>([])
const scrollToGroup = (idx: number) => {
  if (groupRefs.value[idx]) {
    groupRefs.value[idx].scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="properties-panel flex flex-col h-full w-full">
    <div class="h-10 border-b border-border flex items-center px-4 font-medium text-sm text-text-main shrink-0 bg-panel">
      属性面板
    </div>

    <div class="flex-1 flex flex-row overflow-hidden">
      <!-- 左侧竖向标题锚点导航 -->
      <div v-if="selectedObject && propertyGroups.length > 0" class="w-20 shrink-0 border-r border-border bg-panel/80 flex flex-col py-2 gap-1 overflow-y-auto custom-scrollbar">
        <button 
          v-for="(group, idx) in propertyGroups" 
          :key="group.name"
          class="text-[10px] text-left px-2 py-1.5 mx-1 rounded hover:bg-bg-base text-text-muted hover:text-text-main truncate transition-colors"
          :title="group.name"
          @click="scrollToGroup(idx)"
        >
          {{ group.name.replace(/\s*\(.*\)/, '') }}
        </button>
      </div>

      <!-- 属性列表区域 -->
      <div class="flex-1 overflow-y-auto p-4 bg-panel/50 flex flex-col gap-4 custom-scrollbar">
        <div v-if="selectedObject" class="flex flex-col gap-4">
        <!-- UUID -->
        <div class="bg-bg-base/80 p-3 rounded-panel border border-border">
          <div class="flex items-center justify-between">
            <div class="text-xs text-text-muted">对象类型</div>
            <div class="text-xs text-accent font-medium">{{ selectedObject.type }}</div>
          </div>
          <div class="text-xs text-text-muted mt-2 mb-1">标识名称 (Name)</div>
          <el-input v-model="selectedObject.name" size="small" class="w-full" />
        </div>

        <!-- 动态属性组 -->
        <div 
          v-for="(group, idx) in propertyGroups" 
          :key="group.name" 
          class="bg-bg-base/80 p-3 rounded-panel border border-border flex flex-col gap-3 scroll-mt-2"
          :ref="el => { if(el) groupRefs[idx] = el as HTMLElement }"
        >
          <div class="text-xs font-semibold text-text-muted uppercase">{{ group.name }}</div>
          <div v-for="field in group.fields" :key="field.id" class="w-full">
            <component 
              :is="getWidgetComponent(field.type)" 
              v-model="localState[field.id]"
              :label="field.label"
              v-bind="field.options"
              @update:modelValue="handleFieldInput(field, $event)"
              @change="handleFieldChange(field, $event)"
            />
          </div>
        </div>

        <!-- 自定义数据编辑区 -->
        <UserDataEditor :object="selectedObject" />
        
        </div>
        <div v-else class="text-xs text-text-muted text-center mt-10 w-full">
          请在场景树中选择一个对象
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-dark, #4c4d4f);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-text-color-secondary, #a3a6ad);
}
</style>
