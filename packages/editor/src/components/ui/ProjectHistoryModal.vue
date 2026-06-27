<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../../stores/projectStore';
import { PhFolderOpen, PhTrash, PhPlus, PhClockCounterClockwise, PhPencilSimple, PhCheckSquare, PhSquare } from '@phosphor-icons/vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const projectStore = useProjectStore();

// Selection Mode State
const isSelectionMode = ref(false);
const selectedIds = ref<Set<number>>(new Set());

const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  selectedIds.value.clear();
};

const toggleSelectProject = (id: number) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
};

onMounted(async () => {
  // 组件挂载时自动加载所有的项目列表
  await projectStore.loadAllProjects();
});

/**
 * 关闭弹窗的事件处理器
 * 触发 update:modelValue 事件以支持 v-model 的双向绑定
 */
const handleClose = () => {
  emit('update:modelValue', false);
};

/**
 * 加载指定的项目
 * 调用 store 方法进行加载，加载成功后关闭历史记录弹窗
 * @param {number} id - 要加载的项目 ID
 */
const handleLoad = async (id: number) => {
  await projectStore.loadProject(id);
  handleClose();
};

/**
 * 删除指定的历史项目
 * 触发 store 删除逻辑（如果删除的是当前项目则会自动清空状态）
 * @param {number} id - 要删除的项目 ID
 */
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '警告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await projectStore.deleteProject(id);
    ElMessage.success('项目删除成功');
  } catch (e) {
    // User cancelled
  }
};

/**
 * 重命名项目
 * @param {number} id - 项目 ID
 * @param {string} currentName - 当前项目名
 */
const handleRename = async (id: number, currentName: string) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的项目名称',
      '重命名项目',
      {
        confirmButtonText: '重命名',
        cancelButtonText: '取消',
        inputValue: currentName,
        inputValidator: (val) => {
          if (!val || val.trim() === '') return '项目名称不能为空';
          return true;
        }
      }
    );
    await projectStore.renameProject(id, newName.trim());
    ElMessage.success('项目重命名成功');
  } catch (e) {
    // User cancelled
  }
};

/**
 * 批量删除选中的项目
 */
const handleBatchDelete = async () => {
  if (selectedIds.value.size === 0) return;
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.size} 个项目吗？`, '警告', {
      confirmButtonText: '全部删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    for (const id of Array.from(selectedIds.value)) {
      await projectStore.deleteProject(id);
    }
    selectedIds.value.clear();
    isSelectionMode.value = false;
    ElMessage.success('选中项目删除成功');
  } catch (e) {
    // User cancelled
  }
};

/**
 * 创建一个新的空项目
 * 初始化项目并设定默认的 'Untitled Project'，随后关闭弹窗
 */
const handleNewProject = async () => {
  try {
    const { value: projectName } = await ElMessageBox.prompt(
      '请输入新项目的名称',
      '新建项目',
      {
        confirmButtonText: '创建',
        cancelButtonText: '取消',
        inputValue: '未命名项目',
        inputValidator: (val) => {
          if (!val || val.trim() === '') return '项目名称不能为空';
          return true;
        }
      }
    );
    await projectStore.createProject(projectName.trim(), '{}');
    ElMessage.success('项目创建成功');
    handleClose();
  } catch (e) {
    // User cancelled
  }
};

/**
 * 格式化时间戳为本地时间字符串
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleClose"
    title="项目历史"
    width="600px"
    class="bg-panel !rounded-xl overflow-hidden"
    :show-close="true"
    append-to-body
  >
    <div class="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
      <div v-if="projectStore.isLoading" class="text-center py-8 text-text-muted">
        加载历史记录...
      </div>
      
      <div v-else-if="projectStore.projectsList.length === 0" class="text-center py-12 flex flex-col items-center gap-3">
        <div class="w-16 h-16 rounded-full bg-bg-base flex items-center justify-center text-text-muted">
          <PhFolderOpen :size="32" weight="duotone" />
        </div>
        <div class="text-text-main font-medium">未找到任何项目</div>
        <div class="text-text-muted text-sm max-w-[250px]">
          创建一个新项目开始搭建您的 3D 场景吧。
        </div>
        <button 
          @click="handleNewProject"
          class="mt-4 px-4 py-2 rounded-panel bg-accent text-bg-base font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <PhPlus :size="16" weight="bold" />
          新建项目
        </button>
      </div>

      <div 
        v-else 
        v-for="project in projectStore.projectsList" 
        :key="project.id"
        class="p-4 rounded-panel bg-bg-base border hover:border-border transition-colors group flex items-center justify-between cursor-pointer"
        :class="{ 
          'border-accent/50 bg-accent/5': projectStore.currentProject?.id === project.id && !isSelectionMode,
          'border-transparent': projectStore.currentProject?.id !== project.id && !isSelectionMode,
          'border-accent': isSelectionMode && project.id && selectedIds.has(project.id)
        }"
        @click="isSelectionMode && project.id ? toggleSelectProject(project.id) : undefined"
      >
        <div class="flex items-center gap-4">
          <!-- Checkbox for Selection Mode -->
          <div v-if="isSelectionMode" class="text-accent cursor-pointer flex-shrink-0 mr-1">
            <PhCheckSquare v-if="project.id && selectedIds.has(project.id)" :size="24" weight="fill" />
            <PhSquare v-else :size="24" class="text-text-muted" />
          </div>

          <div class="w-12 h-12 rounded bg-panel flex items-center justify-center text-accent shadow-sm border border-border">
            <PhClockCounterClockwise :size="24" weight="duotone" />
          </div>
          <div>
            <div class="font-medium text-text-main flex items-center gap-2">
              {{ project.name }}
              <span v-if="projectStore.currentProject?.id === project.id" class="text-[10px] px-2 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase tracking-wider">
                当前项目
              </span>
            </div>
            <div class="text-xs text-text-muted mt-1 flex flex-col gap-0.5">
              <span>更新时间: {{ formatDate(project.updatedAt) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="!isSelectionMode" class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            @click.stop="project.id && handleLoad(project.id)"
            class="px-3 py-1.5 rounded bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
            :disabled="projectStore.currentProject?.id === project.id"
            :class="{ 'opacity-50 cursor-not-allowed hover:opacity-50': projectStore.currentProject?.id === project.id }"
          >
            <PhFolderOpen :size="16" /> 加载
          </button>
          <button 
            @click.stop="project.id && handleRename(project.id, project.name)"
            class="w-8 h-8 rounded bg-bg-base border border-border text-text-muted hover:text-text-main transition-colors flex items-center justify-center"
            title="重命名"
          >
            <PhPencilSimple :size="16" />
          </button>
          <button 
            @click.stop="project.id && handleDelete(project.id)"
            class="w-8 h-8 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
            title="删除"
          >
            <PhTrash :size="16" />
          </button>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-xs text-text-muted flex items-center gap-4">
          <span>本地已保存 {{ projectStore.projectsList.length }} 个项目</span>
          
          <button 
            v-if="projectStore.projectsList.length > 0"
            @click="toggleSelectionMode"
            class="hover:text-text-main transition-colors"
          >
            {{ isSelectionMode ? '取消选择' : '批量选择' }}
          </button>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            v-if="isSelectionMode && selectedIds.size > 0"
            @click="handleBatchDelete"
            class="px-4 py-2 rounded-panel bg-red-500/10 text-red-500 font-medium hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 mr-2"
          >
            <PhTrash :size="16" />
            删除已选项 ({{ selectedIds.size }})
          </button>
          
          <button 
            @click="handleNewProject"
            class="px-4 py-2 rounded-panel bg-panel border border-border text-text-main font-medium hover:bg-bg-base transition-colors flex items-center gap-2"
          >
            <PhPlus :size="16" />
            新建项目
          </button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
}
:deep(.el-dialog__title) {
  color: var(--color-text-main);
  font-weight: 600;
}
:deep(.el-dialog__body) {
  padding: 20px;
}
:deep(.el-dialog__footer) {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}
</style>
