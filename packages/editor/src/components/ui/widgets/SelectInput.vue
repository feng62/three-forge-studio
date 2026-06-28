<script setup lang="ts">
const props = defineProps<{
  modelValue: any
  label?: string
  options?: { label: string; value: any }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}>()

const onChange = (val: any) => {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span v-if="label" class="text-text-muted truncate flex-1" :title="label">{{ label }}</span>
    <el-select
      :model-value="modelValue"
      size="small"
      class="w-24"
      @change="onChange"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>
