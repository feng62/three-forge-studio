<script setup lang="ts">
import { ForgeEditor } from '@forge/editor'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToPreview = () => {
  router.push('/preview')
}
</script>

<template>
  <div class="h-screen w-screen relative">
    <ForgeEditor />
    
    <!-- 悬浮预览按钮 -->
    <button 
      @click="goToPreview"
      class="absolute bottom-6 right-6 px-6 py-3 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-medium z-50 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M247.31 124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57 61.26 162.88 48 128 48S61.43 61.26 36.34 86.35C17.51 105.18 9 124 8.69 124.76a8 8 0 0 0 0 6.48c.35.79 8.82 19.58 27.65 38.41C61.43 194.74 93.12 208 128 208s66.57-13.26 91.66-38.35c18.83-18.83 27.3-37.62 27.65-38.41a8 8 0 0 0 0-6.48M128 192c-30.78 0-57.67-11.19-79.93-33.25A133.5 133.5 0 0 1 25 128a133.3 133.3 0 0 1 23.07-30.75C70.33 75.19 97.22 64 128 64s57.67 11.19 79.93 33.25A133.5 133.5 0 0 1 231 128c-7.23 13.47-15.32 23.31-23.07 30.75C185.67 180.81 158.78 192 128 192m0-112a48 48 0 1 0 48 48a48.05 48.05 0 0 0-48-48m0 80a32 32 0 1 1 32-32a32 32 0 0 1-32 32"/></svg>
      预览
    </button>
  </div>
</template>
