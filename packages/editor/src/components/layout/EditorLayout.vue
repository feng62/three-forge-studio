<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { shortcutManager } from '../../managers/ShortcutManager';
import EditorHeader from './EditorHeader.vue';
import LeftPanel from './LeftPanel.vue';
import RightPanel from './RightPanel.vue';
import Viewport from '../viewport/Viewport.vue';
import { useProjectStore } from '../../stores/projectStore';
import { useAutoSave } from '../../composables/useAutoSave';
import { ElLoading } from 'element-plus';

const vLoading = ElLoading.directive;

// Activate auto-save
useAutoSave(30000);

const projectStore = useProjectStore();

onMounted(async () => {
  shortcutManager.init();

  // 自动加载最近的项目或临时保存
  const latestProject = await projectStore.loadLatestProject();
  if (latestProject && latestProject.data) {
    console.log('[EditorLayout] Auto-loaded latest project:', latestProject.name);
  }
});

onUnmounted(() => {
  shortcutManager.destroy();
});
</script>

<template>
  <div 
    class="w-screen h-screen flex flex-col bg-bg-base text-text-main overflow-hidden font-sans relative transition-colors duration-300"
    v-loading="projectStore.isLoading"
    element-loading-text="正在加载场景数据..."
    element-loading-background="rgba(15, 23, 42, 0.8)"
  >
    
    <!-- Dynamic Mesh Background for Glass Theme -->
    <div class="absolute inset-0 pointer-events-none opacity-0 [.theme-glass_&]:opacity-30 transition-opacity duration-700 bg-[radial-gradient(circle_at_top_right,var(--color-accent),transparent_40%),radial-gradient(circle_at_bottom_left,var(--color-primary),transparent_40%)]"></div>
    
    <EditorHeader />
    
    <div class="flex-1 flex overflow-hidden relative z-10">
      <LeftPanel />
      <Viewport />
      <RightPanel />
    </div>
  </div>
</template>

<style>
/* Base overrides if needed, mostly handled by tailwind */
</style>
