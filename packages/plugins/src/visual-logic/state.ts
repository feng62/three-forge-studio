import { ref } from 'vue';
import type { VisualLogicPluginState } from './types';

export const visualLogicState = ref<VisualLogicPluginState>({
  logics: [],
  activeLogicId: null
});
