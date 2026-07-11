<template>
  <svg data-testid="connection" class="overflow-visible !absolute pointer-events-none w-[9999px] h-[9999px]">
    <path :d="path" :class="[isExecution ? 'stroke-emerald-500 stroke-[6px] [stroke-dasharray:10,8] animate-flow' : 'stroke-[steelblue] stroke-[5px]', 'fill-none pointer-events-auto']"></path>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: any;
  start?: any;
  end?: any;
  path: string;
}>();

const isExecution = computed(() => {
  if (props.data && props.data.isExecution) {
    return true;
  }
  const execKeys = ['exec', 'before', 'after', 'trueOut', 'falseOut', 'execOut', 'execIn'];
  return props.data && (execKeys.includes(props.data.sourceOutput) || execKeys.includes(props.data.targetInput));
});
</script>

<style scoped>
.animate-flow {
  animation: flow 0.8s linear infinite;
}
@keyframes flow {
  from { stroke-dashoffset: 18; }
  to { stroke-dashoffset: 0; }
}
</style>
