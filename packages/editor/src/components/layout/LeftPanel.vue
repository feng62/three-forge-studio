<script setup lang="ts">
// LeftPanel logic here
</script>

<template>
  <aside class="w-64 h-full border-r border-border bg-panel backdrop-blur-md flex flex-col shrink-0 transition-colors duration-300 relative z-10">
    <div class="h-10 border-b border-border flex items-center px-4 font-medium text-sm text-text-main">
      层级大纲
    </div>
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Placeholder for scene graph tree -->
      <div class="text-xs text-text-muted text-center mt-10">
        场景节点将显示在这里
      </div>
    </div>
  </aside>
</template>
