<script setup lang="ts">
import { ref, watch } from 'vue';
import { VisualLogicEditorPlugin } from '../editor';
import { VisualLogicCorePlugin } from '../core';
import type { VisualLogicPluginState, VisualLogicGraph } from '../types';
import { visualLogicState as pluginState } from '../state';
import { Plus } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import LogicListItem from './LogicListItem.vue';

const props = defineProps<{
  engine: any,
  sceneGraphVersion: number
}>();

const emit = defineEmits<{
  (e: 'save'): void
}>();

// pluginState is now imported from state.ts

watch(() => props.engine, (newEngine) => {
  if (newEngine) {
    VisualLogicEditorPlugin.onInstall({ engine: newEngine });
    if (!VisualLogicCorePlugin.engine) {
      VisualLogicCorePlugin.onInstall(newEngine);
    }
    loadData();
  }
}, { immediate: true });

watch(() => props.sceneGraphVersion, () => {
  loadData();
});

function loadData() {
  const data = VisualLogicEditorPlugin.loadData();
  pluginState.value = data;
}

function saveData() {
  VisualLogicEditorPlugin.saveData(pluginState.value);
  VisualLogicCorePlugin.setState(pluginState.value);
  emit('save');
}

async function handleAdd() {
  try {
    const { value } = await ElMessageBox.prompt('请输入交互逻辑名称', '新建逻辑', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S/,
      inputErrorMessage: '名称不能为空'
    });
    
    const newLogic: VisualLogicGraph = {
      id: 'logic_' + Date.now().toString(),
      name: value,
      nodes: [],
      connections: [],
      variables: []
    };
    
    pluginState.value.logics.push(newLogic);
    pluginState.value.activeLogicId = newLogic.id;
    saveData();
    ElMessage.success('创建成功');
  } catch (e) {
    // cancelled
  }
}

async function handleEdit(logic: VisualLogicGraph) {
  try {
    const { value } = await ElMessageBox.prompt('请修改交互逻辑名称', '重命名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: logic.name,
      inputPattern: /\S/,
      inputErrorMessage: '名称不能为空'
    });
    
    logic.name = value;
    saveData();
    ElMessage.success('重命名成功');
  } catch (e) {
    // cancelled
  }
}

function handleDelete(logic: VisualLogicGraph) {
  ElMessageBox.confirm(`确定要删除逻辑 "${logic.name}" 吗？`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = pluginState.value.logics.findIndex(l => l.id === logic.id);
    if (idx !== -1) {
      pluginState.value.logics.splice(idx, 1);
      if (pluginState.value.activeLogicId === logic.id) {
        pluginState.value.activeLogicId = pluginState.value.logics.length > 0 ? pluginState.value.logics[0].id : null;
      }
      saveData();
      ElMessage.success('已删除');
    }
  }).catch(() => {});
}

function selectLogic(id: string) {
  pluginState.value.activeLogicId = id;
  // 只更新内存和引擎状态，不触发繁重的落盘操作 emit('save')
  VisualLogicEditorPlugin.saveData(pluginState.value);
  VisualLogicCorePlugin.setState(pluginState.value);
}

function handleSaveLogic(logic: VisualLogicGraph) {
  if (pluginState.value.activeLogicId === logic.id) {
    window.dispatchEvent(new CustomEvent('visual-logic-request-save'));
  } else {
    saveData();
    ElMessage.success('保存成功');
  }
}

</script>

<template>
  <div class="visual-logic-panel flex flex-col h-full w-full bg-panel text-text">
    <div class="p-3 border-b border-border flex justify-between items-center bg-bg-base">
      <span class="font-bold text-sm tracking-wider">执行流与交互逻辑</span>
      <el-button type="primary" size="small" :icon="Plus" circle @click="handleAdd"></el-button>
    </div>
    
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div v-if="pluginState.logics.length === 0" class="text-xs text-text-muted text-center mt-4">
        暂无逻辑图，请点击右上角添加。
      </div>
      
      <div v-else class="space-y-2">
        <div 
          v-for="logic in pluginState.logics" 
          :key="logic.id"
          class="flex items-center justify-between p-2 rounded cursor-pointer border transition-colors"
          :class="pluginState.activeLogicId === logic.id ? 'bg-primary/20 border-primary text-primary' : 'bg-bg-surface border-border hover:border-primary/50 text-text-main'"
          @click="selectLogic(logic.id)"
        >
          <LogicListItem :logic="logic" @edit="handleEdit" @delete="handleDelete" @save-logic="handleSaveLogic" />
        </div>
      </div>
    </div>
    <div class="p-4 text-xs text-text-muted border-t border-border mt-auto">
      选中上方列表中的逻辑，然后在下方弹出的面板中进行节点图编辑。
    </div>
  </div>
</template>
