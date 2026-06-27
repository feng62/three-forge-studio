import { Object3D, Mesh, PerspectiveCamera } from 'three';
import { ForgeSceneJSON, ForgeSceneNode, ForgeAssets, ForgeExtensions } from '@forge/types';
import { ForgePlugin } from './plugin';

export class ForgeSerializer {
  private plugins: ForgePlugin[];

  constructor(plugins: ForgePlugin[] = []) {
    this.plugins = plugins;
  }

  /**
   * 将 Three.js 的 Scene 序列化为 ForgeSceneJSON 协议对象。
   * @param scene 根场景对象
   * @param projectName 项目名称
   * @returns 序列化后的 JSON 数据
   */
  public serialize(scene: Object3D, projectName: string = 'Untitled Project'): ForgeSceneJSON {
    // 1. 利用 Three.js 原生的序列化机制，高效提取原生资产
    // （包括几何体 geometries, 材质 materials, 贴图 textures, 图片 images 等）。
    const nativeJSON = scene.toJSON() as any;

    const assets: ForgeAssets = {
      geometries: nativeJSON.geometries || [],
      materials: nativeJSON.materials || [],
      textures: nativeJSON.textures || [],
      images: nativeJSON.images || [], // Three.js 通常将图片和贴图一并提取
      models: [], // 自定义的外部模型资产引用，后续可由插件或外部逻辑填充
    };

    // 2. 解析全局维度的根插件数据
    let rootExtensions: ForgeExtensions | undefined = undefined;

    // 还原被挂载隔离的未知根扩展
    if (scene.userData._unknownExtensions) {
      rootExtensions = { ...scene.userData._unknownExtensions };
    }

    for (const plugin of this.plugins) {
      if (plugin.serializeRoot) {
        const data = plugin.serializeRoot(scene);
        if (data) {
          if (!rootExtensions) rootExtensions = {};
          rootExtensions[plugin.name] = data;
        }
      }
    }

    // 3. 递归遍历并构建 Forge 的场景树结构
    const rootNode = this.serializeNode(scene);

    // 组装最终完整的 JSON 协议
    const json: ForgeSceneJSON = {
      metadata: {
        version: '1.0',
        generator: 'ThreeForgeStudio',
      },
      project: {
        name: projectName,
        createdAt: Date.now(),
      },
      settings: {}, // 全局的基础配置，可由特定的工具或插件后续写入
      scene: rootNode,
      assets,
      extensions: rootExtensions,
    };

    return json;
  }

  private serializeNode(node: Object3D): ForgeSceneNode {
    // 提取基础共性属性
    const forgeNode: ForgeSceneNode = {
      uuid: node.uuid,
      type: node.type,
      matrix: node.matrix.toArray(),
    };

    if (node.name) forgeNode.name = node.name;
    if (node.visible === false) forgeNode.visible = node.visible;
    if (node.layers.mask !== 1) forgeNode.layers = node.layers.mask;

    // 提取相机的特定属性
    if ((node as any).isCamera) {
      const camera = node as PerspectiveCamera;
      if (camera.fov !== undefined) forgeNode.fov = camera.fov;
      if (camera.near !== undefined) forgeNode.near = camera.near;
      if (camera.far !== undefined) forgeNode.far = camera.far;
    }

    // 提取 Mesh 及其资产引用的特定属性
    if ((node as any).isMesh) {
      const mesh = node as Mesh;
      if (mesh.geometry) forgeNode.geometry = mesh.geometry.uuid;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          forgeNode.material = mesh.material.map(m => m.uuid);
        } else {
          forgeNode.material = mesh.material.uuid;
        }
      }
    }

    // 触发插件钩子，处理该节点专属的扩展逻辑
    let nodeExtensions: ForgeExtensions | undefined = undefined;

    // 首先合并我们在反序列化时暂存下来的“未知插件”数据
    if (node.userData && node.userData._unknownExtensions) {
      nodeExtensions = { ...node.userData._unknownExtensions };
    }

    for (const plugin of this.plugins) {
      if (plugin.serializeNode) {
        const data = plugin.serializeNode(node);
        if (data) {
          if (!nodeExtensions) nodeExtensions = {};
          nodeExtensions[plugin.name] = data;
        }
      }
    }
    if (nodeExtensions && Object.keys(nodeExtensions).length > 0) {
      forgeNode.extensions = nodeExtensions;
    }

    // 递归处理所有子节点
    if (node.children && node.children.length > 0) {
      forgeNode.children = [];
      for (const child of node.children) {
        if (child.userData && child.userData.isHelper) continue;
        forgeNode.children.push(this.serializeNode(child));
      }
    }

    return forgeNode;
  }
}
