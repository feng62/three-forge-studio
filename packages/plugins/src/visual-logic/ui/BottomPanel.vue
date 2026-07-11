<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { FullScreen, CopyDocument } from '@element-plus/icons-vue';
import { visualLogicState } from '../state';
import { createControlFlowEditor } from '../engine/editor';
import { VisualLogicEditorPlugin } from '../editor';
import { VisualLogicCorePlugin } from '../core';

const props = defineProps<{
  engine: any,
  sceneGraphVersion: number,
  isMaximized?: boolean
}>();

const emit = defineEmits<{
  (e: 'save'): void,
  (e: 'toggle-full-screen'): void
}>();

const toggleFullScreen = () => {
  emit('toggle-full-screen');
};

const reteContainer = ref<HTMLElement | null>(null);
let reteApp: any = null;
let isUpdatingFromExternal = false; // Prevent recursive saves

onMounted(async () => {
  window.addEventListener('visual-logic-request-save', handleManualSave);
  window.addEventListener('keydown', handleKeyDown);
  
  if (reteContainer.value) {
    reteApp = await createControlFlowEditor(reteContainer.value, (data) => {
      if (isUpdatingFromExternal) return;
      
      const activeId = visualLogicState.value.activeLogicId;
      if (!activeId) return;
      
      const logic = visualLogicState.value.logics.find(l => l.id === activeId);
      if (logic) {
        logic.nodes = data.nodes;
        logic.connections = data.connections;
        logic.variables = data.variables;
        
        // Save to engine and disk
        VisualLogicEditorPlugin.saveData(visualLogicState.value);
        VisualLogicCorePlugin.setState(visualLogicState.value);
        emit('save'); // Save to project
      }
    });
    
    // Initial load
    if (visualLogicState.value.activeLogicId) {
      loadActiveLogic();
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('visual-logic-request-save', handleManualSave);
  window.removeEventListener('keydown', handleKeyDown);
  if (reteApp) {
    reteApp.destroy();
    reteApp = null;
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    // 如果当前有激活的逻辑流，则拦截并执行保存
    if (visualLogicState.value.activeLogicId) {
      e.preventDefault();
      handleManualSave();
    }
  }
};

const handleManualSave = () => {
  if (!reteApp) return;
  const activeId = visualLogicState.value.activeLogicId;
  if (!activeId) return;
  
  const logic = visualLogicState.value.logics.find(l => l.id === activeId);
  if (logic) {
    const data = reteApp.getGraphData();
    logic.nodes = data.nodes;
    logic.connections = data.connections;
    logic.variables = data.variables;
    
    VisualLogicEditorPlugin.saveData(visualLogicState.value);
    VisualLogicCorePlugin.setState(visualLogicState.value);
    emit('save'); // Save to project
    
    // @ts-ignore
    if (window.ElMessage) window.ElMessage.success('保存成功');
  }
};

watch(() => visualLogicState.value.activeLogicId, () => {
  loadActiveLogic();
});

async function loadActiveLogic() {
  if (!reteApp) return;
  
  const activeId = visualLogicState.value.activeLogicId;
  if (!activeId) {
    await reteApp.clearCanvas();
    return;
  }
  
  const logic = visualLogicState.value.logics.find(l => l.id === activeId);
  if (logic) {
    isUpdatingFromExternal = true;
    try {
      await reteApp.importGraphData({
        nodes: logic.nodes || [],
        connections: logic.connections || [],
        variables: logic.variables || []
      });
      // Delay reset to avoid catching subsequent async events
      setTimeout(() => { isUpdatingFromExternal = false; }, 100);
    } catch (e) {
      console.error(e);
      isUpdatingFromExternal = false;
    }
  }
}
</script>

<template>
  <div class="visual-logic-bottom-panel w-full flex flex-col bg-bg-base border-t border-border" :class="isMaximized ? 'h-full' : 'h-full min-h-[300px]'">
    <div class="flex items-center justify-between p-2 bg-panel border-b border-border flex-shrink-0">
      <div class="font-bold text-sm text-accent tracking-wider flex items-center gap-2">
        <span>执行流 (Visual Logic)</span>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" type="primary" plain @click="toggleFullScreen">
          <el-icon class="mr-1">
            <FullScreen v-if="!isMaximized" />
            <CopyDocument v-else />
          </el-icon>
          {{ isMaximized ? '还原视图' : '全屏编排' }}
        </el-button>
      </div>
    </div>
    
    <!-- 节点编辑器画板区域 -->
    <div 
      class="flex-1 bg-black/20 overflow-hidden relative" 
      style="background-image: radial-gradient(var(--el-border-color) 1px, transparent 0); background-size: 20px 20px;"
      ref="reteContainer"
    >
      <div v-if="!visualLogicState.activeLogicId" class="absolute inset-0 flex items-center justify-center text-text-muted pointer-events-none z-10">
        <div class="text-center bg-bg-base/80 p-4 rounded-lg backdrop-blur">
          <p class="text-lg mb-2">执行流节点编排区</p>
          <p class="text-xs opacity-60">请在左侧面板选中或新建一个逻辑图</p>
        </div>
      </div>
    </div>
  </div>
</template>
