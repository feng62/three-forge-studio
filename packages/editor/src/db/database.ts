import Dexie, { type Table } from 'dexie';

export interface Project {
  id?: number;
  uuid: string;
  name: string;
  data: string;
  thumbnail?: string;
  isTemporary?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: any;
}

export class ThreeForgeDB extends Dexie {
  projects!: Table<Project>;
  settings!: Table<SettingRecord, string>;

  /**
   * 初始化数据库并定义表结构与索引
   */
  constructor() {
    super('ThreeForgeDatabase');
    
    // Define tables and indexes
    this.version(1).stores({
      projects: '++id, uuid, name, updatedAt, createdAt' // Primary key and indexed props
    });
    
    // Add settings table
    this.version(2).stores({
      settings: 'key' // Key-value store
    });
  }
}

export const db = new ThreeForgeDB();
