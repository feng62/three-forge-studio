<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { InteractionEditorPlugin } from '../editor';
import { InteractionCorePlugin } from '../core';
import { EVENT_POOL, type SupportedEvent, type InteractionPluginState, type ModelReference } from '../types';
import { getPathToExternalRoot } from '@forge/utils/src/protocol/ExternalModelUtils';
import { Plus, Delete, Aim, CaretRight, CaretBottom } from '@element-plus/icons-vue';
import * as THREE from 'three';

const eventNameMap: Record<string, string> = {
  'click': '点击',
  'dblclick': '双击',
  'contextmenu': '右键',
  'pointerdown': '按下',
  'pointerup': '抬起',
  'pointermove': '移动',
  'pointerenter': '移入',
  'pointerleave': '移出'
};

const props = defineProps<{
  engine: any,
  sceneGraphVersion: number
}>();

const emit = defineEmits<{
  (e: 'save'): void
}>();

const pluginState = ref<InteractionPluginState>({ events: {} });
const selectedEventToAdd = ref<SupportedEvent | ''>('');

watch(() => props.engine, (newEngine) => {
  if (newEngine) {
    InteractionEditorPlugin.onInstall({ engine: newEngine });
    if (!InteractionCorePlugin.engine) {
      InteractionCorePlugin.onInstall(newEngine);
    }
    loadData();
  }
}, { immediate: true });

watch(() => props.sceneGraphVersion, () => {
  loadData();
});

function loadData() {
  const data = InteractionEditorPlugin.loadData() as InteractionPluginState;
  pluginState.value = data && data.events ? data : { events: {} };
  InteractionCorePlugin.setState(JSON.parse(JSON.stringify(pluginState.value)));
};

const saveData = () => {
  InteractionEditorPlugin.saveData(pluginState.value);
  emit('save');
};

const availableEvents = computed(() => {
  const currentKeys = Object.keys(pluginState.value.events);
  return EVENT_POOL.filter(ev => !currentKeys.includes(ev));
});

const addEvent = () => {
  if (!selectedEventToAdd.value) return;
  if (!pluginState.value.events[selectedEventToAdd.value]) {
    pluginState.value.events[selectedEventToAdd.value] = [];
    saveData();
  }
  selectedEventToAdd.value = '';
};

const removeEvent = (eventName: string) => {
  delete pluginState.value.events[eventName];
  saveData();
};

const removeModelRef = (eventName: string, index: number) => {
  pluginState.value.events[eventName].splice(index, 1);
  saveData();
};

const collapsedEvents = ref<Set<string>>(new Set());
const toggleCollapse = (eventName: string) => {
  const newSet = new Set(collapsedEvents.value);
  if (newSet.has(eventName)) {
    newSet.delete(eventName);
  } else {
    newSet.add(eventName);
  }
  collapsedEvents.value = newSet;
};

/** 绑定当前编辑器选中的对象 */
const bindSelectedObject = (eventName: string) => {
  const selectedUuid = props.engine?.selectedObjectUuid;
  if (!selectedUuid) {
    alert('未获取到选中对象。请确保已选中场景中的对象。');
    return;
  }

  const selectedObj = props.engine.scene.getObjectByProperty('uuid', selectedUuid);
  if (!selectedObj) {
    alert('在场景中无法找到该选中对象。');
    return;
  }
  
  const path = getPathToExternalRoot(selectedObj);
  let wrapperUuid = selectedObj.uuid;

  if (path) {
    // 寻找 root wrapper
    let current = selectedObj;
    while (current.parent) {
      if (current.parent.userData?.isExternalModel) {
        wrapperUuid = current.parent.uuid;
        break;
      }
      current = current.parent;
    }
    
    pluginState.value.events[eventName].push({
      uuid: wrapperUuid,
      path: path,
      name: selectedObj.name || 'Unnamed (External)'
    });
  } else {
    pluginState.value.events[eventName].push({
      uuid: selectedObj.uuid,
      name: selectedObj.name || 'Unnamed'
    });
  }
  
  saveData();
};

/** 手动添加一个空引用供用户填入 */
const addManualRef = (eventName: string) => {
  pluginState.value.events[eventName].push({ uuid: '', path: '', name: 'Manual Input' });
  saveData();
};

</script>

<template>
  <div class="interaction-panel flex flex-col h-full w-full bg-panel">
    <!-- 统一面板的主背景 bg-panel -->
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
      
      <!-- 头部添加区 -->
      <div class="flex items-center justify-between gap-2">
        <el-select v-model="selectedEventToAdd" placeholder="选择事件类型" size="small" class="flex-1">
          <el-option
            v-for="ev in availableEvents"
            :key="ev"
            :label="`${ev} (${eventNameMap[ev] || ev})`"
            :value="ev"
          >
            <span style="float: left">{{ ev }}</span>
            <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">{{ eventNameMap[ev] }}</span>
          </el-option>
        </el-select>
        <el-button size="small" type="primary" :disabled="!selectedEventToAdd" @click="addEvent">
          <el-icon class="mr-1"><Plus /></el-icon> 添加
        </el-button>
      </div>

      <!-- 空状态 -->
      <div v-if="Object.keys(pluginState.events).length === 0" class="flex flex-col items-center justify-center py-10 opacity-60">
        <el-icon :size="28" class="mb-2 text-text-muted"><Aim /></el-icon>
        <span class="text-xs text-center text-text-muted">暂无绑定事件，请选择事件类型并添加</span>
      </div>

      <!-- 事件卡片列表 -->
      <div v-for="(refs, eventName) in pluginState.events" :key="eventName" 
           class="bg-bg-base rounded-md border border-border flex flex-col overflow-hidden transition-all hover:border-accent">
        
        <!-- 卡片头部 -->
        <div class="flex items-center justify-between px-3 py-2 bg-panel border-b border-border cursor-pointer select-none"
             @click="toggleCollapse(String(eventName))">
          <div class="flex items-center gap-1">
            <el-icon class="text-text-muted transition-transform duration-200">
              <CaretRight v-if="collapsedEvents.has(String(eventName))" />
              <CaretBottom v-else />
            </el-icon>
            <span class="font-semibold text-xs tracking-wider uppercase text-accent">{{ eventName }}</span>
          </div>
          <el-button size="small" type="danger" link @click.stop="removeEvent(String(eventName))" class="!p-0">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <!-- 展开内容区域 -->
        <div v-show="!collapsedEvents.has(String(eventName))">
          <!-- 卡片内容 (Refs) -->
          <div class="p-3 flex flex-col gap-3">
            <div v-for="(refItem, index) in refs" :key="index" class="flex flex-col gap-2 p-2 bg-panel rounded border border-border group relative">
              <div class="flex justify-between items-center">
                <el-input v-model="refItem.name" size="small" placeholder="显示名称 (可选)" class="w-2/3" @change="saveData" />
                <el-button size="small" type="danger" link @click="removeModelRef(String(eventName), index)" class="!p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-text-muted w-8 text-right">UUID</span>
                <el-input v-model="refItem.uuid" size="small" placeholder="Wrapper / Object UUID" @change="saveData" />
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-text-muted w-8 text-right">PATH</span>
                <el-input v-model="refItem.path" size="small" placeholder="子节点路径 (如 0/1) 可选" @change="saveData" />
              </div>
            </div>

            <div v-if="refs.length === 0" class="text-xs text-center text-text-muted py-1">
              暂无绑定模型
            </div>
          </div>

          <!-- 卡片操作底栏 -->
          <div class="flex justify-between items-center px-3 py-2 border-t border-border bg-panel">
            <el-button size="small" type="info" link @click="addManualRef(String(eventName))">
              手动添加
            </el-button>
            <el-button size="small" type="primary" plain @click="bindSelectedObject(String(eventName))">
              <el-icon class="mr-1"><Aim /></el-icon> 拾取选中模型
            </el-button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-dark, #4c4d4f);
  border-radius: 4px;
}
</style>
