<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { shortcutManager } from '../../managers/ShortcutManager';
import EditorHeader from './EditorHeader.vue';
import LeftPanel from './LeftPanel.vue';
import RightPanel from './RightPanel.vue';
import Viewport from '../viewport/Viewport.vue';
import { useProjectStore } from '../../stores/projectStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useEngineStore } from '../../stores/engineStore';
import { useUiStore } from '../../stores/uiStore';
import { uiPlugins } from '../../plugins';
import { ElLoading } from 'element-plus';
import { computed } from 'vue';

const vLoading = ElLoading.directive;

const projectStore = useProjectStore();
const settingsStore = useSettingsStore();
const engineStore = useEngineStore();
const uiStore = useUiStore();

const pluginsWithBottomPanel = computed(() => {
  return uiPlugins.filter(p => {
    // 只有具有 bottomPanel 的插件
    if (!p.ui || !p.ui.bottomPanel) return false;
    
    // 并且该插件当前在左侧边栏被激活
    return uiStore.activeLeftTab === 'plugin_' + p.name;
  });
});

onMounted(async () => {
  await settingsStore.initSettings();
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
      <div class="flex-1 flex flex-col relative overflow-hidden">
        <Viewport class="flex-1" />
        
        <!-- Bottom Panels Area -->
        <transition name="slide-up">
          <div 
            v-if="pluginsWithBottomPanel.length > 0"
            class="flex-shrink-0 flex flex-col bg-panel border-t border-border z-10 max-h-[40vh] overflow-y-auto custom-scrollbar"
          >
            <component 
              v-for="plugin in pluginsWithBottomPanel" 
              :key="plugin.name"
              :is="plugin.ui!.bottomPanel" 
              :engine="engineStore.engine"
              :sceneGraphVersion="engineStore.sceneGraphVersion"
              @save="projectStore.saveProject()"
            />
          </div>
        </transition>
      </div>
      <RightPanel />
    </div>
  </div>
</template>

<style>
/* Base overrides if needed, mostly handled by tailwind */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
