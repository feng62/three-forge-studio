<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore';
import SceneTree from '../ui/SceneTree.vue';
import PropertiesPanel from '../ui/PropertiesPanel.vue';

const settingsStore = useSettingsStore();
</script>

<template>
  <aside 
    class="h-full border-l border-border bg-panel flex flex-col shrink-0 transition-all duration-300 relative z-10 overflow-hidden"
    :style="{ width: settingsStore.panelWidth + 'px' }"
  >
    <!-- Top Half: Scene Tree -->
    <div class="h-1/2 min-h-0 border-b border-border flex flex-col">
      <SceneTree />
    </div>
    
    <!-- Bottom Half: Properties Panel -->
    <div class="h-1/2 min-h-0 flex flex-col">
      <PropertiesPanel />
    </div>
  </aside>
</template>
