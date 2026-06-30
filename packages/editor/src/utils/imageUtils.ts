import * as THREE from 'three'

let previewRenderer: THREE.WebGLRenderer | null = null;
let previewScene: THREE.Scene | null = null;
let previewCamera: THREE.OrthographicCamera | null = null;
let previewMesh: THREE.Mesh | null = null;

function initPreviewRenderer() {
  if (previewRenderer) return;
  const canvas = document.createElement('canvas');
  // preserveDrawingBuffer is required to safely call toDataURL after render
  previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
  previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  previewRenderer.toneMappingExposure = 1.0;
  
  previewScene = new THREE.Scene();
  previewCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  previewMesh = new THREE.Mesh(geometry, material);
  previewScene.add(previewMesh);
}

export function renderTextureToCanvas(texture: THREE.Texture, targetCanvas: HTMLCanvasElement) {
  initPreviewRenderer()

  const img = texture.image as any;
  if (!img) return;
  const width = img.width || 1024;
  const height = img.height || 1024;
  
  // Calculate thumbnail size (max 256px)
  const maxWidth = 256
  let scale = 1
  if (width > maxWidth) {
    scale = maxWidth / width
  }
  const thumbWidth = Math.max(1, Math.floor(width * scale))
  const thumbHeight = Math.max(1, Math.floor(height * scale))
  
  targetCanvas.width = thumbWidth
  targetCanvas.height = thumbHeight
  
  previewRenderer!.setSize(thumbWidth, thumbHeight, false)
  
  const material = previewMesh!.material as THREE.MeshBasicMaterial
  material.map = texture
  material.needsUpdate = true
  
  previewRenderer!.render(previewScene!, previewCamera!)
  
  const ctx = targetCanvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(previewRenderer!.domElement, 0, 0)
  }
  
  material.map = null
}
