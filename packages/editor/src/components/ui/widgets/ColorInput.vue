<script setup lang="ts">
import { ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  modelValue: THREE.Color | number | string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

// Convert incoming value to #rrggbb string for el-color-picker
const getHexStr = (val: any) => {
  if (val && val.isColor) {
    return '#' + val.getHexString()
  } else if (typeof val === 'number') {
    return '#' + val.toString(16).padStart(6, '0')
  } else if (typeof val === 'string') {
    return val.startsWith('#') ? val : '#' + val
  }
  return '#ffffff'
}

const colorStr = ref(getHexStr(props.modelValue))

watch(() => props.modelValue, (newVal) => {
  const hex = getHexStr(newVal)
  if (hex !== colorStr.value) {
    colorStr.value = hex
  }
})

const onActiveChange = (val: string) => {
  if (!val) return
  // During drag
  emit('update:modelValue', parseInt(val.replace('#', ''), 16))
}

const onChange = (val: string) => {
  if (!val) return
  // On drag end
  emit('change', parseInt(val.replace('#', ''), 16))
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span v-if="label" class="text-text-muted truncate flex-1" :title="label">{{ label }}</span>
    <el-color-picker 
      v-model="colorStr" 
      size="small" 
      @active-change="onActiveChange"
      @change="onChange"
    />
  </div>
</template>
