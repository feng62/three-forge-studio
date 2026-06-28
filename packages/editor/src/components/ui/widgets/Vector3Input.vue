<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: { x: number, y: number, z: number }
  step?: number
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { x: number, y: number, z: number }): void
  (e: 'change', value: { x: number, y: number, z: number }): void
}>()

const x = ref(props.modelValue.x)
const y = ref(props.modelValue.y)
const z = ref(props.modelValue.z)

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    x.value = newVal.x
    y.value = newVal.y
    z.value = newVal.z
  }
}, { deep: true })

const updateVal = () => {
  if (x.value === undefined || y.value === undefined || z.value === undefined) return
  emit('update:modelValue', { x: x.value, y: y.value, z: z.value })
}

const onChange = () => {
  if (x.value === undefined || y.value === undefined || z.value === undefined) return
  emit('change', { x: x.value, y: y.value, z: z.value })
}

// --- Drag to change logic ---
let isDragging = false
let startXMouse = 0
let startValue = 0
let activeAxis: 'x' | 'y' | 'z' | null = null

const onInputMouseDown = (e: MouseEvent, axis: 'x' | 'y' | 'z') => {
  // If clicking on controls (+/-), don't intercept
  const target = e.target as HTMLElement
  if (target.closest('.el-input-number__increase') || target.closest('.el-input-number__decrease')) {
    return
  }

  activeAxis = axis
  startXMouse = e.clientX
  startValue = axis === 'x' ? x.value : (axis === 'y' ? y.value : z.value)

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!activeAxis) return

    if (!isDragging && Math.abs(moveEvent.clientX - startXMouse) > 2) {
      isDragging = true
      // Blur the input to prevent text selection / typing while dragging
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }

    if (isDragging) {
      const deltaX = moveEvent.clientX - startXMouse
      // Adjust sensitivity
      const sensitivity = 0.5
      const multiplier = moveEvent.shiftKey ? 10 : (moveEvent.altKey ? 0.1 : 1)
      const stepVal = (props.step || 0.1) * multiplier * sensitivity
      
      let newVal = startValue + deltaX * stepVal
      newVal = parseFloat(newVal.toFixed(3))
      
      if (activeAxis === 'x') x.value = newVal
      else if (activeAxis === 'y') y.value = newVal
      else if (activeAxis === 'z') z.value = newVal
      
      updateVal()
    }
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    if (isDragging) {
      onChange()
      // Delay resetting to prevent subsequent click events from triggering focus
      setTimeout(() => { isDragging = false; activeAxis = null }, 50)
    } else {
      activeAxis = null
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div class="flex flex-col gap-1 w-full text-xs vector3-input">
    <div v-if="label" class="text-text-muted truncate w-full mb-1" :title="label">{{ label }}</div>
    <div class="flex items-center gap-2 w-full">
      <div class="flex items-center gap-1 flex-1 cursor-ew-resize min-w-0" @mousedown="onInputMouseDown($event, 'x')">
        <span class="text-red-400 font-medium select-none w-3 text-center shrink-0">X</span>
        <el-input-number v-model="x" :step="step || 0.1" :controls="false" size="small" class="w-full pointer-events-auto" @input="updateVal" @change="onChange" />
      </div>
      <div class="flex items-center gap-1 flex-1 cursor-ew-resize min-w-0" @mousedown="onInputMouseDown($event, 'y')">
        <span class="text-green-400 font-medium select-none w-3 text-center shrink-0">Y</span>
        <el-input-number v-model="y" :step="step || 0.1" :controls="false" size="small" class="w-full pointer-events-auto" @input="updateVal" @change="onChange" />
      </div>
      <div class="flex items-center gap-1 flex-1 cursor-ew-resize min-w-0" @mousedown="onInputMouseDown($event, 'z')">
        <span class="text-blue-400 font-medium select-none w-3 text-center shrink-0">Z</span>
        <el-input-number v-model="z" :step="step || 0.1" :controls="false" size="small" class="w-full pointer-events-auto" @input="updateVal" @change="onChange" />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input-number .el-input__wrapper) {
  padding-left: 4px;
  padding-right: 4px;
}
:deep(.el-input__inner) {
  text-align: left;
}
</style>
