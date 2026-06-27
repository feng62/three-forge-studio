<script setup lang="ts">
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { PhMoon, PhSun, PhFolderOpen, PhPlus } from '@phosphor-icons/vue';
import Toolbar from '../ui/Toolbar.vue';
import ThemeSwitcher from '../ui/ThemeSwitcher.vue';
import ProjectHistoryModal from '../ui/ProjectHistoryModal.vue';
import ExportButton from '../ui/ExportButton.vue';
import { useProjectStore } from '../../stores/projectStore';

// Light/Dark mode
const isDark = useDark({
  valueDark: 'dark',
  valueLight: ''
});
const toggleDark = useToggle(isDark);

// Project Management
const projectStore = useProjectStore();
const showHistory = ref(false);

import { ElMessageBox, ElMessage } from 'element-plus';

import { useEngineStore } from '../../stores/engineStore';

/**
 * 快速创建新项目
 * 初始化时使用默认名称，并在内部重置状态以方便直接投入使用
 */
const handleNewProject = async () => {
  const isTemp = projectStore.currentProject?.isTemporary;
  
  if (isTemp) {
    try {
      await ElMessageBox.confirm('当前场景尚未正式保存，是否在新建前保存它？', '未保存的场景', {
        confirmButtonText: '保存并新建',
        cancelButtonText: '放弃当前并新建',
        type: 'warning'
      });
      
      // 用户选择了“保存并新建”，弹出命名框
      const { value: currentName } = await ElMessageBox.prompt(
        '请输入当前项目的名称',
        '保存当前项目',
        {
          confirmButtonText: '保存',
          cancelButtonText: '取消',
          inputValue: '未命名项目',
          inputValidator: (val) => {
            if (!val || val.trim() === '') return '项目名称不能为空';
            return true;
          }
        }
      );
      
      if (projectStore.currentProject?.id) {
        await projectStore.renameProject(projectStore.currentProject.id, currentName.trim());
        // 确保把当前的场景数据序列化并保存到 IndexedDB 中
        await projectStore.saveProject();
      }
    } catch (e) {
      if (e !== 'cancel') {
        // 用户取消了输入框，中止新建流程
        return;
      }
      // 如果 e === 'cancel'，说明点击了“放弃当前并新建”，继续往下走
    }
  }

  // 开始新建流程
  try {
    const { value: projectName } = await ElMessageBox.prompt(
      '请输入新项目的名称',
      '新建项目',
      {
        confirmButtonText: '创建',
        cancelButtonText: '取消',
        inputValue: '新的场景',
        inputValidator: (val) => {
          if (!val || val.trim() === '') return '项目名称不能为空';
          return true;
        }
      }
    );
    await projectStore.createProject(projectName.trim(), '{}');
    
    // 清空场景
    const engineStore = useEngineStore();
    if (engineStore.engine) {
      engineStore.engine.clearScene();
    }
    
    ElMessage.success('已进入新项目');
  } catch (e) {
    // User cancelled
  }
};
</script>

<template>
  <header class="h-14 border-b border-border bg-panel flex items-center justify-between px-4 select-none shrink-0 z-10 shadow-sm relative transition-colors duration-300">
    <!-- Left: Logo & Project Name -->
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-panel bg-accent flex items-center justify-center text-bg-base font-bold text-lg shadow-md transition-colors duration-300">
        F
      </div>
      <span class="font-semibold text-text-main tracking-wide mr-4">
        {{ projectStore.currentProject?.name || 'Three Forge' }}
      </span>
      
      <!-- Project Actions -->
      <button 
        @click="handleNewProject"
        class="px-2.5 py-1.5 rounded bg-bg-base border border-transparent hover:border-border text-text-muted hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors"
        title="新建项目"
      >
        <PhPlus :size="14" weight="bold" />
        新建
      </button>
      <button 
        @click="showHistory = true"
        class="px-2.5 py-1.5 rounded bg-bg-base border border-transparent hover:border-border text-text-muted hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors"
        title="历史记录"
      >
        <PhFolderOpen :size="14" weight="bold" />
        历史记录
      </button>
    </div>

    <!-- Center: Toolbar -->
    <Toolbar />

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <ExportButton />
      
      <div class="w-px h-6 bg-border mx-2"></div>
      
      <ThemeSwitcher />

      <!-- Light/Dark -->
      <button 
        @click="toggleDark()" 
        class="w-8 h-8 rounded-full hover:bg-bg-base flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer border border-transparent hover:border-border"
        title="切换亮/暗模式"
      >
        <PhMoon v-if="isDark" :size="18" weight="duotone" />
        <PhSun v-else :size="18" weight="duotone" />
      </button>
    </div>

    <!-- History Modal -->
    <ProjectHistoryModal v-model="showHistory" />
  </header>
</template>
