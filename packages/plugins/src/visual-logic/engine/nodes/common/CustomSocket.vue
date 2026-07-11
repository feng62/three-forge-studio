<template>
  <div class="inline-block cursor-pointer align-middle bg-transparent z-10 box-border" :class="socketClass" :title="data.name"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: any;
}>();

const socketClass = computed(() => {
  const socketObj = props.data?.payload || props.data || {};
  const isExecution = socketObj.name === 'execution';
  
  const baseClasses = isExecution 
    ? 'w-[22px] h-[22px] bg-white [clip-path:polygon(0%_15%,60%_15%,100%_50%,60%_85%,0%_85%)] transition-colors duration-200 hover:bg-purple-400'
    : 'w-[18px] h-[18px] rounded-full border-2 bg-[#1e1e20] transition-colors duration-200';
  
  let colorClass = '';
  if (!isExecution) {
    if (socketObj.name === 'boolean') {
      colorClass = 'border-red-500 hover:bg-red-500';
    } else if (socketObj.name === 'number') {
      colorClass = 'border-emerald-500 hover:bg-emerald-500';
    } else if (socketObj.name === 'string') {
      colorClass = 'border-pink-500 hover:bg-pink-500';
    } else {
      colorClass = 'border-gray-400 hover:bg-gray-400';
    }
  }
  
  return [baseClasses, colorClass];
});
</script>
