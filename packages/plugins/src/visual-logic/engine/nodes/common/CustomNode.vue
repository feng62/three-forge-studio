<template>
  <div 
    class="rounded-xl cursor-pointer box-border relative select-none shadow-xl transition-all duration-200 bg-[#1a1a1a]/85 backdrop-blur-md flex flex-col ring-1 ring-white/10" 
    :style="nodeStyles()" 
    data-testid="node"
  >
    <!-- Header Bar (Blueprint style) -->
    <div 
      class="text-white font-sans text-sm font-bold px-3 py-2 flex items-center justify-between rounded-t-xl" 
      :style="{ backgroundColor: getHeaderColor(), textShadow: '0 1px 2px rgba(0,0,0,0.5)' }"
      data-testid="title"
    >
      <div class="flex items-center gap-2">
        <span>{{ data.label }}</span>
      </div>
    </div>
    
    <div class="flex flex-col py-2">
      <!-- 1. Execution Lines at the top -->
      <div class="flex justify-between w-full mb-1" v-if="execInputs().length > 0 || execOutputs().length > 0">
        <div class="flex flex-col items-start">
          <div class="flex items-center min-h-[28px] w-full justify-start" v-for="[key, input] in execInputs()" :key="'input' + key + seed" :data-testid="'input-' + key">
            <RefComponent class="-ml-3 mr-2 inline-block" :emit="props.emit"
              :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
              data-testid="input-socket" />
            <div class="text-white/90 font-sans text-xs font-medium">{{ input.label }}</div>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <div class="flex items-center min-h-[28px] w-full justify-end" v-for="[key, output] in execOutputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
            <div class="text-white/90 font-sans text-xs font-medium">{{ output.label }}</div>
            <RefComponent class="-mr-3 ml-2 inline-block" :emit="props.emit"
              :data="{ type: 'socket', side: 'output', key: key, nodeId: data.id, payload: output.socket }"
              data-testid="output-socket" />
          </div>
        </div>
      </div>

      <!-- 2. Controls in the middle -->
      <div class="px-3 my-1" v-if="controls().length > 0">
        <RefComponent class="py-1 w-full box-border" v-for="[key, control] in controls()" :key="'control' + key + seed" :emit="props.emit"
          :data="{ type: 'control', payload: control }" :data-testid="'control-' + key" />
      </div>

      <!-- 3. Data Inputs -->
      <div class="data-inputs mt-1" v-if="dataInputs().length > 0">
        <div class="flex items-center min-h-[28px] w-full justify-start" v-for="[key, input] in dataInputs()" :key="'input' + key + seed" :data-testid="'input-' + key">
          <RefComponent class="-ml-2 mr-2 inline-block" :emit="props.emit"
            :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
            data-testid="input-socket" />
          <div class="text-white/80 font-sans text-xs" v-if="!input.control || !input.showControl" data-testid="input-title">{{ input.label }}</div>
          <RefComponent class="z-10 grow mr-3" v-if="input.control && input.showControl" :emit="props.emit"
            :data="{ type: 'control', payload: input.control }" data-testid="input-control" />
        </div>
      </div>

      <!-- 4. Data Outputs -->
      <div class="data-outputs mt-1" v-if="dataOutputs().length > 0">
        <div class="flex items-center min-h-[28px] w-full justify-end" v-for="[key, output] in dataOutputs()" :key="'output' + key + seed" :data-testid="'output-' + key">
          <div class="text-white/80 font-sans text-xs" data-testid="output-title">{{ output.label }}</div>
          <RefComponent class="-mr-2 ml-2 inline-block" :emit="props.emit"
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

const categoryColors: Record<string, string> = {
  '交互事件': '#dc2626', // UE 触发器/事件 红色 (Red)
  '动作执行': '#2563eb', // UE 执行动作 蓝色 (Blue)
  '系统动作': '#4f46e5', // 靛蓝色 (Indigo)
  '镜头动画': '#3b82f6', // 浅蓝色 (Light Blue)
  '标签/UI': '#0d9488', // 标签/UI 深青色 (Teal)
  '控制流/条件': '#0891b2', // 控制流 蓝绿色 (Cyan)
  '逻辑运算': '#14b8a6', // 纯逻辑/数学 浅青色 (Light Cyan)
  '变量与数据': '#059669', // 变量与数据 绿色 (Green)
  '定时/延时': '#7c3aed', // 延时/时间 紫色 (Purple)
};

function getHeaderColor() {
  const cat = props.data.category || '';
  return props.data.logColor || categoryColors[cat] || '#818cf8';
}

function nodeStyles() {
  const color = getHeaderColor();
  return {
    width: Number.isFinite(props.data.width) ? `${props.data.width}px` : '240px',
    height: 'auto',
    minHeight: Number.isFinite(props.data.height) ? `${props.data.height}px` : '',
    boxShadow: props.data.selected ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 20px ${color}` : ''
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
