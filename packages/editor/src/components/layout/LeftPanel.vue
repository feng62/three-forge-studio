<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  PhCube, 
  PhCircle, // for Sphere
  PhSquare, // for Plane
  PhCylinder, 
  PhLightbulb, 
  PhSun,
  PhPalette,
  PhDrop,
  PhDiamond,
  PhUploadSimple,
  PhTrash,
  PhImage
} from '@phosphor-icons/vue';
import { useSettingsStore } from '../../stores/settingsStore';
import { useEngineStore } from '../../stores/engineStore';
import { db } from '../../db/db';
import { liveQuery } from 'dexie';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { uiPlugins } from '../../plugins';
import { storeToRefs } from 'pinia';

const settingsStore = useSettingsStore();
const engineStore = useEngineStore();
const projectStore = useProjectStore();
const uiStore = useUiStore();

const pluginsWithUi = computed(() => uiPlugins.filter(p => p.ui && p.ui.panel));

const { activeLeftTab: activeTab, activeInnerTab: innerTab } = storeToRefs(uiStore);
const fileInput = ref<HTMLInputElement | null>(null);
const textureInput = ref<HTMLInputElement | null>(null);

const allExternalAssets = ref<any[]>([]);
let dbSub: any;

onMounted(() => {
  dbSub = liveQuery(() => db.models.toArray()).subscribe({
    next: (models) => {
      allExternalAssets.value = models;
    },
    error: (err) => console.error(err)
  });
});

onUnmounted(() => {
  if (dbSub) dbSub.unsubscribe();
  // Revoke object URLs to prevent memory leaks
  allExternalAssets.value.forEach(asset => {
    if (asset._previewUrl) URL.revokeObjectURL(asset._previewUrl);
  });
});

const customModels = computed(() => allExternalAssets.value.filter(m => m.category === 'model' || !m.category));
const customTextures = computed(() => allExternalAssets.value.filter(m => m.category === 'texture'));

const triggerUpload = () => {
  fileInput.value?.click();
};

const triggerTextureUpload = () => {
  textureInput.value?.click();
};

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const buffer = await file.arrayBuffer();
  
  await db.models.add({
    name: file.name.replace(/\.[^/.]+$/, ""),
    type: ext,
    size: file.size,
    data: buffer,
    category: 'model',
    createdAt: Date.now()
  });
  
  input.value = '';
};

const onTextureChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const buffer = await file.arrayBuffer();
  
  await db.models.add({
    name: file.name.replace(/\.[^/.]+$/, ""),
    type: ext,
    size: file.size,
    data: buffer,
    category: 'texture',
    createdAt: Date.now()
  });
  
  input.value = '';
};

const deleteExternalModel = async (id: number) => {
  await db.models.delete(id);
};

const getTexturePreview = (texture: any) => {
  if (texture._previewUrl) return texture._previewUrl;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(texture.type)) {
    const blob = new Blob([texture.data]);
    const url = URL.createObjectURL(blob);
    texture._previewUrl = url;
    return url;
  }
  return null;
};

const builtInModels = [
  { type: 'Box', label: '立方体', icon: PhCube },
  { type: 'Sphere', label: '球体', icon: PhCircle },
  { type: 'Plane', label: '平面', icon: PhSquare },
  { type: 'Cylinder', label: '圆柱体', icon: PhCylinder },
];

const lights = [
  { type: 'AmbientLight', label: '环境光', icon: PhSun },
  { type: 'PointLight', label: '点光源', icon: PhLightbulb },
  { type: 'DirectionalLight', label: '平行光', icon: PhSun },
  { type: 'SpotLight', label: '聚光灯', icon: PhLightbulb },
  { type: 'RectAreaLight', label: '面光源', icon: PhSquare },
];

const materials = [
  { type: 'Material_Basic', label: '基础材质', icon: PhPalette },
  { type: 'Material_Standard', label: '标准材质', icon: PhPalette },
  { type: 'Material_Physical', label: '物理材质', icon: PhPalette },
  { type: 'Material_Lambert', label: '兰伯特材质', icon: PhPalette },
  { type: 'Material_Phong', label: '冯氏材质', icon: PhPalette },
  { type: 'Material_Metal', label: '金属材质', icon: PhDiamond },
  { type: 'Material_Glass', label: '玻璃材质', icon: PhDrop },
  { type: 'Material_Depth', label: '深度材质', icon: PhPalette },
  { type: 'Material_Normal', label: '法线材质', icon: PhPalette },
  { type: 'Material_Wireframe', label: '线框材质', icon: PhPalette },
];

const handleDragStart = (e: DragEvent, itemType: string) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/forge-asset', JSON.stringify({ type: itemType }));
    e.dataTransfer.effectAllowed = 'copy';
  }
};

const handleExternalDragStart = (e: DragEvent, model: any) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/forge-asset', JSON.stringify({ 
      type: 'ExternalModel', 
      id: model.id 
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }
};

const handleTextureDragStart = (e: DragEvent, texture: any) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/forge-asset', JSON.stringify({ 
      type: 'Texture', 
      id: texture.id 
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }
};
</script>

<template>
  <aside 
    class="h-full border-r border-border bg-panel flex shrink-0 transition-all duration-300 relative z-10 left-panel-wrapper"
    :style="{ width: settingsStore.panelWidth + 'px' }"
  >
    <el-tabs v-model="activeTab" tab-position="left" class="h-full w-full main-tabs">
      <el-tab-pane label="基础" name="base" class="h-full flex flex-col">
        <el-tabs v-model="innerTab" class="h-full w-full inner-tabs flex flex-col">
          <!-- Built-in Models -->
          <el-tab-pane label="模型" name="models" class="h-full overflow-y-auto p-3 custom-scrollbar">
            
            <div class="mb-4">
              <button 
                @click="triggerUpload"
                class="w-full py-3 border border-dashed border-border rounded-lg text-text-muted hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-1 bg-bg-base hover:bg-panel cursor-pointer group"
              >
                <PhUploadSimple :size="20" weight="duotone" class="group-hover:text-primary transition-colors" />
                <span class="text-xs">上传外部模型 (FBX/GLB)</span>
              </button>
              <input type="file" ref="fileInput" class="hidden" accept=".fbx,.glb,.gltf" @change="onFileChange" />
            </div>

            <!-- External Models -->
            <div v-if="customModels.length > 0">
              <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">外部模型</h3>
              <div class="grid grid-cols-2 gap-2 mb-4">
                <div 
                  v-for="model in customModels" 
                  :key="model.id"
                  draggable="true"
                  @dragstart="handleExternalDragStart($event, model)"
                  class="flex flex-col items-center justify-center gap-2 p-3 bg-bg-base border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary hover:text-primary transition-colors text-text-main group relative"
                >
                  <button @click.stop="deleteExternalModel(model.id)" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                    <PhTrash :size="14" />
                  </button>
                  <PhCube :size="24" weight="duotone" class="group-hover:text-primary transition-colors" />
                  <span class="text-[11px] truncate w-full text-center" :title="model.name">{{ model.name }}</span>
                </div>
              </div>
            </div>

            <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">内置模型</h3>
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="model in builtInModels" 
                :key="model.type"
                draggable="true"
                @dragstart="handleDragStart($event, model.type)"
                class="flex flex-col items-center justify-center gap-2 p-3 bg-bg-base border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary hover:text-primary transition-colors text-text-main group"
              >
                <component :is="model.icon" :size="24" weight="duotone" class="group-hover:text-primary transition-colors" />
                <span class="text-[11px]">{{ model.label }}</span>
              </div>
            </div>
          </el-tab-pane>

          <!-- Textures -->
          <el-tab-pane label="贴图" name="textures" class="h-full overflow-y-auto p-3 custom-scrollbar">
            <div class="mb-4">
              <button 
                @click="triggerTextureUpload"
                class="w-full py-3 border border-dashed border-border rounded-lg text-text-muted hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-1 bg-bg-base hover:bg-panel cursor-pointer group"
              >
                <PhUploadSimple :size="20" weight="duotone" class="group-hover:text-primary transition-colors" />
                <span class="text-xs">上传贴图 (JPG/PNG/HDR)</span>
              </button>
              <input type="file" ref="textureInput" class="hidden" accept=".png,.jpg,.jpeg,.webp,.gif,.hdr,.exr,.tga" @change="onTextureChange" />
            </div>

            <!-- Custom Textures -->
            <div v-if="customTextures.length > 0">
              <div class="grid grid-cols-2 gap-2 mb-4">
                <div 
                  v-for="texture in customTextures" 
                  :key="texture.id"
                  draggable="true"
                  @dragstart="handleTextureDragStart($event, texture)"
                  class="flex flex-col items-center justify-center gap-2 p-2 bg-bg-base border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary hover:text-primary transition-colors text-text-main group relative"
                >
                  <button @click.stop="deleteExternalModel(texture.id)" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity z-10 bg-black/50 rounded-sm">
                    <PhTrash :size="14" />
                  </button>
                  <div class="w-full h-16 flex items-center justify-center bg-black/20 rounded overflow-hidden relative">
                    <img v-if="getTexturePreview(texture)" :src="getTexturePreview(texture)" class="w-full h-full object-cover" />
                    <PhImage v-else :size="24" weight="duotone" class="text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                  <span class="text-[11px] truncate w-full text-center mt-1" :title="texture.name">{{ texture.name }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Lights -->
          <el-tab-pane label="灯光" name="lights" class="h-full overflow-y-auto p-3 custom-scrollbar">
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="light in lights" 
                :key="light.type"
                draggable="true"
                @dragstart="handleDragStart($event, light.type)"
                class="flex flex-col items-center justify-center gap-2 p-3 bg-bg-base border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-accent hover:text-accent transition-colors text-text-main group"
              >
                <component :is="light.icon" :size="24" weight="duotone" class="group-hover:text-accent transition-colors" />
                <span class="text-[11px]">{{ light.label }}</span>
              </div>
            </div>
          </el-tab-pane>

          <!-- Materials -->
          <el-tab-pane label="材质" name="materials" class="h-full overflow-y-auto p-3 custom-scrollbar">
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="mat in materials" 
                :key="mat.type"
                draggable="true"
                @dragstart="handleDragStart($event, mat.type)"
                class="flex flex-col items-center justify-center gap-2 p-3 bg-bg-base border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-green-500 hover:text-green-500 transition-colors text-text-main group"
              >
                <component :is="mat.icon" :size="24" weight="duotone" class="group-hover:text-green-500 transition-colors" />
                <span class="text-[11px]">{{ mat.label }}</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>

      <el-tab-pane v-for="plugin in pluginsWithUi" :key="plugin.name" :name="'plugin_' + plugin.name" class="h-full flex flex-col">
        <template #label>
          <div class="flex flex-col items-center justify-center gap-[2px]" style="line-height: 1.2;">
            <span v-for="(line, idx) in plugin.ui!.tabLabel" :key="idx">{{ line }}</span>
          </div>
        </template>
        <component 
          :is="plugin.ui!.panel" 
          :engine="engineStore.engine"
          :sceneGraphVersion="engineStore.sceneGraphVersion"
          @save="projectStore.saveProject()" 
        />
      </el-tab-pane>
    </el-tabs>
  </aside>
</template>

<style scoped>
/* Override element-plus tab styles to fit the theme */

/* Main vertical tabs on the far left */
:deep(.main-tabs > .el-tabs__header.is-left) {
  margin-right: 0;
  background-color: var(--color-bg-base);
  border-right: 1px solid var(--color-border);
}
:deep(.main-tabs > .el-tabs__header .el-tabs__nav-wrap::after) {
  display: none;
}
:deep(.main-tabs > .el-tabs__header .el-tabs__item) {
  color: var(--color-text-muted);
  padding: 0 16px !important;
  height: 48px;
  line-height: 48px;
  font-weight: 500;
}
:deep(.main-tabs > .el-tabs__header .el-tabs__item.is-active) {
  color: var(--color-accent); /* Make selected text clearly visible with accent color */
  background-color: var(--color-panel);
  font-weight: 600;
}
:deep(.main-tabs > .el-tabs__header .el-tabs__active-bar) {
  background-color: var(--color-accent);
}
:deep(.main-tabs > .el-tabs__content) {
  height: 100%;
}

/* Inner horizontal tabs for Base category */
:deep(.inner-tabs) {
  height: 100%;
}
:deep(.inner-tabs > .el-tabs__header) {
  margin: 0;
  background-color: var(--color-panel);
  border-bottom: 1px solid var(--color-border);
}
:deep(.inner-tabs > .el-tabs__header .el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: transparent;
}
:deep(.inner-tabs > .el-tabs__header .el-tabs__item) {
  color: var(--color-text-muted);
  height: 40px;
  line-height: 40px;
  font-size: 12px;
  padding: 0 12px !important;
}
:deep(.inner-tabs > .el-tabs__header .el-tabs__item.is-active) {
  color: var(--color-accent); /* Make selected text clearly visible with accent color */
  font-weight: 600;
}
:deep(.inner-tabs > .el-tabs__header .el-tabs__active-bar) {
  background-color: var(--color-primary);
}
:deep(.inner-tabs > .el-tabs__content) {
  flex: 1;
  height: 0; /* Let flex handle height */
}

/* Custom Scrollbar for inner content */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-muted);
}
</style>
