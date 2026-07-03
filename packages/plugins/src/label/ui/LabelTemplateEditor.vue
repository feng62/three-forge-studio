<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import type { LabelObject, RenderType } from '../types';
import { Aim, Monitor, Plus, Close } from '@element-plus/icons-vue';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { createApp } from 'vue';
import * as Vue from 'vue';
import { loadModule } from 'vue3-sfc-loader';
import { ElMessageBox, ElMessage } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  label: LabelObject | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update', updates: Partial<LabelObject>): void;
  (e: 'save'): void;
}>();

const localLabel = ref<LabelObject | null>(null);

const currentFile = ref('/App.vue');

const handleRenderTypeChange = (val: RenderType) => {
  if (!localLabel.value) return;
  const updates: Partial<LabelObject> = { renderType: val };
  
  const defaultHtml = '<div style="background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; border: 1px solid #4ade80;">Hello World</div>';
  const defaultVue = `<template>
  <div class="forge-label-wrapper">
    <div class="header">
      <span class="status-dot"></span>
      {{ model ? model.name : '未绑定模型' }}
    </div>
    <div class="uuid">
      UUID: {{ model ? model.uuid.substring(0,8) : 'N/A' }}
    </div>
     <!-- 展示传入的 model 数据 -->
    <div class="model-info" v-if="model">
      <p><strong>绑定模型：</strong>{{ model.name || '未命名' }}</p>
      <p><strong>UUID：</strong>{{ model.uuid.substring(0, 8) }}...</p>
    </div>
    <div class="model-info" v-else>
      <p>未绑定任何模型</p>
    </div>
    <button class="action-btn" @click="increment">
      点击次数：{{ count }}
    </button>
    <!-- 你可以在这里引入其他组件: -->
    <!-- <Child /> -->
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'SetupComponent',
  // 在这里声明 props 来接收外部传入的 model
  props: {
    model: {
      type: Object,
      default: null
    }
  },
  setup(props, context) {
    const count = ref(0)
    const increment = () => {
      count.value++
    }
    onMounted(() => {
      console.log('组件已挂载')
      if (props.model) {
        console.log('获取到了绑定的 3D 模型:', props.model)
      } else {
        console.log('当前没有任何模型绑定。')
      }
    })
    return {
      count,
      increment
    }
  }
}
<\/script>

<style>
.forge-label-wrapper {
  background: rgba(15,23,42,0.85);
  color: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #3b82f6;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
  pointer-events: auto;
}
.forge-label-wrapper .header {
  font-weight: bold;
  margin-bottom: 4px;
  color: #60a5fa;
  display: flex;
  align-items: center;
  gap: 4px;
}
.forge-label-wrapper .status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}
.forge-label-wrapper .uuid {
  color: #94a3b8;
  font-size: 10px;
  font-family: monospace;
}
.model-info {
  margin: 10px 0;
  font-size: 0.9rem;
  color: #94a3b8;
  background: rgba(0,0,0,0.2);
  padding: 6px;
  border-radius: 4px;
}
.action-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  font-size: 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
}
.action-btn:hover {
  background-color: #2563eb;
}
.action-btn:active {
  transform: scale(0.98);
}
</style>`;

  if (val === 'vue') {
    if (localLabel.value.code === defaultHtml || localLabel.value.code.trim() === '') {
      updates.code = defaultVue;
      updates.files = { '/App.vue': defaultVue };
    } else {
      if (!localLabel.value.files) {
        updates.files = { '/App.vue': localLabel.value.code };
      }
    }
    currentFile.value = '/App.vue';
  } else if (val === 'html') {
    if (localLabel.value.code.includes("{{ model ? model.name : '未绑定模型' }}") || localLabel.value.code.trim() === '') {
      updates.code = defaultHtml;
    }
  }
  
  updateCurrentLabel(updates);
};

const updateCurrentLabel = (updates: Partial<LabelObject>) => {
  if (localLabel.value) {
    Object.assign(localLabel.value, updates);
  }
};

const handleAddFile = () => {
  ElMessageBox.prompt('请输入组件文件名 (如: Child.vue)', '新建文件', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[a-zA-Z0-9_\-\.]+\.vue$/,
    inputErrorMessage: '文件名必须以 .vue 结尾且不能包含特殊字符'
  }).then(({ value }) => {
    const filename = value.startsWith('/') ? value : '/' + value;
    if (localLabel.value) {
      if (!localLabel.value.files) {
        localLabel.value.files = { '/App.vue': localLabel.value.code || '' };
      }
      if (localLabel.value.files[filename]) {
        ElMessage.warning('文件已存在');
        return;
      }
      localLabel.value.files[filename] = `<template>\n  <div class="child-comp">New Component</div>\n</template>\n\n<script setup>\n<\/script>\n\n<style scoped>\n.child-comp {\n  color: #fbbf24;\n}\n</style>`;
      currentFile.value = filename;
      updateCurrentLabel({ files: localLabel.value.files });
    }
  }).catch(() => {});
};

const handleRemoveFile = (filename: string) => {
  if (filename === '/App.vue') {
    ElMessage.warning('App.vue 不能被删除');
    return;
  }
  if (localLabel.value && localLabel.value.files) {
    delete localLabel.value.files[filename];
    if (currentFile.value === filename) {
      currentFile.value = '/App.vue';
    }
    updateCurrentLabel({ files: localLabel.value.files });
  }
};

const handleCodeChange = (val: string) => {
  if (localLabel.value?.renderType === 'vue') {
    if (!localLabel.value.files) {
      localLabel.value.files = { '/App.vue': localLabel.value.code || '' };
    }
    localLabel.value.files[currentFile.value] = val;
    if (currentFile.value === '/App.vue') {
      localLabel.value.code = val; // 同步给单文件系统
    }
    updateCurrentLabel({ files: localLabel.value.files, code: localLabel.value.code });
  } else {
    updateCurrentLabel({ code: val });
  }
};

const getCurrentEditorValue = () => {
  if (localLabel.value?.renderType === 'vue') {
    return localLabel.value?.files?.[currentFile.value] || localLabel.value?.code || '';
  }
  return localLabel.value?.code || '';
};

const previewContainer = ref<HTMLElement | null>(null);
const labelWrapperRef = ref<HTMLElement | null>(null);
let previewApp: any = null;
const isDraggingAnchor = ref(false);

let startMouseX = 0;
let startMouseY = 0;
let startAnchorX = 0;
let startAnchorY = 0;

const updateAnchorFromEvent = (e: MouseEvent) => {
  if (!labelWrapperRef.value || !localLabel.value) return;
  const rect = labelWrapperRef.value.getBoundingClientRect();
  const width = rect.width || 100;
  const height = rect.height || 50;
  
  const x = Math.max(0, Math.min(e.clientX - rect.left, width));
  const y = Math.max(0, Math.min(e.clientY - rect.top, height));
  
  const newAnchorX = (x / width) * 200 - 100;
  const newAnchorY = 100 - (y / height) * 200;
  
  updateCurrentLabel({
    anchor: [
      Math.max(-100, Math.min(100, Math.round(newAnchorX))), 
      Math.max(-100, Math.min(100, Math.round(newAnchorY)))
    ]
  });
};

const handleWrapperMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  if (!localLabel.value) return;
  isDraggingAnchor.value = true;
  
  updateAnchorFromEvent(e);
  
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  startAnchorX = localLabel.value.anchor[0];
  startAnchorY = localLabel.value.anchor[1];
  
  window.addEventListener('mousemove', handleWrapperMouseMove);
  window.addEventListener('mouseup', handleWrapperMouseUp);
};

const handleWrapperMouseMove = (e: MouseEvent) => {
  if (!isDraggingAnchor.value || !localLabel.value || !labelWrapperRef.value) return;
  
  const deltaX = e.clientX - startMouseX;
  const deltaY = e.clientY - startMouseY;
  
  const rect = labelWrapperRef.value.getBoundingClientRect();
  const width = rect.width || 100;
  const height = rect.height || 50;
  
  const newAnchorX = startAnchorX + (deltaX / width) * 200;
  const newAnchorY = startAnchorY - (deltaY / height) * 200;
  
  updateCurrentLabel({
    anchor: [
      Math.max(-100, Math.min(100, Math.round(newAnchorX))), 
      Math.max(-100, Math.min(100, Math.round(newAnchorY)))
    ]
  });
};

const handleWrapperMouseUp = () => {
  isDraggingAnchor.value = false;
  window.removeEventListener('mousemove', handleWrapperMouseMove);
  window.removeEventListener('mouseup', handleWrapperMouseUp);
};

const centerAnchor = () => {
  if (localLabel.value) {
    updateCurrentLabel({ anchor: [0, 0] });
  }
};

const renderPreview = async () => {
  if (!previewContainer.value || !localLabel.value) return;
  const labelDef = localLabel.value;
  
  if (previewApp) {
    previewApp.unmount();
    previewApp = null;
  }
  
  previewContainer.value.innerHTML = '';
  
  if (labelDef.renderType === 'vue') {
    const vueRoot = document.createElement('div');
    previewContainer.value.appendChild(vueRoot);
    try {
      const options = {
        moduleCache: { vue: Vue },
        async getFile(url: string) {
          const files = labelDef.files || { '/App.vue': labelDef.code || '' };
          const filename = url.startsWith('/') ? url : '/' + url.replace(/^\.\//, '');
          if (files[filename] !== undefined) {
            return files[filename];
          }
          if (filename === '/App.vue') {
            return labelDef.code || '';
          }
          throw new Error(`File not found: ${url}`);
        },
        addStyle(textContent: string) {
          const style = document.createElement('style');
          style.textContent = textContent;
          previewContainer.value?.appendChild(style);
        }
      };
      
      const component = await loadModule('/App.vue', options);
      const context = { model: null, ...(labelDef._data || {}) };
      
      previewApp = Vue.createApp(component, { model: context.model });

      if (labelDef.files) {
        for (const filename of Object.keys(labelDef.files)) {
          if (filename !== '/App.vue' && filename.endsWith('.vue')) {
            try {
              const childComp = await loadModule(filename, options);
              const compName = filename.replace(/^\//, '').replace(/\.vue$/, '');
              previewApp.component(compName, childComp);
            } catch (e) {
              console.warn(`Failed to auto-register component ${filename}`, e);
            }
          }
        }
      }

      previewApp.mount(vueRoot);
    } catch (e: any) {
      console.error("Vue SFC preview error", e);
      vueRoot.innerHTML = `<div style="color:red;font-size:12px;background:#000;padding:4px;border:1px solid red;max-width:300px;word-wrap:break-word;">Vue Error: ${e.message || e}</div>`;
    }
  } else {
    previewContainer.value.innerHTML = labelDef.code;
  }
};

watch(() => localLabel.value?.code, () => {
  if (props.modelValue && localLabel.value?.renderType !== 'vue') {
    nextTick(renderPreview);
  }
});

watch(() => localLabel.value?.files, () => {
  if (props.modelValue && localLabel.value?.renderType === 'vue') {
    nextTick(renderPreview);
  }
}, { deep: true });

watch(() => localLabel.value?.renderType, () => {
  if (props.modelValue) {
    nextTick(renderPreview);
  }
});

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.label) {
      localLabel.value = JSON.parse(JSON.stringify(props.label));
    }
    // 不再在这里使用 nextTick(renderPreview)，因为 dialog 可能还未挂载 DOM
  } else {
    if (previewApp) {
      previewApp.unmount();
      previewApp = null;
    }
  }
});

watch(() => props.label?.id, () => {
  if (props.modelValue && props.label) {
    localLabel.value = JSON.parse(JSON.stringify(props.label));
    nextTick(renderPreview);
  }
});

onBeforeUnmount(() => {
  if (previewApp) {
    previewApp.unmount();
  }
});

const closeDialog = () => {
  emit('update:modelValue', false);
};

const handleManualSave = () => {
  if (localLabel.value) {
    emit('update', localLabel.value);
    emit('save');
  }
  closeDialog();
};

</script>

<template>
  <el-dialog 
    :model-value="modelValue" 
    @update:model-value="(val) => emit('update:modelValue', val)"
    @opened="renderPreview"
    :title="`编辑标签模板: ${localLabel?.name || label?.name}`" 
    width="90%"
    append-to-body
    destroy-on-close
    class="label-editor-dialog"
  >
    <div class="flex flex-col flex-1 h-full w-full" v-if="localLabel">
      <div class="flex-1 flex custom-split-pane overflow-hidden rounded-b-md">
        <!-- 左侧：预览与定位点 -->
        <div class="w-[450px] border-r border-border p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-panel">
          
          <div class="flex flex-col gap-2 p-3 bg-bg-base border border-border rounded-md shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-text-muted">锚点偏移 (相对于标签中心)</span>
              <el-button size="small" type="primary" link @click="centerAnchor">
                <el-icon class="mr-1"><Aim /></el-icon> 居中锚点
              </el-button>
            </div>
            <div class="text-sm font-mono text-accent font-bold">
              当前锚点：[{{ localLabel.anchor[0] }}%, {{ localLabel.anchor[1] }}%]
            </div>
            <div class="text-[10px] text-text-muted leading-tight">
              拖拽预览区域上的圆圈来改变锚点。<br/>(基于渲染出的标签大小等比例计算)
            </div>
          </div>

          <div class="flex flex-col gap-2 flex-1">
            <div class="flex items-center gap-1 text-xs font-semibold text-text-muted">
              <el-icon><Monitor /></el-icon> 实时预览
            </div>
            
            <div class="relative w-full h-[400px] shrink-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMmEyYTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzAzMDM4Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMDMwMzgiLz48L3N2Zz4=')] border border-border rounded overflow-hidden flex items-center justify-center">
              
              <div class="relative inline-block shadow-2xl ring-1 ring-border/50 cursor-crosshair" 
                   ref="labelWrapperRef"
                   @mousedown="handleWrapperMouseDown">
                
                <div ref="previewContainer" class="pointer-events-none select-none opacity-90"></div>
                <div class="absolute inset-0 z-10"></div>

                <div class="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-500 bg-red-500/20 shadow-md transition-all duration-75"
                     :style="{
                        left: `${(localLabel.anchor[0] + 100) / 2}%`,
                        top: `${(100 - localLabel.anchor[1]) / 2}%`
                     }">
                  <div class="w-1.5 h-1.5 bg-red-500 rounded-full pointer-events-none"></div>
                </div>

              </div>
              
            </div>
          </div>
          
        </div>

        <!-- 右侧：代码编辑区 -->
        <div class="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]" style="height: 700px;">
          <div class="px-4 py-2 border-b border-[#333] flex justify-between items-center text-xs text-gray-300 shrink-0">
            <span class="font-semibold tracking-wider">Template Code</span>
            <el-radio-group 
              size="small" 
              :model-value="localLabel.renderType" 
              @update:model-value="(val) => handleRenderTypeChange(val as RenderType)"
            >
              <el-radio-button value="html">Pure HTML</el-radio-button>
              <el-radio-button value="vue">Vue SFC</el-radio-button>
            </el-radio-group>
          </div>
          
          <!-- 文件标签页区域 (仅 Vue 模式下显示) -->
          <div v-if="localLabel.renderType === 'vue'" class="flex items-center overflow-x-auto bg-[#252526] border-b border-[#333] shrink-0 custom-scrollbar">
            <div class="flex items-center h-8">
              <div 
                v-for="(_, filename) in (localLabel.files || { '/App.vue': localLabel.code })" 
                :key="filename"
                class="px-3 h-full flex items-center gap-2 cursor-pointer border-r border-[#333] select-none text-xs transition-colors group"
                :class="currentFile === filename ? 'bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500' : 'text-gray-400 hover:bg-[#2a2d2e] border-t-2 border-t-transparent'"
                @click="currentFile = filename"
              >
                <span>{{ filename.replace(/^\//, '') }}</span>
                <el-icon 
                  v-if="filename !== '/App.vue'"
                  class="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded-sm hover:bg-gray-600"
                  @click.stop="handleRemoveFile(filename as string)"
                ><Close /></el-icon>
              </div>
              
              <div class="px-2 h-full flex items-center justify-center cursor-pointer text-gray-400 hover:text-white hover:bg-[#2a2d2e]" @click="handleAddFile" title="新建组件文件">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </div>

          <div class="px-4 py-1 bg-[#252526] border-b border-[#333] text-[10px] text-gray-400 font-mono shrink-0">
            <span v-if="localLabel.renderType === 'vue'">
              当前编辑: <span class="text-blue-300">{{ currentFile }}</span> | 可直接使用 props: <code v-pre>{{ model ? model.name : '' }}</code>
            </span>
            <span v-else>纯 HTML 渲染模式，不支持数据绑定指令。</span>
          </div>
          
          <div class="flex-1 overflow-hidden relative min-h-0">
            <VueMonacoEditor
              v-if="localLabel"
              theme="vs-dark"
              :language="'html'"
              :value="getCurrentEditorValue()"
              @change="(val) => handleCodeChange(val)"
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
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleManualSave">
          确认保存
        </el-button>
      </span>
    </template>
  </el-dialog>
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
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.label-editor-dialog) {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  height: 95vh;
  display: flex;
  flex-direction: column;
}
:deep(.label-editor-dialog .el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
}
</style>
