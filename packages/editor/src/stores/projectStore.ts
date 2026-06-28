import { defineStore } from 'pinia';
import { ref, toRaw } from 'vue';
import { db, type Project } from '../db/database';
import { useEngineStore } from './engineStore';
import { ForgeSerializer, ForgeDeserializer } from '@forge/utils';
import { CoreExternalModelPlugin } from '../plugins/ExternalModelPlugin';
import { uiPlugins } from '../plugins';
import * as THREE from 'three';

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project | null>(null);
  const projectsList = ref<Project[]>([]);
  const isSaving = ref(false);
  const isLoading = ref(false);

  /**
   * 生成一个符合 RFC4122 v4 标准的 UUID (通用唯一识别码)
   * 用于作为项目的唯一标识，方便后续可能的云同步
   * @returns {string} UUID 字符串
   */
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  /**
   * 创建一个全新的项目
   * 将会初始化默认数据，保存到 IndexedDB，并将其设为当前正在编辑的项目
   * @param {string} name - 项目名称 (默认为 'Untitled Project')
   * @param {string} initialData - 初始化保存的 JSON 数据 (默认为 '{}')
   * @returns {Promise<Project>} 返回刚刚创建的项目对象
   */
  const createProject = async (name: string = 'Untitled Project', initialData: string = '{}', isTemporary: boolean = false) => {
    const now = Date.now();
    const newProject: Project = {
      uuid: generateUUID(),
      name,
      data: initialData,
      isTemporary,
      createdAt: now,
      updatedAt: now
    };
    
    const id = await db.projects.add(newProject);
    newProject.id = Number(id);
    currentProject.value = newProject;
    
    await loadAllProjects();
    return newProject;
  };

  /**
   * 加载所有历史项目列表
   * 从 Dexie 数据库中查询，并按照更新时间倒序排序（最新更新的在最上面）
   */
  const loadAllProjects = async () => {
    try {
      isLoading.value = true;
      projectsList.value = await db.projects.orderBy('updatedAt').reverse().toArray();
    } catch (err) {
      console.error('Failed to load projects from DB:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 根据项目 ID 加载指定的项目，并将其设为当前环境活动的项目
   * @param {number} id - Dexie 中自增的数字型 ID
   */
  const _applyDeserializedScene = async (data: string) => {
    const engineStore = useEngineStore();
    if (!engineStore.engine) return;

    if (!data || data === '{}') {
      engineStore.engine.clearScene();
      return;
    }

    try {
      const dataObj = JSON.parse(data);
      if (Object.keys(dataObj).length > 0) {
        const serializers = uiPlugins.map(p => p.serializer).filter(Boolean) as any[];
        const deserializer = new ForgeDeserializer([
          new CoreExternalModelPlugin(engineStore.engine.assetManager),
          ...serializers
        ]);
        const report = await deserializer.deserialize(dataObj);
        if (report.scene) {
          engineStore.engine.loadScene(report.scene as THREE.Scene);
        }
      }
    } catch (err) {
      console.error('Failed to parse or load project data:', err);
    }
  };

  /**
   * 根据项目 ID 加载指定的项目，并将其设为当前环境活动的项目
   * @param {number} id - Dexie 中自增的数字型 ID
   */
  const loadProject = async (id: number) => {
    try {
      isLoading.value = true;
      const project = await db.projects.get(id);
      if (project) {
        currentProject.value = project;
        await _applyDeserializedScene(project.data);
      } else {
        console.warn(`Project with id ${id} not found.`);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 加载最新更新的项目
   */
  const loadLatestProject = async () => {
    try {
      isLoading.value = true;
      const latest = await db.projects.orderBy('updatedAt').reverse().first();
      if (latest) {
        currentProject.value = latest;
        await _applyDeserializedScene(latest.data);
        return latest;
      }
      return null;
    } catch (err) {
      console.error('Failed to load latest project:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 清除当前项目状态
   */
  const clearCurrentProject = () => {
    currentProject.value = null;
  };

  /**
   * 将当前 3D 场景序列化并保存至当前活动的项目中
   * 如果当前没有任何活动项目，会自动创建并保存
   * @param {string} [thumbnail] - (可选) Base64 格式的场景截图封面
   */
  const saveProject = async (thumbnail?: string) => {
    const engineStore = useEngineStore();
    if (!engineStore.engine) return;
    
    // 执行序列化
    let data = '{}';
    try {
      if (engineStore.engine.camera && engineStore.engine.orbitControls) {
        if (!engineStore.engine.scene.children.includes(engineStore.engine.camera)) {
          engineStore.engine.camera.name = 'MainCamera';
          engineStore.engine.scene.add(engineStore.engine.camera);
        }
        engineStore.engine.camera.userData.orbitTarget = {
          x: engineStore.engine.orbitControls.target.x,
          y: engineStore.engine.orbitControls.target.y,
          z: engineStore.engine.orbitControls.target.z
        };
      }

      const serializers = uiPlugins.map(p => p.serializer).filter(Boolean) as any[];
      const serializer = new ForgeSerializer(serializers);
      const resultJSON = serializer.serialize(engineStore.engine.scene);
      data = JSON.stringify(resultJSON);
    } catch (err) {
      console.error('Failed to serialize scene:', err);
      return;
    }

    if (!currentProject.value?.id) {
      // If no current project exists, create a temporary one for auto-save
      await createProject('[未命名自动保存]', data, true);
    }
    
    if (currentProject.value && currentProject.value.id) {
      try {
        isSaving.value = true;
        currentProject.value.data = data;
        if (thumbnail) currentProject.value.thumbnail = thumbnail;
        currentProject.value.updatedAt = Date.now();
        
        const rawProject = toRaw(currentProject.value);
        await db.projects.put(rawProject);
        await loadAllProjects();
      } catch (err) {
        console.error('Failed to save project:', err);
      } finally {
        isSaving.value = false;
      }
    }
  };

  /**
   * 彻底删除一个指定 ID 的项目
   * 如果当前正在编辑此项目，则同时将当前项目状态置空
   * @param {number} id - Dexie 中的自增数字型 ID
   */
  const deleteProject = async (id: number) => {
    try {
      await db.projects.delete(id);
      if (currentProject.value?.id === id) {
        currentProject.value = null;
      }
      await loadAllProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  /**
   * 重命名指定项目
   * @param {number} id - 项目 ID
   * @param {string} newName - 新的项目名称
   */
  const renameProject = async (id: number, newName: string) => {
    try {
      await db.projects.update(id, { name: newName, isTemporary: false, updatedAt: Date.now() });
      if (currentProject.value?.id === id) {
        currentProject.value.name = newName;
        currentProject.value.isTemporary = false;
      }
      await loadAllProjects();
    } catch (err) {
      console.error('Failed to rename project:', err);
    }
  };

  /**
   * 开启自动保存循环，每隔 30 秒保存一次
   */
  let autoSaveInterval: number | null = null;
  const startAutoSave = (intervalMs: number = 30000) => {
    if (autoSaveInterval !== null) {
      window.clearInterval(autoSaveInterval);
    }
    autoSaveInterval = window.setInterval(async () => {
      // 只有在引擎准备好，且场景有内容或者已经有当前项目时才自动保存
      const engineStore = useEngineStore();
      if (!engineStore.engine || !engineStore.engine.scene) return;
      
      // 不要在保存时影响 UI 的提示（可以用静默保存）
      await saveProject();
    }, intervalMs);
  };

  const stopAutoSave = () => {
    if (autoSaveInterval !== null) {
      window.clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  };

  return {
    currentProject,
    projectsList,
    isSaving,
    isLoading,
    createProject,
    loadAllProjects,
    loadProject,
    loadLatestProject,
    clearCurrentProject,
    saveProject,
    deleteProject,
    renameProject,
    startAutoSave,
    stopAutoSave
  };
});
