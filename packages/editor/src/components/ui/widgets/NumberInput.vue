<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number
  label?: string
  min?: number
  max?: number
  step?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  internalValue.value = newVal
})

const onInput = (val: number | undefined) => {
  if (val === undefined) return
  emit('update:modelValue', val)
}

const onChange = (val: number | undefined) => {
  if (val === undefined) return
  emit('change', val)
}

// --- Drag to change logic ---
let isDragging = false
let startX = 0
let startValue = 0

const onInputMouseDown = (e: MouseEvent) => {
  // If clicking on controls (+/-), don't intercept
  const target = e.target as HTMLElement
  if (target.closest('.el-input-number__increase') || target.closest('.el-input-number__decrease')) {
    return
  }

  startX = e.clientX
  startValue = internalValue.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging && Math.abs(moveEvent.clientX - startX) > 2) {
      isDragging = true
      // Blur the input to prevent text selection / typing while dragging
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }

    if (isDragging) {
      const deltaX = moveEvent.clientX - startX
      // Adjust sensitivity: e.g., 1 pixel = 1 step
      const sensitivity = 0.5
      const multiplier = moveEvent.shiftKey ? 10 : (moveEvent.altKey ? 0.1 : 1)
      const stepVal = (props.step || 0.1) * multiplier * sensitivity
      
      let newVal = startValue + deltaX * stepVal
      
      if (props.min !== undefined) newVal = Math.max(props.min, newVal)
      if (props.max !== undefined) newVal = Math.min(props.max, newVal)
      
      newVal = parseFloat(newVal.toFixed(3))
      
      internalValue.value = newVal
      emit('update:modelValue', newVal)
    }
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    if (isDragging) {
      emit('change', internalValue.value)
      // Delay resetting to prevent subsequent click events from triggering focus
      setTimeout(() => { isDragging = false }, 50)
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span 
      v-if="label" 
      class="text-text-muted truncate flex-1 cursor-ew-resize select-none" 
      :title="label"
      @mousedown="onInputMouseDown"
    >
      {{ label }}
    </span>
    <div 
      class="w-[60px] shrink-0 cursor-ew-resize"
      @mousedown="onInputMouseDown"
    >
      <el-input-number 
        v-model="internalValue" 
        :min="min" 
        :max="max" 
        :step="step || 0.1" 
        size="small" 
        :controls="false"
        class="w-full pointer-events-auto"
        @input="onInput"
        @change="onChange"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input-number .el-input__wrapper) {
  padding-left: 8px;
  padding-right: 8px;
}
:deep(.el-input__inner) {
  text-align: left;
}

:deep(.el-input-number--small) {
  width: 100%;
  line-height: 22px;
}
</style>
