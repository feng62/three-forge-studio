import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { uiPlugins } from '../plugins';

export const useUiStore = defineStore('ui', () => {
  // 当前激活的左侧边栏主 Tab（'base' 或 'plugin_' 开头的字符串）
  const activeLeftTab = ref('base');
  
  // 基础 Tab 内部激活的子 Tab（'models', 'lights', 'materials' 等）
  const activeInnerTab = ref('models');

  // 控制底侧面板是否全屏最大化占用工作区
  const isBottomPanelMaximized = ref(false);

  // 根据当前激活的插件配置，自动决定是否全屏底部面板
  watch(activeLeftTab, (newTab) => {
    if (newTab.startsWith('plugin_')) {
      const pluginName = newTab.replace('plugin_', '');
      const activePlugin = uiPlugins.find(p => p.name === pluginName);
      if (activePlugin?.ui?.autoMaximizeBottomPanel) {
        isBottomPanelMaximized.value = true;
        return;
      }
    }
    isBottomPanelMaximized.value = false;
  });

  return {
    activeLeftTab,
    activeInnerTab,
    isBottomPanelMaximized
  };
});
