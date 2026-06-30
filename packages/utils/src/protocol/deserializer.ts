import { ObjectLoader, Object3D } from 'three';
import { ForgeSceneJSON, ForgeSceneNode } from '@forge/types';
import { ForgePlugin } from '@forge/types';
import { DeserializeReport } from './types';
import { ForgeValidator } from './validator';

export class ForgeDeserializer {
  private plugins: ForgePlugin[];
  private currentEngineVersion: string;

  constructor(plugins: ForgePlugin[] = [], engineVersion: string = '1.0.0') {
    this.plugins = plugins;
    this.currentEngineVersion = engineVersion;
  }

  /**
   * 将 ForgeSceneJSON 协议对象反序列化还原回 Three.js Scene 对象。
   * @param json 要解析的 JSON 协议数据
   * @returns 返回一个 Promise，解析完成后获得包含警告/错误的报告和重建的场景对象。
   */
  public async deserialize(json: ForgeSceneJSON): Promise<DeserializeReport> {
    const report: DeserializeReport = {
      status: 'SUCCESS',
      warnings: [],
      errors: []
    };

    // 1. 版本校验拦截
    const versionCheck = ForgeValidator.checkCompatibility(json.metadata.version, this.currentEngineVersion);
    if (versionCheck.status === 'FATAL') {
      report.status = 'FATAL';
      report.errors.push(versionCheck.message!);
      return report;
    } else if (versionCheck.status === 'WARNING') {
      report.status = 'WARNING';
      report.warnings.push(versionCheck.message!);
    }

    // 2. 重新构建一个符合 Three.js 原生 JSON 结构的格式，
    // 以便利用内置的 ObjectLoader 帮我们高效还原所有的内置资产（几何体、材质、贴图等）
    const nativeJSON = {
      metadata: {
        version: 4.5,
        type: 'Object',
        generator: 'Object3D.toJSON'
      },
      geometries: json.assets.geometries || [],
      materials: json.assets.materials || [],
      textures: json.assets.textures || [],
      images: json.assets['images'] || [],
      object: json.scene // 我们的 ForgeSceneNode 结构在设计上就是为了完美兼容原生 JSON 的 Object 层级
    };

    // 修复旧数据或被压缩过的贴图：将 url 为空的 image 替换为 1x1 透明像素，防止 ObjectLoader 崩溃
    if (nativeJSON.images) {
      for (const img of nativeJSON.images) {
        if (!img.url || img.url === '') {
          img.url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }
      }
    }

    const loader = new ObjectLoader();
    let rootObject: Object3D;
    try {
      rootObject = await loader.parseAsync(nativeJSON);
      report.scene = rootObject;
    } catch (err: any) {
      report.status = 'FATAL';
      report.errors.push(`原生资产反序列化失败: ${err.message || err}`);
      return report;
    }

    // 构建一个已注册插件名称的集合，用于筛查未知扩展
    const registeredPluginNames = new Set(this.plugins.map(p => p.name));

    // 3. 触发全局维度的根插件扩展钩子，并收集未知扩展
    if (json.extensions) {
      const unknownExtensions: Record<string, any> = {};
      
      for (const key of Object.keys(json.extensions)) {
        if (!registeredPluginNames.has(key)) {
          unknownExtensions[key] = json.extensions[key];
          const msg = `未找到全局插件 "${key}" 的解析逻辑，数据已暂存隔离。`;
          console.warn(`[ForgeDeserializer] ${msg}`);
          report.warnings.push(msg);
          report.status = 'WARNING';
        }
      }

      if (Object.keys(unknownExtensions).length > 0) {
        rootObject.userData._unknownExtensions = unknownExtensions;
      }

      for (const plugin of this.plugins) {
        if (plugin.deserializeRoot && json.extensions[plugin.name]) {
          await plugin.deserializeRoot(json.extensions[plugin.name], rootObject);
        }
      }
    }

    // 4. 并行遍历新创建出来的原生 Object3D 树以及对应的 Forge JSON 节点树，
    // 为了触发各个节点层级的插件反序列化钩子。
    await this.deserializeNode(json.scene, rootObject, registeredPluginNames, report);

    // 5. 垃圾清理阶段：清理为了强制序列化外部模型衍生材质而构建的虚拟节点
    const dummy = rootObject.getObjectByName('__ForgeDummy__');
    if (dummy) {
      dummy.removeFromParent();
    }

    return report;
  }

  private async deserializeNode(jsonNode: ForgeSceneNode, objectNode: Object3D, registeredPluginNames: Set<string>, report: DeserializeReport): Promise<void> {
    // 触发当前节点相关的插件解析钩子，并隔离未知扩展
    if (jsonNode.extensions) {
      const unknownExtensions: Record<string, any> = {};

      for (const key of Object.keys(jsonNode.extensions)) {
        if (!registeredPluginNames.has(key)) {
          unknownExtensions[key] = jsonNode.extensions[key];
          const msg = `节点 [${jsonNode.name || jsonNode.uuid}] 未找到插件 "${key}" 的解析逻辑，数据已暂存隔离。`;
          console.warn(`[ForgeDeserializer] ${msg}`);
          report.warnings.push(msg);
          report.status = 'WARNING';
        }
      }

      if (Object.keys(unknownExtensions).length > 0) {
        objectNode.userData._unknownExtensions = unknownExtensions;
      }

      for (const plugin of this.plugins) {
        if (plugin.deserializeNode && jsonNode.extensions[plugin.name]) {
          await plugin.deserializeNode(jsonNode.extensions[plugin.name], objectNode);
        }
      }
    }

    // 递归处理子节点
    if (jsonNode.children && objectNode.children) {
      // 按照 UUID 对子节点进行映射，这样可以防范原生 loader 在还原时导致的排序差异或过滤
      const objectChildrenMap = new Map<string, Object3D>();
      for (const child of objectNode.children) {
        objectChildrenMap.set(child.uuid, child);
      }

      for (const jsonChild of jsonNode.children) {
        const objectChild = objectChildrenMap.get(jsonChild.uuid);
        if (objectChild) {
          await this.deserializeNode(jsonChild, objectChild, registeredPluginNames, report);
        }
      }
    }
  }
}
