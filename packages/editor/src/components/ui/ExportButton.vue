<script setup lang="ts">
import { PhDownloadSimple } from '@phosphor-icons/vue';
import { useProjectStore } from '../../stores/projectStore';
import { db } from '../../db/db';
import { ElMessage } from 'element-plus';

const projectStore = useProjectStore();

const handleExport = async () => {
  // 先触发保存，确保数据库中是最新的场景
  await projectStore.saveProject();

  const currentProject = projectStore.currentProject;
  
  if (!currentProject || !currentProject.id) {
    ElMessage.warning('当前没有有效的场景可供导出');
    return;
  }
  
  try {
    // 从数据库中查询当前的场景数据
    const dbProject = await db.projects.get(currentProject.id);
    
    if (!dbProject || !dbProject.data || dbProject.data === '{}') {
      ElMessage.warning('数据库中没有有效的场景数据可供导出');
      return;
    }
    
    // 确保格式化 JSON 以提高可读性
    const jsonObj = JSON.parse(dbProject.data);
    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 使用项目名称作为文件名，如果是临时名称则使用默认名
    const fileName = dbProject.isTemporary ? 'scene_export' : dbProject.name;
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    ElMessage.success('场景导出成功');
  } catch (err) {
    console.error('Export failed:', err);
    ElMessage.error('导出失败，场景数据读取出错');
  }
};
</script>

<template>
  <button 
    @click="handleExport"
    class="px-3 py-1.5 rounded-panel bg-accent text-bg-base font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
  >
    <PhDownloadSimple :size="16" weight="bold" />
    导出
  </button>
</template>
