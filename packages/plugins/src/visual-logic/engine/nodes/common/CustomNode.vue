<template>
  <div 
    class="border-2 border-white/40 rounded-[10px] cursor-pointer box-border pb-3 relative select-none shadow-md transition-shadow duration-200 hover:shadow-lg" 
    :class="[data.selected ? '!border-blue-500' : '']" 
    :style="nodeStyles()" 
    data-testid="node"
  >
    <div class="text-white font-sans text-base font-medium px-[14px] py-[10px] border-b border-white/20 mb-3" data-testid="title">{{ data.label }}</div>
    
    <!-- 1. Execution Lines at the top -->
    <div class="flex justify-between w-full mb-2" v-if="execInputs().length > 0 || execOutputs().length > 0">
      <div class="flex flex-col items-start">
        <div class="flex items-center min-h-[32px] w-full justify-start" v-for="[key, input] in execInputs()" :key="'input' + key + seed" :data-testid="'input-' + key">
          <RefComponent class="-ml-3 mr-2 inline-block" :emit="props.emit"
            :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
            data-testid="input-socket" />
          <div class="text-white font-sans text-sm">{{ input.label }}</div>
        </div>
      </div>
      <div class="flex flex-col items-end">
        <div class="flex items-center min-h-[32px] w-full justify-end" v-for="[key, output] in execOutputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
          <div class="text-white font-sans text-sm">{{ output.label }}</div>
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
        <div class="text-white font-sans text-sm" v-if="!input.control || !input.showControl" data-testid="input-title">{{ input.label }}</div>
        <RefComponent class="z-10 grow mr-3" v-if="input.control && input.showControl" :emit="props.emit"
          :data="{ type: 'control', payload: input.control }" data-testid="input-control" />
      </div>
    </div>

    <!-- 4. Data Outputs -->
    <div class="data-outputs" v-if="dataOutputs().length > 0">
      <div class="flex items-center min-h-[32px] w-full justify-end" v-for="[key, output] in dataOutputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
        <div class="text-white font-sans text-sm" data-testid="output-title">{{ output.label }}</div>
        <RefComponent class="-mr-3 ml-2 inline-block" :emit="props.emit"
          :data="{ type: 'socket', side: 'output', key: key, nodeId: data.id, payload: output.socket }"
          data-testid="output-socket" />
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

console.log('[CustomNode] Rendered node:', props.data.label, props.data.id);
console.log('[CustomNode] Props emit function:', !!props.emit, typeof props.emit);
console.log('[CustomNode] allInputs count:', Object.keys(props.data.inputs || {}).length);


function sortByIndex(entries: any[]) {
  entries.sort((a, b) => {
    const ai = a[1] && a[1].index || 0;
    const bi = b[1] && b[1].index || 0;
    return ai - bi;
  });
  return entries;
}

function nodeStyles() {
  // 保留原有的背景色或者使用 logColor（为了匹配图1的浅色系风格）
  let bgColor = props.data.logColor || '#818cf8';
  return {
    width: Number.isFinite(props.data.width) ? `${props.data.width}px` : '240px',
    height: 'auto', // 改为 auto 避免内容把边框撑破
    minHeight: Number.isFinite(props.data.height) ? `${props.data.height}px` : '',
    backgroundColor: bgColor
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
