<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProjectStore } from '../../stores/projectStore';
import { useElementSize } from '@vueuse/core';

const projectStore = useProjectStore();
const containerRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(containerRef);

const treeData = computed(() => {
  const currentProject = projectStore.currentProject;
  if (!currentProject || !currentProject.data || currentProject.data === '{}') {
    return [];
  }
  try {
    const jsonObj = JSON.parse(currentProject.data);
    return [jsonToTree(jsonObj, 'SceneData')];
  } catch (e) {
    return [{ id: 'error', label: 'Invalid JSON data' }];
  }
});

let idCounter = 0;
function jsonToTree(obj: any, key: string): any {
  const id = String(idCounter++);
  if (Array.isArray(obj)) {
    return {
      id,
      label: `${key} [${obj.length}]`,
      type: 'array',
      children: obj.map((item, index) => jsonToTree(item, String(index)))
    };
  } else if (obj !== null && typeof obj === 'object') {
    return {
      id,
      label: key,
      type: 'object',
      children: Object.keys(obj).map(k => jsonToTree(obj[k], k))
    };
  } else {
    // Primitive values
    let valClass = 'text-accent'; // fallback/number
    if (typeof obj === 'string') valClass = 'text-green-500';
    if (typeof obj === 'boolean') valClass = 'text-purple-400';
    if (obj === null) valClass = 'text-gray-400';
    
    // Format value string
    let valueStr = String(obj);
    if (typeof obj === 'string') {
      valueStr = `"${obj}"`;
    }

    return {
      id,
      label: key,
      value: valueStr,
      type: 'primitive',
      valClass
    };
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col bg-bg-base/50 rounded-panel overflow-hidden border border-border" ref="containerRef">
    <el-tree-v2
      v-if="height > 0"
      :data="treeData"
      :height="height"
      :expand-on-click-node="true"
      class="custom-json-tree p-2"
    >
      <template #default="{ data }">
        <div class="flex items-center gap-2 font-mono text-sm w-full py-0.5 hover:bg-white/5 transition-colors rounded px-1">
          <span class="text-text-main">{{ data.label }}</span>
          <span v-if="data.type === 'primitive'" class="text-text-muted opacity-50">:</span>
          <span v-if="data.type === 'primitive'" :class="data.valClass">{{ data.value }}</span>
        </div>
      </template>
    </el-tree-v2>
  </div>
</template>

<style scoped>
:deep(.el-tree-v2) {
  background: transparent;
  color: var(--color-text-main);
}
:deep(.el-tree-node__content) {
  height: 28px;
  border-radius: 4px;
}
:deep(.el-tree-node__content:hover) {
  background-color: transparent;
}
:deep(.el-icon.el-tree-node__expand-icon) {
  color: var(--color-text-muted);
}
</style>
