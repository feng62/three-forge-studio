<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { renderTextureToCanvas } from '../../../utils/imageUtils'

const props = defineProps<{
  asset?: any; // The DB asset
  texture?: THREE.Texture | null; // Or a loaded texture
}>()

const isHdr = ref(false)
const imgSrc = ref<string | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let localBlobUrl: string | null = null;

const updatePreview = async () => {
  if (localBlobUrl) {
    URL.revokeObjectURL(localBlobUrl);
    localBlobUrl = null;
  }
  imgSrc.value = null;
  isHdr.value = false;
  
  if (!props.asset && !props.texture) {
    return;
  }
  
  let ext = '';
  if (props.texture) {
    ext = props.texture.name?.split('.').pop()?.toLowerCase() || '';
  } else if (props.asset) {
    ext = props.asset.type?.toLowerCase() || props.asset.name?.split('.').pop()?.toLowerCase() || '';
  }
  
  if (ext === 'hdr' || ext === 'exr') {
    isHdr.value = true;
    
    if (props.texture) {
      if (canvasRef.value) {
        renderTextureToCanvas(props.texture, canvasRef.value);
      }
    } else if (props.asset) {
      const blob = new Blob([props.asset.data]);
      const url = URL.createObjectURL(blob);
      let loadedTex: THREE.Texture;
      if (ext === 'hdr') {
        const loader = new HDRLoader();
        loadedTex = await loader.loadAsync(url);
      } else {
        const loader = new EXRLoader();
        loadedTex = await loader.loadAsync(url);
      }
      URL.revokeObjectURL(url);
      
      if (canvasRef.value) {
        renderTextureToCanvas(loadedTex, canvasRef.value);
      }
      loadedTex.dispose();
    }
  } else {
    isHdr.value = false;
    if (props.texture) {
      if (props.texture.userData && props.texture.userData.previewUrl) {
        imgSrc.value = props.texture.userData.previewUrl;
      } else if ((props.texture.image as any)?.src) {
        imgSrc.value = (props.texture.image as any).src;
      }
    } else if (props.asset) {
      const blob = new Blob([props.asset.data]);
      localBlobUrl = URL.createObjectURL(blob);
      imgSrc.value = localBlobUrl;
    }
  }
}

watch(() => [props.asset, props.texture], updatePreview, { deep: true });

onMounted(updatePreview);

onUnmounted(() => {
  if (localBlobUrl) {
    URL.revokeObjectURL(localBlobUrl);
    localBlobUrl = null;
  }
});
</script>

<template>
  <div class="w-full h-full relative flex items-center justify-center">
    <canvas v-show="isHdr" ref="canvasRef" class="w-full h-full object-cover"></canvas>
    <img v-show="!isHdr && imgSrc" :src="imgSrc || undefined" class="w-full h-full object-cover" />
  </div>
</template>
