<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { LabelEditorPlugin } from '../editor';
import { LabelCorePlugin } from '../core';
import type { LabelPluginState, LabelObject, TargetType, RenderType } from '../types';
import { Plus, Delete, Edit, Aim, CaretRight, CaretBottom, Monitor, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { getPathToExternalRoot } from '@forge/utils/src/protocol/ExternalModelUtils';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { createApp } from 'vue';

const props = defineProps<{
  engine: any,
  sceneGraphVersion: number
}>();

const emit = defineEmits<{
  (e: 'save'): void
}>();

const pluginState = ref<LabelPluginState>({ labels: [] });
const selectedLabelId = ref<string>('');
const isEditorOpen = ref<boolean>(false);

watch(() => props.engine, (newEngine) => {
  if (newEngine) {
    LabelEditorPlugin.onInstall({ engine: newEngine });
    if (!LabelCorePlugin.engine) {
      LabelCorePlugin.onInstall(newEngine);
      if (newEngine.container) {
        LabelCorePlugin.onMount(newEngine);
      }
    }
    loadData();
  }
}, { immediate: true });

watch(() => props.sceneGraphVersion, () => {
  loadData();
});

function loadData() {
  const data = LabelEditorPlugin.loadData() as LabelPluginState;
  pluginState.value = data && Array.isArray(data.labels) ? data : { labels: [] };
  LabelCorePlugin.setState(JSON.parse(JSON.stringify(pluginState.value)));
};

const saveData = () => {
  LabelEditorPlugin.saveData(pluginState.value);
  LabelCorePlugin.setState(JSON.parse(JSON.stringify(pluginState.value)));
  emit('save');
};

const handleManualSave = () => {
  saveData();
  ElMessage.success('标签数据已保存到场景中');
};

const currentLabel = computed(() => {
  return pluginState.value.labels.find(l => l.id === selectedLabelId.value) || null;
});

const handleAddLabel = () => {
  let idx = 1;
  let newName = `标签${idx}`;
  const existingNames = pluginState.value.labels.map(l => l.name);
  while (existingNames.includes(newName)) {
    idx++;
    newName = `标签${idx}`;
  }

  const newLabel: LabelObject = {
    id: generateUUID(),
    name: newName,
    targetType: 'coordinate',
    targetPosition: [0, 0, 0],
    targetModelUuid: '',
    offset: [0, 0, 0],
    renderType: 'html',
    code: '<div style="background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; border: 1px solid #4ade80;">Hello World</div>',
    anchor: [0, 0],
    visible: true
  };
  pluginState.value.labels.push(newLabel);
  selectedLabelId.value = newLabel.id;
  saveData();
};

const handleRemoveLabel = (id: string) => {
  const idx = pluginState.value.labels.findIndex(l => l.id === id);
  if (idx !== -1) {
    pluginState.value.labels.splice(idx, 1);
    if (selectedLabelId.value === id) {
      selectedLabelId.value = '';
      isEditorOpen.value = false;
    }
    saveData();
  }
};

const openEditor = (id: string) => {
  selectedLabelId.value = id;
  isEditorOpen.value = true;
};

const toggleLabelSelect = (id: string) => {
  if (selectedLabelId.value === id) {
    selectedLabelId.value = '';
  } else {
    selectedLabelId.value = id;
  }
};

const updateLabel = (id: string, updates: Partial<LabelObject>) => {
  const label = pluginState.value.labels.find(l => l.id === id);
  if (label) {
    Object.assign(label, updates);
    saveData();
  }
};

const setLabelVisibility = (id: string, visible: boolean) => {
  updateLabel(id, { visible });
};

import LabelItemConfig from './LabelItemConfig.vue';
import LabelTemplateEditor from './LabelTemplateEditor.vue';

const handlePickModel = (label: LabelObject) => {
  if (!props.engine) return;
  const selectedUuid = props.engine.selectedObjectUuid;
  if (!selectedUuid) {
    alert("请先在场景中选中一个模型！");
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
    // Find root wrapper
    let current = selectedObj;
    while (current.parent) {
      if (current.parent.userData?.isExternalModel) {
        wrapperUuid = current.parent.uuid;
        break;
      }
      current = current.parent;
    }
    updateLabel(label.id, { targetType: 'model', targetModelUuid: wrapperUuid, targetModelPath: path });
  } else {
    updateLabel(label.id, { targetType: 'model', targetModelUuid: selectedUuid, targetModelPath: '' });
  }
};

</script>

<template>
  <div class="label-panel flex flex-col h-full w-full bg-panel text-text">
    
    <!-- 标签列表 -->
    <div class="p-3 border-b border-border flex justify-between items-center bg-bg-base">
      <span class="font-bold text-sm tracking-wider">三维空间标签 (Labels)</span>
      <div class="flex gap-2">
        <el-button type="success" size="small" @click="handleManualSave">
          <el-icon class="mr-1"><Check /></el-icon> 保存
        </el-button>
        <el-button type="primary" size="small" @click="handleAddLabel" title="添加标签">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </div>
    
    <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
      <div v-if="pluginState.labels.length === 0" class="text-xs text-center text-text-muted py-8">
        暂无标签，点击右上角添加
      </div>
      
      <div v-for="label in pluginState.labels" :key="label.id"
           class="bg-bg-base rounded-md border border-border flex flex-col overflow-hidden transition-all"
           :class="selectedLabelId === label.id ? 'border-primary' : 'hover:border-accent'">
        
        <!-- 标签 Header (点击展开) -->
        <div class="flex items-center justify-between px-3 py-2 bg-panel border-b border-border cursor-pointer select-none"
             @click="toggleLabelSelect(label.id)">
          
          <div class="flex items-center gap-2 overflow-hidden">
            <el-icon class="text-text-muted transition-transform duration-200">
              <CaretBottom v-if="selectedLabelId === label.id" />
              <CaretRight v-else />
            </el-icon>
            
            <el-input 
              v-if="selectedLabelId === label.id"
              size="small" 
              :model-value="label.name" 
              @update:model-value="(val) => updateLabel(label.id, { name: val })" 
              @click.stop
              class="w-32"
            />
            <span v-else class="text-sm font-semibold truncate">{{ label.name }}</span>
          </div>
          
          <div class="flex items-center gap-1">
            <el-button type="primary" link size="small" @click.stop="openEditor(label.id)">
              <el-icon class="mr-1"><Edit /></el-icon> 编辑模板
            </el-button>
            <el-button type="danger" link size="small" class="!p-0 ml-2" @click.stop="handleRemoveLabel(label.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <!-- 标签配置内容 (提取出的组件) -->
        <LabelItemConfig
          v-if="selectedLabelId === label.id"
          :label="label"
          @update="updateLabel"
          @pick-model="handlePickModel"
        />
      </div>
    </div>

    <LabelTemplateEditor
      v-model="isEditorOpen"
      :label="currentLabel"
      @update="(updates) => { if (selectedLabelId) updateLabel(selectedLabelId, updates) }"
      @save="handleManualSave"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-dark, #4c4d4f);
  border-radius: 4px;
}
.custom-split-pane {
  min-height: 0; 
}
:deep(.label-editor-dialog .el-dialog__body) {
  padding: 0;
}
:deep(.label-editor-dialog) {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
}
:deep(.label-editor-dialog .el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
}
</style>
