<script setup lang="ts">
import { PhCursor, PhArrowsOutCardinal, PhArrowsClockwise, PhArrowsOut } from '@phosphor-icons/vue';
import { useTransformStore, type TransformMode } from '../../stores/transformStore';

const transformStore = useTransformStore();

const tools = [
  { mode: 'select' as TransformMode, icon: PhCursor, tooltip: 'Select (Space)' },
  { mode: 'translate' as TransformMode, icon: PhArrowsOutCardinal, tooltip: 'Translate (G)' },
  { mode: 'rotate' as TransformMode, icon: PhArrowsClockwise, tooltip: 'Rotate (R)' },
  { mode: 'scale' as TransformMode, icon: PhArrowsOut, tooltip: 'Scale (S)' },
];
</script>

<template>
  <div class="flex items-center gap-1 bg-bg-base p-1 rounded-panel border border-border">
    <el-tooltip 
      v-for="tool in tools" 
      :key="tool.mode"
      :content="tool.tooltip" 
      placement="bottom" 
      :show-after="300"
    >
      <button 
        @click="transformStore.setTransformMode(tool.mode)"
        class="w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer"
        :class="transformStore.activeMode === tool.mode ? 'text-text-main bg-panel shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-panel'"
      >
        <component :is="tool.icon" :size="18" weight="bold" />
      </button>
    </el-tooltip>
  </div>
</template>
