<script setup lang="ts">
import { ref } from 'vue'
import * as THREE from 'three'
import { useEngineStore } from '../../../stores/engineStore'
import AssetBrowserModal from './AssetBrowserModal.vue'
import TexturePreview from './TexturePreview.vue'

const props = defineProps<{
  modelValue: THREE.Texture | null
  label?: string
  accept?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: THREE.Texture | null): void
  (e: 'change', value: THREE.Texture | null): void
}>()

const isDragOver = ref(false)
const isLoading = ref(false)
const isModalVisible = ref(false)
const engineStore = useEngineStore()




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

const clearTexture = (e?: Event) => {
  if (e) e.stopPropagation()
  emit('update:modelValue', null)
  emit('change', null)
}

const loadTextureFromDb = async (id: string) => {
  if (!engineStore.engine) return
  
  isLoading.value = true
  try {
    const texture = await engineStore.engine.assetManager.loadTextureFromDB(id)
    if (!texture) throw new Error('Failed to load texture')
    
    emit('update:modelValue', texture)
    emit('change', texture)
  } catch (err) {
    console.error('Failed to load texture', err)
  } finally {
    isLoading.value = false
  }
}

const openModal = () => {
  isModalVisible.value = true
}

const onAssetSelect = async (id: string) => {
  await loadTextureFromDb(id)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 w-full text-xs">
    <span v-if="label" class="text-text-muted truncate flex-1" :title="label">{{ label }}</span>
    <div 
      class="w-24 h-8 border rounded flex items-center justify-center relative overflow-hidden transition-colors shrink-0 cursor-pointer"
      :class="[
        isDragOver ? 'border-accent bg-accent/10' : 'border-border bg-bg-base/50 hover:border-primary',
        isLoading ? 'opacity-50' : ''
      ]"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="openModal"
    >
      <TexturePreview v-if="modelValue" :texture="modelValue" />
      <span v-else class="text-[10px] text-text-muted select-none">点击选择/拖入</span>
      
      <!-- Loading Spinner -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-bg-base/50">
        <div class="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <!-- Clear Button -->
      <button 
        v-if="modelValue && !isLoading" 
        @click.stop="clearTexture"
        class="absolute top-0 right-0 w-4 h-4 bg-red-500/80 text-white flex items-center justify-center text-[10px] hover:bg-red-500 z-10"
        title="清除贴图"
      >
        ×
      </button>
    </div>

    <AssetBrowserModal
      v-model:visible="isModalVisible"
      :accept="accept"
      @select="onAssetSelect"
    />
  </div>
</template>
