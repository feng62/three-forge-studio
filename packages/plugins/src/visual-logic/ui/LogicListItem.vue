<script setup lang="ts">
import { ref } from 'vue';
import { Edit, Delete, Plus, ArrowRight, DocumentChecked } from '@element-plus/icons-vue';
import type { VisualLogicGraph } from '../types';
import { globalVars } from '../engine/variables';
import { visualLogicState } from '../state';
import { VisualLogicEditorPlugin } from '../editor';

const props = defineProps<{
  logic: VisualLogicGraph;
}>();

defineEmits<{
  (e: 'edit', logic: VisualLogicGraph): void;
  (e: 'delete', logic: VisualLogicGraph): void;
  (e: 'save-logic', logic: VisualLogicGraph): void;
}>();

const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const triggerSave = () => {
  VisualLogicEditorPlugin.saveData(visualLogicState.value);
};

const syncVariables = () => {
  if (visualLogicState.value.activeLogicId === props.logic.id) {
    globalVars.setVariables(props.logic.variables!);
  }
  triggerSave();
};

const addVariable = () => {
  if (!props.logic.variables) {
    props.logic.variables = [];
  }
  const id = 'var_' + Math.random().toString(36).substr(2, 9);
  props.logic.variables.push({
    id,
    name: `NewVar_${props.logic.variables.length + 1}`,
    type: 'boolean',
    initialValue: false
  });
  
  syncVariables();
};

const removeVariable = (varId: string) => {
  if (!props.logic.variables) return;
  const idx = props.logic.variables.findIndex(v => v.id === varId);
  if (idx > -1) {
    props.logic.variables.splice(idx, 1);
    syncVariables();
  }
};

const updateVariableType = (variable: any, type: string) => {
  variable.type = type;
  if (type === 'boolean') variable.initialValue = false;
  else if (type === 'number') variable.initialValue = 0;
  else if (type === 'string') variable.initialValue = '';
  
  syncVariables();
};

</script>

<template>
  <div class="w-full flex flex-col">
    <!-- Header Item -->
    <div class="flex items-center justify-between">
      <div class="flex items-center flex-1 min-w-0 mr-2 select-none">
        <div class="p-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded mr-1 flex items-center justify-center" @click.stop="toggleExpand">
          <el-icon class="text-text-muted transition-transform duration-200" :class="{ 'rotate-90': isExpanded }">
            <ArrowRight />
          </el-icon>
        </div>
        <div class="flex-1 min-w-0 cursor-pointer">
          <div class="font-bold text-sm truncate">{{ logic.name }}</div>
          <div class="text-[10px] opacity-60 truncate">ID: {{ logic.id }}</div>
        </div>
      </div>
      
      <div class="flex items-center gap-1">
        <el-button type="success" size="small" :icon="DocumentChecked" circle text title="保存节点图" @click.stop="$emit('save-logic', logic)"></el-button>
        <el-button type="info" size="small" :icon="Edit" circle text title="重命名" @click.stop="$emit('edit', logic)"></el-button>
        <el-button type="danger" size="small" :icon="Delete" circle text title="删除" @click.stop="$emit('delete', logic)"></el-button>
      </div>
    </div>
    
    <!-- Variables section -->
    <div v-show="isExpanded" class="pl-6 pr-2 py-2 mt-2 border-t border-border/30" @click.stop>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-text-muted">流程变量</span>
        <el-button size="small" type="primary" link :icon="Plus" @click="addVariable">添加变量</el-button>
      </div>
      
      <div v-if="!logic.variables || logic.variables.length === 0" class="text-[10px] text-text-muted text-center py-2 bg-black/10 rounded">
        暂无变量
      </div>
      
      <div v-else class="space-y-2">
        <div v-for="variable in logic.variables" :key="variable.id" class="flex flex-col gap-1 bg-black/20 p-2 rounded border border-border/50">
          <div class="flex items-center gap-2">
            <el-input v-model="variable.name" size="small" placeholder="变量名" @change="syncVariables" class="flex-1" />
            <el-button type="danger" size="small" :icon="Delete" circle text @click="removeVariable(variable.id)"></el-button>
          </div>
          <div class="flex items-center gap-2">
            <el-select v-model="variable.type" size="small" style="width: 90px" @change="(t) => updateVariableType(variable, t)">
              <el-option label="布尔值" value="boolean" />
              <el-option label="数字" value="number" />
              <el-option label="字符串" value="string" />
            </el-select>
            
            <div class="flex-1 flex items-center">
              <el-switch v-if="variable.type === 'boolean'" v-model="variable.initialValue" size="small" @change="syncVariables" />
              <el-input-number v-else-if="variable.type === 'number'" v-model="variable.initialValue" size="small" class="w-full" controls-position="right" @change="syncVariables" />
              <el-input v-else-if="variable.type === 'string'" v-model="variable.initialValue" size="small" placeholder="默认值" @change="syncVariables" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
