<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PhShareNetwork } from '@phosphor-icons/vue';
import { useProjectStore } from '../../stores/projectStore';
import { db } from '../../db/database';
import { db as assetDb } from '../../db/db';
import { ElMessage, ElLoading } from 'element-plus';
import JSZip from 'jszip';
import { compressGLB } from '../../utils/gltfProcessor';

const projectStore = useProjectStore();

// 是否可用本地发布，依赖于 Vite 插件注入的变量和 HMR 支持
const isLocalAvailable = ref(false);
const showDialog = ref(false);

const publishConfig = ref({
  publishType: 'export' as 'export' | 'local',
  
  // 发布目录名称（ZIP里的顶级目录，或本地发布的目录）
  folderName: 'three',

  // 共享设置：模型压缩
  compressModel: false,
  quality: 'medium' as 'low' | 'medium' | 'high'
});

onMounted(() => {
  // @ts-ignore
  if (typeof __LOCAL_PUBLISH_AVAILABLE__ !== 'undefined' && __LOCAL_PUBLISH_AVAILABLE__ && import.meta.hot) {
    isLocalAvailable.value = true;
    publishConfig.value.publishType = 'local'; // 优先本地发布
    
    // 监听响应结果
    import.meta.hot.on('local-publish:result', (payload: any) => {
      if (payload.success) {
        ElMessage.success(`本地发布成功: 可访问路径 ${payload.path}`);
      } else {
        ElMessage.error(`本地发布失败: ${payload.error}`);
      }
    });
  }
});

onUnmounted(() => {
  if (import.meta.hot) {
    // 移除监听逻辑如果有的话
  }
});

const handleOpenDialog = async () => {
  const currentProject = projectStore.currentProject;
  if (!currentProject || !currentProject.id) {
    ElMessage.warning('当前没有有效的场景可供发布');
    return;
  }
  showDialog.value = true;
};

const handlePublish = async () => {
  const isLocal = publishConfig.value.publishType === 'local';
  
  if (!publishConfig.value.folderName) {
    ElMessage.warning('请输入发布文件夹名称');
    return;
  }

  showDialog.value = false;
  const loading = ElLoading.service({
    lock: true,
    text: isLocal ? '正在发布到本地...' : '正在打包导出场景...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    // 触发保存确保数据库中是最新的场景
    await projectStore.saveProject();

    const currentProject = projectStore.currentProject;
    if (!currentProject || !currentProject.id) {
      throw new Error('当前没有有效的场景可供发布');
    }

    const basePath = `/${publishConfig.value.folderName}`;
    const cleanBasePath = basePath.trim().replace(/\/+$/, '');

    // 查询当前场景数据
    const dbProject = await db.projects.get(currentProject.id);
    if (!dbProject || !dbProject.data || dbProject.data === '{}') {
      throw new Error('数据库中没有有效的场景数据可供发布');
    }
    
    const jsonObj = JSON.parse(dbProject.data);

    // 标记压缩数据
    jsonObj.forgeMetadata = {
      version: '1.0',
      compressed: publishConfig.value.compressModel,
      quality: publishConfig.value.quality,
      timestamp: Date.now()
    };

    let zip: JSZip | null = null;
    let rootFolder: JSZip | null = null;
    let imageFolder: JSZip | null = null;
    let modelFolder: JSZip | null = null;

    if (!isLocal) {
      zip = new JSZip();
      rootFolder = zip.folder(publishConfig.value.folderName);
      imageFolder = rootFolder!.folder('image');
      modelFolder = rootFolder!.folder('model');
    }

    // 辅助函数：通过 HTTP 流式上传文件
    const uploadFile = async (fileName: string, data: Blob | ArrayBuffer | Uint8Array | string) => {
      const res = await fetch('/__local_publish/upload', {
        method: 'POST',
        headers: {
          'x-folder-name': encodeURIComponent(publishConfig.value.folderName),
          'x-file-name': encodeURIComponent(fileName)
        },
        body: data as BodyInit
      });
      if (!res.ok) {
        let errStr = res.statusText;
        try {
          const errJson = await res.json();
          errStr = errJson.error || errStr;
        } catch(e) {}
        throw new Error(`上传 ${fileName} 失败: ${errStr}`);
      }
    };

    // 遍历注册表导出文件
    if (jsonObj.assets && jsonObj.assets.registry) {
      for (let i = 0; i < jsonObj.assets.registry.length; i++) {
        const item = jsonObj.assets.registry[i];
        if (item && item.uuid) {
          const assetRecord = await assetDb.assets.get(item.uuid);
          if (assetRecord && assetRecord.data) {
            const isImage = item.type === 'texture' || assetRecord.category === 'texture' || item.type === 'image' || assetRecord.category === 'image';
            const subDirName = isImage ? 'image' : 'model';
            const ext = item.format || assetRecord.type || 'bin';
            const fileName = `${item.name}.${ext}`;
            let fileData: ArrayBuffer | Uint8Array | Blob | string = assetRecord.data;

            // 模型压缩支持（同时应用于导出和本地发布）
            if (!isImage && publishConfig.value.compressModel && (ext === 'glb' || ext === 'gltf')) {
              try {
                // @ts-ignore
                fileData = await compressGLB(fileData, publishConfig.value.quality);
              } catch (compressErr) {
                console.error('Model compression failed for', fileName, compressErr);
                ElMessage.warning(`模型 ${fileName} 压缩失败，将使用原文件`);
              }
            }

            if (isLocal) {
              await uploadFile(`${subDirName}/${fileName}`, fileData);
            } else {
              const folder = isImage ? imageFolder : modelFolder;
              folder?.file(fileName, fileData);
            }
            
            // 更新 JSON 中的 URL
            item.url = cleanBasePath ? `${cleanBasePath}/${subDirName}/${fileName}` : `./${subDirName}/${fileName}`;
          }
        }
      }
    }
    
    const sceneJsonStr = JSON.stringify(jsonObj, null, 2);

    if (isLocal) {
      await uploadFile('scene.json', sceneJsonStr);
      ElMessage.success(`本地发布成功: 可访问路径 /${publishConfig.value.folderName}`);
    } else {
      rootFolder!.file('scene.json', sceneJsonStr);
      const zipBlob = await zip!.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = dbProject.isTemporary ? 'scene_export' : dbProject.name;
      a.download = `${fileName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      ElMessage.success('场景与资产打包导出成功');
    }

  } catch (err: any) {
    console.error('Publish failed:', err);
    ElMessage.error(err.message || '发布失败，数据处理出错');
  } finally {
    loading.close();
  }
};
</script>

<template>
  <button 
    @click="handleOpenDialog"
    class="px-3 py-1.5 rounded-panel bg-primary text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
  >
    <PhShareNetwork :size="16" weight="bold" />
    发布场景
  </button>

  <el-dialog
    v-model="showDialog"
    title="发布场景设置"
    width="480px"
    destroy-on-close
    append-to-body
  >
    <el-form :model="publishConfig" label-width="120px" label-position="left" class="mt-4">
      <el-form-item label="发布目标">
        <el-radio-group v-model="publishConfig.publishType">
          <el-radio value="local" :disabled="!isLocalAvailable">
            本地运行测试
            <span v-if="!isLocalAvailable" class="text-xs text-text-muted ml-1">(仅开发环境可用)</span>
          </el-radio>
          <el-radio value="export">打包导出 ZIP</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="发布文件夹">
        <el-input v-model="publishConfig.folderName" placeholder="如 three" />
        <div class="text-xs text-text-muted mt-1 w-full" v-if="publishConfig.publishType === 'local'">
          将发布到项目的 public/ 目录下，路径将自动推断为 /{{ publishConfig.folderName }}
        </div>
        <div class="text-xs text-text-muted mt-1 w-full" v-else>
          导出的 ZIP 包根目录名称，且内部资源的 URL 前缀也会使用 /{{ publishConfig.folderName }}
        </div>
      </el-form-item>

      <!-- 公共压缩选项 -->
      <el-divider border-style="dashed" />
      <el-form-item label="开启模型压缩">
        <el-switch v-model="publishConfig.compressModel" />
        <div class="text-xs text-text-muted mt-1 w-full">使用 Draco 压缩模型，显著减小体积</div>
      </el-form-item>

      <el-form-item label="压缩质量" v-if="publishConfig.compressModel">
        <el-select v-model="publishConfig.quality" placeholder="选择质量">
          <el-option label="高 (推荐, 视觉无损)" value="high" />
          <el-option label="中等" value="medium" />
          <el-option label="低 (体积最小)" value="low" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePublish">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
