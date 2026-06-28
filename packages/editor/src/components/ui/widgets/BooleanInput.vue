<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  internalValue.value = newVal
})

const onChange = (val: string | number | boolean) => {
  emit('update:modelValue', val as boolean)
  emit('change', val as boolean)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span v-if="label" class="text-text-muted truncate flex-1" :title="label">{{ label }}</span>
    <el-switch 
      v-model="internalValue" 
      size="small"
      @change="onChange"
    />
  </div>
</template>
