<template>
  <div 
    class="bg-[#252526] border border-[#3f3f46] rounded-[40px] cursor-pointer box-border py-1 pr-3 pl-4 relative select-none shadow-md transition-all duration-200 hover:bg-[#3f3f46] hover:border-zinc-500" 
    :class="[data.selected ? '!border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.3)]' : '']" 
    :style="nodeStyles()" 
    data-testid="node"
  >
    <!-- Variables only have outputs and controls -->
    <div class="flex items-center justify-between h-full gap-2">
      <div class="flex gap-1 items-center flex-1">
        <RefComponent class="inline-block" v-for="[key, control] in controls()" :key="'control' + key + seed" :emit="props.emit"
          :data="{ type: 'control', payload: control }" :data-testid="'control-' + key" />
      </div>
      <div class="flex items-center justify-end">
        <div class="flex items-center" v-for="[key, output] in outputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
          <!-- We don't need output title for pill node, just the socket -->
          <RefComponent class="text-right -mr-[10px] inline-block" :emit="props.emit"
            :data="{ type: 'socket', side: 'output', key: key, nodeId: data.id, payload: output.socket }"
            data-testid="output-socket" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref as RefComponent } from 'rete-vue-plugin';

const props = defineProps<{
  data: any;
  emit: any;
  seed: number | string;
}>();

function sortByIndex(entries: any[]) {
  entries.sort((a, b) => {
    const ai = a[1] && a[1].index || 0;
    const bi = b[1] && b[1].index || 0;
    return ai - bi;
  });
  return entries;
}

function nodeStyles() {
  return {
    width: Number.isFinite(props.data.width) ? `${props.data.width}px` : '',
    height: Number.isFinite(props.data.height) ? `${props.data.height}px` : ''
  };
}

function controls() {
  return sortByIndex(Object.entries(props.data.controls || {}));
}

function outputs() {
  return sortByIndex(Object.entries(props.data.outputs || {}));
}

function dataOutputs() {
  return outputs().filter(([_, output]) => output?.socket?.name !== 'execution');
}
</script>
