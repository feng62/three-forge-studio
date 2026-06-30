<script setup lang="ts">
import { PhDownloadSimple } from '@phosphor-icons/vue';
import { useProjectStore } from '../../stores/projectStore';
import { db } from '../../db/database';
import { db as assetDb } from '../../db/db';
import { ElMessage, ElMessageBox } from 'element-plus';
import JSZip from 'jszip';

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
    const { value: rawBasePath } = await ElMessageBox.prompt('请输入导出的基础路径 (将作为静态资源的 URL 前缀)', '导出设置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '/three',
    });

    const basePath = rawBasePath || '';
    const cleanBasePath = basePath.trim().replace(/\/+$/, '');

    // 从数据库中查询当前的场景数据
    const dbProject = await db.projects.get(currentProject.id);
    
    if (!dbProject || !dbProject.data || dbProject.data === '{}') {
      ElMessage.warning('数据库中没有有效的场景数据可供导出');
      return;
    }
    
    // 解析 JSON
    const jsonObj = JSON.parse(dbProject.data);
    const zip = new JSZip();

    // 在压缩包中创建文件夹
    const imageFolder = zip.folder('image');
    const modelFolder = zip.folder('model');
    
    // 遍历注册表导出物理文件，并修改 JSON 中的 url
    if (jsonObj.assets && jsonObj.assets.registry) {
      for (let i = 0; i < jsonObj.assets.registry.length; i++) {
        const item = jsonObj.assets.registry[i];
        if (item && item.uuid) {
          const assetRecord = await assetDb.assets.get(item.uuid);
          if (assetRecord && assetRecord.data) {
            // 判断是图片还是模型
            const isImage = item.type === 'texture' || assetRecord.category === 'texture' || item.type === 'image' || assetRecord.category === 'image';
            const folder = isImage ? imageFolder : modelFolder;
            const subDirName = isImage ? 'image' : 'model';
            
            // 组装文件名
            const ext = item.format || assetRecord.type || 'bin';
            const fileName = `${item.name}.${ext}`;
            
            // 将文件数据添加到压缩包相应文件夹中
            folder?.file(fileName, assetRecord.data);
            
            // 更新 JSON 中的 URL
            item.url = cleanBasePath ? `${cleanBasePath}/${subDirName}/${fileName}` : `./${subDirName}/${fileName}`;
          }
        }
      }
    }
    
    // 将更新后的 JSON 数据也加入压缩包
    zip.file('scene.json', JSON.stringify(jsonObj, null, 2));

    // 生成 ZIP 并触发下载
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    
    const fileName = dbProject.isTemporary ? 'scene_export' : dbProject.name;
    a.download = `${fileName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    ElMessage.success('场景与资产打包导出成功');
  } catch (err: any) {
    if (err !== 'cancel') {
      console.error('Export failed:', err);
      ElMessage.error('导出失败，数据处理出错');
    }
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
