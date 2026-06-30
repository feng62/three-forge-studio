<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../../../db/db'
import { liveQuery } from 'dexie'
import { PhUploadSimple } from '@phosphor-icons/vue'
import TexturePreview from './TexturePreview.vue'

const props = defineProps<{
  visible: boolean
  accept?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', uuid: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const assets = ref<any[]>([])
let dbSub: any;

onMounted(() => {
  dbSub = liveQuery(() => db.assets.where('category').equals('texture').toArray()).subscribe({
    next: (data) => {
      assets.value = data
    },
    error: (err) => console.error(err)
  })
})

onUnmounted(() => {
  if (dbSub) dbSub.unsubscribe()
})

const filteredAssets = computed(() => {
  if (!props.accept) return assets.value;
  const acceptRules = props.accept.split(',').map(s => s.trim().toLowerCase());
  return assets.value.filter(asset => {
    const ext = '.' + (asset.type || '').toLowerCase();
    
    // Check if accept is image/*
    if (props.accept === 'image/*') {
      return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'hdr', 'exr'].includes(asset.type?.toLowerCase() || '');
    }

    // Direct extension match
    return acceptRules.some(rule => {
      if (rule.startsWith('.')) return rule === ext;
      if (rule.includes('/')) return rule === `image/${asset.type}`; // fallback matching
      return false;
    });
  })
})



const triggerUpload = () => {
  fileInput.value?.click()
}

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i]
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const buffer = await file.arrayBuffer()
    
    await db.assets.add({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      type: ext,
      size: file.size,
      data: buffer,
      category: 'texture',
      createdAt: Date.now()
    })
  }
  
  input.value = ''
}

const selectAsset = (id: string) => {
  emit('select', id)
  emit('update:visible', false)
}


</script>

<template>
  <el-dialog 
    :model-value="visible" 
    @update:model-value="(val: boolean) => emit('update:visible', val)"
    title="选择贴图资源" 
    width="60%"
    :show-close="true"
    append-to-body
    custom-class="asset-browser-modal"
  >
    <div class="flex flex-col h-[50vh] gap-4">
      <div class="flex justify-between items-center">
        <span class="text-xs text-text-muted">从现有资源中选择或上传新贴图</span>
        <button 
          @click="triggerUpload"
          class="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary-hover transition-colors"
        >
          <PhUploadSimple weight="bold" />
          上传新贴图
        </button>
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          :accept="accept" 
          multiple
          @change="onFileChange" 
        />
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar bg-bg-base/50 border border-border p-3 rounded grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
        <div 
          v-for="asset in filteredAssets" 
          :key="asset.id"
          class="aspect-square bg-panel border border-border hover:border-primary rounded flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative"
          @click="selectAsset(asset.id)"
        >
          <TexturePreview :asset="asset" />
          
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
            <span class="text-[10px] text-white text-center break-all line-clamp-3">{{ asset.name }}.{{ asset.type }}</span>
          </div>
        </div>
        
        <div v-if="filteredAssets.length === 0" class="col-span-full h-32 flex items-center justify-center text-text-muted text-xs">
          没有找到匹配的贴图资源
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style>
.asset-browser-modal .el-dialog__body {
  padding-top: 10px;
  padding-bottom: 20px;
}
</style>
