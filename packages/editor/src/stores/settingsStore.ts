import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db/database';
import { useThemeStore } from './themeStore';
import { useProjectStore } from './projectStore';

export const useSettingsStore = defineStore('settings', () => {
  const autoSaveEnabled = ref(true);
  const autoSaveInterval = ref(30); // in seconds
  const panelWidth = ref(400); // UI panel width in pixels
  const isLoaded = ref(false);

  const themeStore = useThemeStore();
  const projectStore = useProjectStore();

  /**
   * Initialize settings from IndexedDB
   */
  const initSettings = async () => {
    try {
      const records = await db.settings.toArray();
      const settingsMap = new Map(records.map(r => [r.key, r.value]));

      if (settingsMap.has('autoSaveEnabled')) {
        autoSaveEnabled.value = settingsMap.get('autoSaveEnabled');
      }
      if (settingsMap.has('autoSaveInterval')) {
        autoSaveInterval.value = settingsMap.get('autoSaveInterval');
      }
      if (settingsMap.has('currentTheme')) {
        themeStore.setTheme(settingsMap.get('currentTheme'));
      }
      if (settingsMap.has('panelWidth')) {
        panelWidth.value = settingsMap.get('panelWidth');
      }
      
      isLoaded.value = true;
      applyAutoSaveSettings();
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  /**
   * Save a specific setting to IndexedDB
   */
  const saveSetting = async (key: string, value: any) => {
    try {
      await db.settings.put({ key, value });
    } catch (e) {
      console.error(`Failed to save setting ${key}`, e);
    }
  };

  /**
   * Update auto save settings
   */
  const setAutoSave = async (enabled: boolean, intervalSeconds: number) => {
    autoSaveEnabled.value = enabled;
    autoSaveInterval.value = intervalSeconds;
    
    await saveSetting('autoSaveEnabled', enabled);
    await saveSetting('autoSaveInterval', intervalSeconds);
    
    applyAutoSaveSettings();
  };

  const applyAutoSaveSettings = () => {
    projectStore.stopAutoSave();
    if (autoSaveEnabled.value) {
      projectStore.startAutoSave(autoSaveInterval.value * 1000);
    }
  };

  /**
   * Update theme and save it
   */
  const setTheme = async (themeId: string) => {
    themeStore.setTheme(themeId);
    await saveSetting('currentTheme', themeId);
  };

  /**
   * Update panel width and save it
   */
  const setPanelWidth = async (width: number) => {
    panelWidth.value = width;
    await saveSetting('panelWidth', width);
  };

  return {
    isLoaded,
    autoSaveEnabled,
    autoSaveInterval,
    panelWidth,
    initSettings,
    setAutoSave,
    setTheme,
    setPanelWidth
  };
});
/**
 * 然后，添加射线模型选择，给场景树添加 和模型树关联，如果被选中就会显示包围盒，
 * 并且给场景树上添加，隐藏的小眼睛，还有删除按钮，  也加上模型删除的快捷键  ，
 * 当把资源拖入到场景中，需要根据当前鼠标跟模型物体的焦点， 如果射线过去没有模型的话 那就放到当前相机的lookat 的那个点，
 */