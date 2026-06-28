<script setup lang="ts">
import { ref, computed } from 'vue'
import { Object3D } from 'three'
import { useEngineStore } from '../../stores/engineStore'
import { SetPropertyCommand } from '../../history/SetPropertyCommand'
import { historyManager } from '../../history/HistoryManager'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps<{
  object: Object3D
}>()

const engineStore = useEngineStore()

// Filter out internal properties that shouldn't be edited by the user
const internalKeys = ['isHelper', 'isExternalModel', 'externalModelId', '_externalModifications', '_unknownExtensions']

// Data model for adding a new property
const showAddForm = ref(false)
const newKey = ref('')
const newValue = ref('')
const newValueType = ref('string')

const typeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' }
]

// Computed list of editable properties
const editableUserData = computed(() => {
  // Track sceneGraphVersion to force reactivity when properties change via HistoryManager
  engineStore.sceneGraphVersion;
  
  if (!props.object || !props.object.userData) return []
  const result = []
  for (const key in props.object.userData) {
    if (!internalKeys.includes(key)) {
      result.push({ key, value: props.object.userData[key] })
    }
  }
  return result
})

const parseValue = (val: string, type: string) => {
  if (type === 'number') return Number(val)
  if (type === 'boolean') return val === 'true'
  return val
}

const addProperty = () => {
  if (!newKey.value || newKey.value.trim() === '') return
  if (internalKeys.includes(newKey.value)) return // prevent overwriting internal keys
  
  const keyName = newKey.value.trim()
  const val = parseValue(newValue.value, newValueType.value)
  
  const cmd = new SetPropertyCommand(
    engineStore.engine!,
    props.object,
    `userData.${keyName}`,
    val,
    undefined
  )
  historyManager.execute(cmd)
  
  // reset form
  newKey.value = ''
  newValue.value = ''
  showAddForm.value = false
}

const deleteProperty = (key: string) => {
  const oldVal = props.object.userData[key]
  const cmd = new SetPropertyCommand(
    engineStore.engine!,
    props.object,
    `userData.${key}`,
    undefined,
    oldVal
  )
  historyManager.execute(cmd)
}

const handleValueChange = (key: string, newVal: any) => {
  const oldVal = props.object.userData[key]
  // Since we don't know the intended type of arbitrary new input, we can infer from oldVal
  let typedVal = newVal
  if (typeof oldVal === 'number') {
    typedVal = Number(newVal)
  } else if (typeof oldVal === 'boolean') {
    typedVal = newVal === 'true' || newVal === true
  }

  if (typedVal !== oldVal) {
    const cmd = new SetPropertyCommand(
      engineStore.engine!,
      props.object,
      `userData.${key}`,
      typedVal,
      oldVal
    )
    historyManager.execute(cmd)
  }
}
</script>

<template>
  <div class="user-data-editor bg-bg-base/80 p-3 rounded-panel border border-border flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-semibold text-text-muted uppercase">自定义数据 (UserData)</div>
      <el-button size="small" type="primary" link @click="showAddForm = !showAddForm">
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>

    <!-- Add Property Form -->
    <div v-if="showAddForm" class="flex flex-col gap-2 p-2 bg-panel rounded border border-border">
      <div class="flex gap-2">
        <el-input v-model="newKey" placeholder="属性名" size="small" class="flex-1" />
        <el-select v-model="newValueType" size="small" style="width: 90px">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="flex gap-2">
        <el-input 
          v-if="newValueType === 'string' || newValueType === 'number'" 
          v-model="newValue" 
          placeholder="属性值" 
          size="small" 
          class="flex-1" 
        />
        <el-select v-else v-model="newValue" size="small" class="flex-1">
          <el-option label="true" value="true" />
          <el-option label="false" value="false" />
        </el-select>
        <el-button size="small" type="primary" @click="addProperty">添加</el-button>
      </div>
    </div>

    <!-- Properties List -->
    <div v-if="editableUserData.length === 0 && !showAddForm" class="text-xs text-text-muted text-center py-2">
      暂无自定义数据
    </div>
    
    <div v-for="item in editableUserData" :key="item.key" class="flex items-center gap-2">
      <div class="text-xs text-text-muted truncate w-1/3" :title="item.key">{{ item.key }}</div>
      
      <!-- Value Edit Field -->
      <div class="flex-1 flex items-center gap-1">
        <el-input 
          v-if="typeof item.value === 'string' || typeof item.value === 'number'"
          :model-value="item.value"
          @change="handleValueChange(item.key, $event)"
          size="small" 
          class="flex-1" 
        />
        <el-switch 
          v-else-if="typeof item.value === 'boolean'"
          :model-value="item.value"
          @change="handleValueChange(item.key, $event)"
          size="small"
        />
        <div v-else class="text-xs text-text-muted flex-1 px-2 border rounded border-border bg-panel">
          {{ typeof item.value === 'object' ? '对象 (Object)' : String(item.value) }}
        </div>
        
        <el-button size="small" type="danger" link @click="deleteProperty(item.key)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
