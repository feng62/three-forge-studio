import Dexie, { type Table } from 'dexie';

export interface ExternalModel {
  id?: number;
  name: string;
  type: string; // 'fbx' | 'glb' | 'gltf' or image extensions
  size: number;
  data: ArrayBuffer;
  createdAt: number;
  category?: 'model' | 'texture';
  preview?: string; // 用于图片纹理的 Base64 预览图
}

export class ForgeDB extends Dexie {
  models!: Table<ExternalModel>;

  constructor() {
    super('ForgeStudioDB');
    this.version(1).stores({
      models: '++id, name, type, createdAt' // Do not index 'data' arraybuffer
    });
    this.version(2).stores({
      models: '++id, name, type, category, createdAt'
    });
  }
}

export const db = new ForgeDB();
