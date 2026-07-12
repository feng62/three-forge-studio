<template>
  <div 
    class="bg-slate-900/85 backdrop-blur-[12px] border border-teal-400/30 rounded-xl cursor-pointer box-border relative select-none shadow-[0_4px_20px_rgba(90,200,250,0.4),inset_0_0_15px_rgba(90,200,250,0.05)] transition-all duration-300 ease-out hover:shadow-[0_8px_30px_rgba(90,200,250,0.6),inset_0_0_20px_rgba(90,200,250,0.1)] hover:border-teal-400/60 hover:-translate-y-[2px]" 
    :class="[data.selected ? '!border-teal-400 shadow-[0_0_0_2px_rgba(90,200,250,0.4),0_8px_30px_rgba(90,200,250,0.6)]' : '']" 
    :style="nodeStyles()" 
    data-testid="node"
  >
    <!-- Header with Icon -->
    <div class="flex items-center bg-gradient-to-r from-teal-500/15 to-teal-500/5 border-b border-teal-400/20 px-[14px] py-[10px] gap-[10px] rounded-t-xl">
      <div class="w-6 h-6 text-teal-400 flex items-center justify-center">
        <!-- SVG Gear Icon -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(90,200,250,0.6)]"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
      </div>
      <div class="text-teal-100 font-sans text-[15px] font-semibold tracking-wide uppercase" data-testid="title">{{ data.label }}</div>
    </div>
    
    <div class="pt-3 pb-4 px-0">
      <!-- 1. Execution Lines at the top -->
      <div class="flex justify-between w-full mb-3" v-if="execInputs().length > 0 || execOutputs().length > 0">
        <div class="flex flex-col items-start">
          <div class="flex items-center min-h-[32px] w-full justify-start" v-for="[key, input] in execInputs()" :key="'input' + key + seed" :data-testid="'input-' + key">
            <RefComponent class="-ml-3 mr-2 inline-block" :emit="props.emit"
              :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
              data-testid="input-socket" />
            <div class="text-slate-300 font-sans text-[13px] font-medium">{{ input.label }}</div>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <div class="flex items-center min-h-[32px] w-full justify-end" v-for="[key, output] in execOutputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
            <div class="text-slate-300 font-sans text-[13px] font-medium">{{ output.label }}</div>
            <RefComponent class="-mr-3 ml-2 inline-block" :emit="props.emit"
              :data="{ type: 'socket', side: 'output', key: key, nodeId: data.id, payload: output.socket }"
              data-testid="output-socket" />
          </div>
        </div>
      </div>

      <!-- 2. Controls in the middle -->
      <div class="px-3 my-2" v-if="controls().length > 0">
        <RefComponent class="py-1 w-full box-border" v-for="[key, control] in controls()" :key="'control' + key + seed" :emit="props.emit"
          :data="{ type: 'control', payload: control }" :data-testid="'control-' + key" />
      </div>

      <!-- 3. Data Inputs -->
      <div class="data-inputs" v-if="dataInputs().length > 0">
        <div class="flex items-center min-h-[32px] w-full justify-start" v-for="[key, input] in dataInputs()" :key="'input' + key + seed" :data-testid="'input-' + key">
          <RefComponent class="-ml-3 mr-2 inline-block" :emit="props.emit"
            :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
            data-testid="input-socket" />
          <div class="text-slate-300 font-sans text-[13px] font-medium" v-if="!input.control || !input.showControl" data-testid="input-title">{{ input.label }}</div>
          <RefComponent class="z-10 grow mr-3" v-if="input.control && input.showControl" :emit="props.emit"
            :data="{ type: 'control', payload: input.control }" data-testid="input-control" />
        </div>
      </div>

      <!-- 4. Data Outputs -->
      <div class="data-outputs" v-if="dataOutputs().length > 0">
        <div class="flex items-center min-h-[32px] w-full justify-end" v-for="[key, output] in dataOutputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
          <div class="text-slate-300 font-sans text-[13px] font-medium" data-testid="output-title">{{ output.label }}</div>
          <RefComponent class="-mr-3 ml-2 inline-block" :emit="props.emit"
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
    width: Number.isFinite(props.data.width) ? `${props.data.width}px` : '240px',
    height: 'auto',
  };
}

function allInputs() {
  return sortByIndex(Object.entries(props.data.inputs || {}));
}

function allOutputs() {
  return sortByIndex(Object.entries(props.data.outputs || {}));
}

function execInputs() {
  return allInputs().filter(([_, input]) => input?.socket?.name === 'execution');
}

function dataInputs() {
  return allInputs().filter(([_, input]) => input?.socket?.name !== 'execution');
}

function execOutputs() {
  return allOutputs().filter(([_, output]) => output?.socket?.name === 'execution');
}

function dataOutputs() {
  return allOutputs().filter(([_, output]) => output?.socket?.name !== 'execution');
}

function controls() {
  return sortByIndex(Object.entries(props.data.controls || {}));
}
</script>

<style scoped>
/* Scoped styles for select elements within this component */
:deep(.select-control select) {
  background: rgba(90,200,250, 0.6) !important;
  border: 1px solid rgba(90,200,250, 0.4) !important;
  color: #38bdf8 !important;
  font-weight: 600;
}
:deep(.select-control select:focus) {
  box-shadow: 0 0 0 2px rgba(90,200,250, 0.2) !important;
}
</style>
