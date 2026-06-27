<script setup lang="ts">
import SceneTree from '../ui/SceneTree.vue';
import PropertiesPanel from '../ui/PropertiesPanel.vue';
</script>

<template>
  <aside class="w-72 h-full border-l border-border bg-panel flex flex-col shrink-0 transition-colors duration-300 relative z-10 overflow-hidden">
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
