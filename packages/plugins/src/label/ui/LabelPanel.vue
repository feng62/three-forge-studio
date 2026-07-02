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
import { createApp } from 'vue/dist/vue.esm-bundler.js';

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

const loadData = () => {
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

const handleRenderTypeChange = (val: RenderType) => {
  if (!currentLabel.value) return;
  const updates: Partial<LabelObject> = { renderType: val };
  
  const defaultHtml = '<div style="background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; border: 1px solid #4ade80;">Hello World</div>';
  const defaultVue = `<div style="background: rgba(15,23,42,0.85); color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 12px; border: 1px solid #3b82f6; backdrop-filter: blur(4px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); pointer-events: auto;">
  <div style="font-weight: bold; margin-bottom: 4px; color: #60a5fa; display: flex; align-items: center; gap: 4px;">
    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
    {{ model ? model.name : '未绑定模型' }}
  </div>
  <div style="color: #94a3b8; font-size: 10px; font-family: monospace;">
    UUID: {{ model ? model.uuid.substring(0,8) : 'N/A' }}
  </div>
</div>`;

  if (val === 'vue') {
    if (currentLabel.value.code === defaultHtml || currentLabel.value.code.trim() === '') {
      updates.code = defaultVue;
    }
  } else if (val === 'html') {
    if (currentLabel.value.code.includes("{{ model ? model.name : '未绑定模型' }}") || currentLabel.value.code.trim() === '') {
      updates.code = defaultHtml;
    }
  }
  
  updateCurrentLabel(updates);
};

const updateCurrentLabel = (updates: Partial<LabelObject>) => {
  if (selectedLabelId.value) {
    updateLabel(selectedLabelId.value, updates);
  }
};

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

// Combined Live Preview & Anchor Dragging
const previewContainer = ref<HTMLElement | null>(null);
const labelWrapperRef = ref<HTMLElement | null>(null);
let previewApp: any = null;
const isDraggingAnchor = ref(false);

let startMouseX = 0;
let startMouseY = 0;
let startAnchorX = 0;
let startAnchorY = 0;

const updateAnchorFromEvent = (e: MouseEvent, commit: boolean = false) => {
  if (!labelWrapperRef.value || !currentLabel.value) return;
  const rect = labelWrapperRef.value.getBoundingClientRect();
  const width = rect.width || 100;
  const height = rect.height || 50;
  
  const x = Math.max(0, Math.min(e.clientX - rect.left, width));
  const y = Math.max(0, Math.min(e.clientY - rect.top, height));
  
  const newAnchorX = (x / width) * 200 - 100;
  const newAnchorY = 100 - (y / height) * 200;
  
  currentLabel.value.anchor = [
    Math.max(-100, Math.min(100, Math.round(newAnchorX))), 
    Math.max(-100, Math.min(100, Math.round(newAnchorY)))
  ];
  
  if (commit) {
    saveData();
  }
};

const handleWrapperMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  if (!currentLabel.value) return;
  isDraggingAnchor.value = true;
  
  // Only update local state to avoid lag on initial click
  updateAnchorFromEvent(e, false);
  
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  startAnchorX = currentLabel.value.anchor[0];
  startAnchorY = currentLabel.value.anchor[1];
  
  window.addEventListener('mousemove', handleWrapperMouseMove);
  window.addEventListener('mouseup', handleWrapperMouseUp);
};

const handleWrapperMouseMove = (e: MouseEvent) => {
  if (!isDraggingAnchor.value || !currentLabel.value || !labelWrapperRef.value) return;
  
  const deltaX = e.clientX - startMouseX;
  const deltaY = e.clientY - startMouseY;
  
  const rect = labelWrapperRef.value.getBoundingClientRect();
  const width = rect.width || 100;
  const height = rect.height || 50;
  
  const newAnchorX = startAnchorX + (deltaX / width) * 200;
  const newAnchorY = startAnchorY - (deltaY / height) * 200;
  
  // Update visually without triggering saveData() which rebuilds 3D labels
  currentLabel.value.anchor = [
    Math.max(-100, Math.min(100, Math.round(newAnchorX))), 
    Math.max(-100, Math.min(100, Math.round(newAnchorY)))
  ];
};

const handleWrapperMouseUp = () => {
  isDraggingAnchor.value = false;
  window.removeEventListener('mousemove', handleWrapperMouseMove);
  window.removeEventListener('mouseup', handleWrapperMouseUp);
  
  // Commit to the 3D scene when dragging finishes
  saveData();
};

const centerAnchor = () => {
  if (currentLabel.value) {
    currentLabel.value.anchor = [0, 0];
    saveData();
  }
};

const renderPreview = () => {
  if (!previewContainer.value || !currentLabel.value) return;
  const labelDef = currentLabel.value;
  
  if (previewApp) {
    previewApp.unmount();
    previewApp = null;
  }
  
  previewContainer.value.innerHTML = '';
  
  if (labelDef.renderType === 'vue') {
    try {
      previewApp = createApp({
        template: labelDef.code,
        setup() {
          const context = { model: null, ...(labelDef._data || {}) };
          return context;
        }
      });
      const div = document.createElement('div');
      previewContainer.value.appendChild(div);
      previewApp.mount(div);
    } catch (e) {
      previewContainer.value.innerHTML = `<div style="color:red; font-size:12px;">Vue Compilation Error</div>`;
    }
  } else {
    previewContainer.value.innerHTML = labelDef.code;
  }
};

watch(() => currentLabel.value?.code, () => {
  if (isEditorOpen.value) {
    nextTick(renderPreview);
  }
});
watch(() => currentLabel.value?.renderType, () => {
  if (isEditorOpen.value) {
    nextTick(renderPreview);
  }
});
watch(isEditorOpen, (val) => {
  if (val) {
    nextTick(renderPreview);
  } else {
    if (previewApp) {
      previewApp.unmount();
      previewApp = null;
    }
  }
});

onBeforeUnmount(() => {
  if (previewApp) {
    previewApp.unmount();
  }
});

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
        
        <!-- 标签配置内容 (展开) -->
        <div v-if="selectedLabelId === label.id" class="p-3 flex flex-col gap-4">
          
          <!-- 显示设置 -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-text-muted w-20">默认显示</span>
            <el-switch
              size="small"
              :model-value="label.visible"
              @change="(val: boolean) => setLabelVisibility(label.id, val)"
            />
          </div>

          <!-- 目标绑定 -->
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-text-muted">绑定类型 (Target)</span>
            <el-radio-group 
              size="small" 
              :model-value="label.targetType" 
              @update:model-value="(val) => updateLabel(label.id, { targetType: val as TargetType })"
            >
              <el-radio-button value="coordinate">空间坐标</el-radio-button>
              <el-radio-button value="model">3D 模型</el-radio-button>
            </el-radio-group>
            
            <div v-if="label.targetType === 'coordinate'" class="flex gap-2 mt-2">
              <el-input-number size="small" :model-value="label.targetPosition[0]" @change="(v) => updateLabel(label.id, { targetPosition: [Number(v)||0, label.targetPosition[1], label.targetPosition[2]] })" :controls="false" placeholder="X" class="!w-full"/>
              <el-input-number size="small" :model-value="label.targetPosition[1]" @change="(v) => updateLabel(label.id, { targetPosition: [label.targetPosition[0], Number(v)||0, label.targetPosition[2]] })" :controls="false" placeholder="Y" class="!w-full"/>
              <el-input-number size="small" :model-value="label.targetPosition[2]" @change="(v) => updateLabel(label.id, { targetPosition: [label.targetPosition[0], label.targetPosition[1], Number(v)||0] })" :controls="false" placeholder="Z" class="!w-full"/>
            </div>
            
            <div v-else class="flex flex-col gap-2 mt-2">
              <div class="flex flex-col gap-2">
                <div class="flex gap-2">
                  <span class="text-[10px] text-text-muted w-10 text-right">UUID</span>
                  <el-input size="small" :model-value="label.targetModelUuid" readonly placeholder="根模型/Wrapper UUID" class="flex-1" />
                </div>
                <div class="flex gap-2">
                  <span class="text-[10px] text-text-muted w-10 text-right">PATH</span>
                  <el-input size="small" :model-value="label.targetModelPath || ''" readonly placeholder="子节点路径 (可选)" class="flex-1" />
                </div>
              </div>
              <div class="flex gap-2 mt-1">
                <el-button type="primary" size="small" plain @click="handlePickModel(label)" class="w-full">
                  <el-icon><Aim /></el-icon> 拾取选中模型
                </el-button>
              </div>
              <span class="text-[10px] text-text-muted leading-tight">在三维视口中选中目标模型，点击上方按钮将标签绑定至模型几何中心。模型移动时标签自动跟随。</span>
            </div>
          </div>
          
          <!-- 局部偏移 -->
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-text-muted">局部偏移 (Offset)</span>
            <div class="flex gap-2">
              <el-input-number size="small" :model-value="label.offset[0]" @change="(v) => updateLabel(label.id, { offset: [Number(v)||0, label.offset[1], label.offset[2]] })" :controls="false" placeholder="X" class="!w-full"/>
              <el-input-number size="small" :model-value="label.offset[1]" @change="(v) => updateLabel(label.id, { offset: [label.offset[0], Number(v)||0, label.offset[2]] })" :controls="false" placeholder="Y" class="!w-full"/>
              <el-input-number size="small" :model-value="label.offset[2]" @change="(v) => updateLabel(label.id, { offset: [label.offset[0], label.offset[1], Number(v)||0] })" :controls="false" placeholder="Z" class="!w-full"/>
            </div>
          </div>

        </div>
      </div>
    </div>

    <el-dialog 
      v-model="isEditorOpen" 
      :title="`编辑标签模板: ${currentLabel?.name}`" 
      width="1100px"
      append-to-body
      destroy-on-close
      class="label-editor-dialog"
    >
      <div class="flex flex-col h-[750px]" v-if="currentLabel">

        <div class="flex-1 flex custom-split-pane overflow-hidden rounded-b-md">
          
          <!-- 左侧：预览与定位点 -->
          <div class="w-[450px] border-r border-border p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-panel">
            
            <!-- 锚点信息区域 (移动到标题上方) -->
            <div class="flex flex-col gap-2 p-3 bg-bg-base border border-border rounded-md shadow-sm">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-text-muted">锚点偏移 (相对于标签中心)</span>
                <el-button size="small" type="primary" link @click="centerAnchor">
                  <el-icon class="mr-1"><Aim /></el-icon> 居中锚点
                </el-button>
              </div>
              <div class="text-sm font-mono text-accent font-bold">
                当前锚点：[{{ currentLabel.anchor[0] }}%, {{ currentLabel.anchor[1] }}%]
              </div>
              <div class="text-[10px] text-text-muted leading-tight">
                拖拽预览区域上的圆圈来改变锚点。<br/>(基于渲染出的标签大小等比例计算)
              </div>
            </div>

            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-center gap-1 text-xs font-semibold text-text-muted">
                <el-icon><Monitor /></el-icon> 实时预览
              </div>
              
              <!-- Combined Preview Box -->
              <div class="relative w-full h-[400px] shrink-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMmEyYTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzAzMDM4Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMDMwMzgiLz48L3N2Zz4=')] border border-border rounded overflow-hidden flex items-center justify-center">
                
                <div class="relative inline-block shadow-2xl ring-1 ring-border/50 cursor-crosshair" 
                     ref="labelWrapperRef"
                     @mousedown="handleWrapperMouseDown">
                  
                  <!-- 标签渲染容器 (不可点击) -->
                  <div ref="previewContainer" class="pointer-events-none select-none opacity-90"></div>

                  <!-- 隐形遮罩，确保整个标签区域都可以响应鼠标点击和拖拽 -->
                  <div class="absolute inset-0 z-10"></div>

                  <!-- 标定原点 (圆圈样式) -->
                  <div class="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-500 bg-red-500/20 shadow-md transition-all duration-75"
                       :style="{
                          left: `${(currentLabel.anchor[0] + 100) / 2}%`,
                          top: `${(100 - currentLabel.anchor[1]) / 2}%`
                       }">
                    <!-- 中心小圆点 -->
                    <div class="w-1.5 h-1.5 bg-red-500 rounded-full pointer-events-none"></div>
                  </div>

                </div>
                
              </div>
            </div>
            
          </div>

          <!-- 右侧：代码编辑区 -->
          <div class="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            <div class="px-4 py-2 border-b border-[#333] flex justify-between items-center text-xs text-gray-300">
              <span class="font-semibold tracking-wider">Template Code</span>
              <el-radio-group 
                size="small" 
                :model-value="currentLabel.renderType" 
                @update:model-value="(val) => handleRenderTypeChange(val as RenderType)"
              >
                <el-radio-button value="html">Pure HTML</el-radio-button>
                <el-radio-button value="vue">Vue Template</el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="px-4 py-1 bg-[#252526] border-b border-[#333] text-[10px] text-gray-400 font-mono">
              <span v-if="currentLabel.renderType === 'vue'">
                可使用双大括号绑定数据。如果在模型上绑定，模型信息可用：<span v-pre>{{ model.name }}</span>、<span v-pre>{{ model.userData }}</span>
              </span>
              <span v-else>纯 HTML 渲染模式，不支持数据绑定指令。</span>
            </div>
            
            <div class="flex-1 overflow-hidden relative">
              <VueMonacoEditor
                theme="vs-dark"
                language="html"
                :value="currentLabel.code"
                @change="(val) => updateCurrentLabel({ code: val })"
                :options="{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  automaticLayout: true
                }"
              />
            </div>
          </div>
          
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isEditorOpen = false">取消</el-button>
          <el-button type="primary" @click="() => { handleManualSave(); isEditorOpen = false; }">
            确认保存
          </el-button>
        </span>
      </template>
    </el-dialog>
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
