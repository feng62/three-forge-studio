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
    ? 'w-[18px] h-[18px] bg-white/90 [clip-path:polygon(0%_15%,60%_15%,100%_50%,60%_85%,0%_85%)] transition-all duration-200 hover:scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]'
    : 'w-[14px] h-[14px] rounded-full border-[3px] bg-[#1a1a1a] transition-all duration-200 hover:scale-110 ring-offset-0 ring-offset-[#1a1a1a]';
  
  let colorClass = '';
  if (!isExecution) {
    if (socketObj.name === 'boolean') {
      colorClass = 'border-red-500 hover:bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    } else if (socketObj.name === 'number') {
      colorClass = 'border-emerald-500 hover:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
    } else if (socketObj.name === 'string') {
      colorClass = 'border-pink-500 hover:bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]';
    } else {
      colorClass = 'border-blue-400 hover:bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]';
    }
  }
  
  return [baseClasses, colorClass];
});
</script>
