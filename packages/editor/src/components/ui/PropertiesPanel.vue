<script setup lang="ts">
import { ref, watch } from 'vue';
import { useEngineStore } from '../../stores/engineStore';
import * as THREE from 'three';

const engineStore = useEngineStore();

const selectedObject = ref<THREE.Object3D | null>(null);

// Observe selection changes
watch(() => engineStore.selectedObjectUuid, (newUuid) => {
  if (!newUuid || !engineStore.engine?.scene) {
    selectedObject.value = null;
    return;
  }
  
  // Find object by UUID
  const obj = engineStore.engine.scene.getObjectByProperty('uuid', newUuid);
  selectedObject.value = obj || null;
}, { immediate: true });
</script>

<template>
  <div class="properties-panel flex flex-col h-full w-full">
    <div class="h-10 border-b border-border flex items-center px-4 font-medium text-sm text-text-main shrink-0 bg-panel">
      属性面板
    </div>
    <div class="flex-1 overflow-y-auto p-4 bg-panel/50 flex flex-col gap-4">
      <div v-if="selectedObject" class="flex flex-col gap-4">
        <div class="bg-bg-base/80 p-3 rounded-panel border border-border">
          <div class="text-xs text-text-muted mb-1">标识名称 (Name)</div>
          <div class="text-sm font-medium text-text-main break-all">{{ selectedObject.name || '未命名' }}</div>
          
          <div class="text-xs text-text-muted mt-3 mb-1">对象类型 (Type)</div>
          <div class="text-sm text-accent">{{ selectedObject.type }}</div>
          
          <div class="text-xs text-text-muted mt-3 mb-1">UUID</div>
          <div class="text-xs text-text-main font-mono opacity-80 break-all select-all">{{ selectedObject.uuid }}</div>
        </div>

        <div class="text-xs text-text-muted text-center mt-6">
          更多属性编辑功能将在后续迭代中完善。
        </div>
      </div>
      <div v-else class="text-xs text-text-muted text-center mt-10">
        请在场景树中选择一个对象
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles */
</style>
