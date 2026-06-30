<script setup lang="ts">
import { ref } from 'vue';
import { PhUploadSimple } from '@phosphor-icons/vue';
import { useProjectStore } from '../../stores/projectStore';
import { db } from '../../db/database';
import { db as assetDb } from '../../db/db';
import { ElMessage, ElLoading } from 'element-plus';
import JSZip from 'jszip';
import { decompressGLB } from '../../utils/gltfProcessor';

const fileInput = ref<HTMLInputElement | null>(null);
const projectStore = useProjectStore();

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const loading = ElLoading.service({
    lock: true,
    text: '正在导入项目...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    const sceneFile = loadedZip.file('scene.json');
    if (!sceneFile) {
      throw new Error('ZIP 包中未找到 scene.json');
    }

    const sceneContent = await sceneFile.async('string');
    const jsonObj = JSON.parse(sceneContent);

    const metadata = jsonObj.forgeMetadata || {};
    const isCompressed = metadata.compressed === true;

    // 处理资产
    if (jsonObj.assets && jsonObj.assets.registry) {
      for (let i = 0; i < jsonObj.assets.registry.length; i++) {
        const item = jsonObj.assets.registry[i];
        if (item && item.uuid) {
          const isImage = item.type === 'texture' || item.type === 'image';
          const subDirName = isImage ? 'image' : 'model';
          const ext = item.format || 'bin';
          const fileName = `${item.name}.${ext}`;
          
          const assetFile = loadedZip.file(`${subDirName}/${fileName}`);
          if (assetFile) {
            let buffer = await assetFile.async('uint8array');

            if (!isImage && isCompressed && (ext === 'glb' || ext === 'gltf')) {
              try {
                buffer = await decompressGLB(buffer);
              } catch (e) {
                console.error(`Failed to decompress model: ${fileName}`, e);
                ElMessage.warning(`解压模型 ${fileName} 失败，将使用原文件`);
              }
            }

            // 保存到 IndexedDB
            await assetDb.assets.put({
              id: item.uuid,
              type: ext,
              category: isImage ? 'texture' : 'model',
              name: item.name,
              size: buffer.byteLength,
              createdAt: Date.now(),
              data: buffer instanceof Uint8Array ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer : buffer as ArrayBuffer
            });
          }
        }
      }
    }

    // 导入为新项目
    const projectName = jsonObj.name || file.name.replace(/\.zip$/i, '') || '导入的项目';
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const projectId = await db.projects.add({
      uuid,
      name: projectName,
      data: JSON.stringify(jsonObj),
      isTemporary: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // 重新加载项目列表
    await projectStore.loadAllProjects();
    
    // 加载刚导入的项目
    await projectStore.loadProject(projectId);

    ElMessage.success('项目导入成功');
  } catch (err: any) {
    console.error('Import failed:', err);
    ElMessage.error(err.message || '导入失败，请检查文件格式是否正确');
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''; // 重置 file input
    }
    loading.close();
  }
};
</script>

<template>
  <button 
    @click="triggerFileInput"
    class="px-2.5 py-1.5 rounded bg-bg-base border border-transparent hover:border-border text-text-muted hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors"
    title="导入项目"
  >
    <PhUploadSimple :size="14" weight="bold" />
    导入项目
    <input 
      type="file" 
      ref="fileInput" 
      accept=".zip" 
      class="hidden" 
      @change="handleFileChange" 
    />
  </button>
</template>
