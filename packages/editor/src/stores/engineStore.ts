import { defineStore } from 'pinia';
import { shallowRef, ref } from 'vue';
import type { Engine } from '../engine/Engine';

export const useEngineStore = defineStore('engine', () => {
  // 使用 shallowRef 避免对复杂的 Three.js / Engine 对象进行深层响应式代理
  const engine = shallowRef<Engine | null>(null);

  // 场景图版本号，每次场景结构发生变化（增删节点）时递增
  const sceneGraphVersion = ref<number>(0);
  
  // 当前选中的对象 UUID
  const selectedObjectUuid = ref<string | null>(null);

  const setEngine = (instance: Engine | null) => {
    engine.value = instance;
  };

  const incrementSceneGraphVersion = () => {
    sceneGraphVersion.value++;
  };

  const setSelectedObject = (uuid: string | null) => {
    selectedObjectUuid.value = uuid;
  };

  return {
    engine,
    setEngine,
    sceneGraphVersion,
    incrementSceneGraphVersion,
    selectedObjectUuid,
    setSelectedObject
  };
});
