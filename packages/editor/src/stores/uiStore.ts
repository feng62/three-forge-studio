import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  // 当前激活的左侧边栏主 Tab（'base' 或 'plugin_' 开头的字符串）
  const activeLeftTab = ref('base');
  
  // 基础 Tab 内部激活的子 Tab（'models', 'lights', 'materials' 等）
  const activeInnerTab = ref('models');

  return {
    activeLeftTab,
    activeInnerTab
  };
});
