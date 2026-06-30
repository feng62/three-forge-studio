import * as THREE from 'three';
import { GLTFLoader, FBXLoader } from 'three-stdlib';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { BaseExternalModelPlugin } from '@forge/plugins';

import dracoWasmWrapperUrl from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url';
import dracoDecoderWasmUrl from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';

// 初始化 DRACOLoader 单例以避免重复创建
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath({
  js: dracoWasmWrapperUrl,
  wasm: dracoDecoderWasmUrl
});

export class PreviewExternalModelPlugin extends BaseExternalModelPlugin {
  name = 'core_external_model';
  private registryMap = new Map<string, any>();

  setRegistry(registry: any[]) {
    this.registryMap.clear();
    registry.forEach(item => {
      this.registryMap.set(item.uuid, item);
    });
  }

  async deserializeNode(data: any, object: THREE.Object3D): Promise<void> {
    if (!data.id) return;
    
    const registryItem = this.registryMap.get(data.id);
    if (!registryItem) {
      console.warn(`[PreviewExternalModelPlugin] Model data not found for ${data.id}`);
      return;
    }

    const url = registryItem.url;
    if (!url) {
      console.warn(`[PreviewExternalModelPlugin] Model URL is empty for ${data.id}`);
      return;
    }

    let loadedObject: THREE.Object3D | null = null;
    let ext = '';
    try {
      ext = (registryItem.format || registryItem.type || '').toLowerCase();
      if (ext === 'gltf' || ext === 'glb' || ext === 'model' || url.endsWith('.glb') || url.endsWith('.gltf')) {
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader as any);
        const gltf = await loader.loadAsync(url);
        loadedObject = gltf.scene || gltf.scenes[0];
      } else if (ext === 'fbx' || url.endsWith('.fbx')) {
        const loader = new FBXLoader();
        loadedObject = await loader.loadAsync(url);
      }
    } catch (err) {
      console.error(`[PreviewExternalModelPlugin] Failed to load ${ext} from ${url}:`, err);
    }

    if (loadedObject) {
      object.add(loadedObject);
      
      // 恢复外部模型的材质和变换修改
      if (data.modifications) {
        let root = object.parent;
        while (root && root.parent) {
          root = root.parent;
        }
        const materialsSource = (root as THREE.Scene) || new THREE.Scene();
        this.applyExternalModifications(object, data.modifications, materialsSource, false);
      }
    }
  }
}
