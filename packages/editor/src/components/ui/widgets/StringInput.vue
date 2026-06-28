<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  internalValue.value = newVal
})

const onInput = (val: string) => {
  emit('update:modelValue', val)
}

const onChange = (val: string) => {
  emit('change', val)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span v-if="label" class="text-text-muted truncate flex-1" :title="label">{{ label }}</span>
    <div class="w-[120px] shrink-0">
      <el-input 
        v-model="internalValue" 
        size="small" 
        class="w-full"
        @input="onInput"
        @change="onChange"
      />
    </div>
  </div>
</template>
