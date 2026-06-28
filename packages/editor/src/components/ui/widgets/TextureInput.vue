<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { db } from '../../../db/db'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

const props = defineProps<{
  modelValue: THREE.Texture | null
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: THREE.Texture | null): void
  (e: 'change', value: THREE.Texture | null): void
}>()

const isDragOver = ref(false)
const isLoading = ref(false)
const previewUrl = ref<string | null>(null)

// Try to extract an existing texture's source for preview
onMounted(() => {
  updatePreviewFromValue(props.modelValue)
})

const updatePreviewFromValue = (tex: THREE.Texture | null) => {
  if (!tex || !tex.image) {
    previewUrl.value = null
    return
  }
  if (tex.userData && tex.userData.previewUrl) {
    previewUrl.value = tex.userData.previewUrl
    return
  }
  if (tex.image.src) {
    previewUrl.value = tex.image.src
  } else if (tex.image instanceof ImageBitmap) {
    // Cannot easily preview ImageBitmap without a canvas
  }
}

const onDragOver = (e: DragEvent) => {
  if (e.dataTransfer && e.dataTransfer.types.includes('application/forge-asset')) {
    e.preventDefault()
    isDragOver.value = true
  }
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = async (e: DragEvent) => {
  isDragOver.value = false
  if (!e.dataTransfer) return

  try {
    const dataStr = e.dataTransfer.getData('application/forge-asset')
    if (!dataStr) return
    const data = JSON.parse(dataStr)
    
    if (data.type === 'Texture' && data.id) {
      e.preventDefault()
      await loadTextureFromDb(data.id)
    }
  } catch (err) {
    console.error('Drop Error in TextureInput', err)
  }
}

const clearTexture = () => {
  emit('update:modelValue', null)
  emit('change', null)
  previewUrl.value = null
}

const loadTextureFromDb = async (id: number) => {
  isLoading.value = true
  try {
    const asset = await db.models.get(id)
    if (!asset) throw new Error('Asset not found')
    
    const blob = new Blob([asset.data])
    const url = URL.createObjectURL(blob)
    const ext = asset.name.split('.').pop()?.toLowerCase() || ''
    
    let texture: THREE.Texture
    if (ext === 'hdr') {
      const loader = new RGBELoader()
      texture = await loader.loadAsync(url)
      texture.mapping = THREE.EquirectangularReflectionMapping
    } else if (ext === 'exr') {
      const loader = new EXRLoader()
      texture = await loader.loadAsync(url)
      texture.mapping = THREE.EquirectangularReflectionMapping
    } else {
      const loader = new THREE.TextureLoader()
      texture = await loader.loadAsync(url)
      texture.colorSpace = THREE.SRGBColorSpace
    }
    
    texture.name = asset.name
    // 保存 DB id 供序列化使用
    texture.userData = { ...texture.userData, dbId: id, previewUrl: asset.preview || url }
    
    previewUrl.value = asset.preview || url
    emit('update:modelValue', texture)
    emit('change', texture)
  } catch (err) {
    console.error('Failed to load texture', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span v-if="label" class="text-text-muted truncate flex-1" :title="label">{{ label }}</span>
    <div 
      class="w-24 h-8 border rounded flex items-center justify-center relative overflow-hidden transition-colors shrink-0"
      :class="[
        isDragOver ? 'border-accent bg-accent/10' : 'border-border bg-bg-base/50',
        isLoading ? 'opacity-50' : ''
      ]"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
      <span v-else class="text-[10px] text-text-muted select-none">拖拽贴图</span>
      
      <!-- Loading Spinner -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-bg-base/50">
        <div class="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <!-- Clear Button -->
      <button 
        v-if="previewUrl && !isLoading" 
        @click="clearTexture"
        class="absolute top-0 right-0 w-4 h-4 bg-red-500/80 text-white flex items-center justify-center text-[10px] hover:bg-red-500"
        title="清除贴图"
      >
        ×
      </button>
    </div>
  </div>
</template>
