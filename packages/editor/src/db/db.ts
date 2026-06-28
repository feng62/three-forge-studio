import Dexie, { type Table } from 'dexie';

export interface ExternalModel {
  id?: number;
  name: string;
  type: string; // 'fbx' | 'glb' | 'gltf'
  size: number;
  data: ArrayBuffer;
  createdAt: number;
}

export class ForgeDB extends Dexie {
  models!: Table<ExternalModel>;

  constructor() {
    super('ForgeStudioDB');
    this.version(1).stores({
      models: '++id, name, type, createdAt' // Do not index 'data' arraybuffer
    });
  }
}

export const db = new ForgeDB();
