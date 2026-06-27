import { onMounted, onUnmounted } from 'vue';
import { useProjectStore } from '../stores/projectStore';

export function useAutoSave(intervalMs: number = 30000) {
  const projectStore = useProjectStore();
  let intervalId: number | null = null;

  const saveTick = async () => {
    try {
      await projectStore.saveProject();
      console.log(`[AutoSave] Scene auto-saved at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('[AutoSave] Failed to save project:', err);
    }
  };

  onMounted(() => {
    intervalId = window.setInterval(saveTick, intervalMs);
  });

  onUnmounted(() => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  });

  return {
    triggerSaveNow: saveTick
  };
}
