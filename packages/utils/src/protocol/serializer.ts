import { Object3D, Mesh, PerspectiveCamera } from 'three';
import { getPathToExternalRoot } from './ExternalModelUtils';
import { ForgeSceneJSON, ForgeSceneNode, ForgeAssets, ForgeExtensions } from '@forge/types';
import { ForgePlugin } from '@forge/types';
import * as THREE from 'three'

export class ForgeSerializer {
  private plugins: ForgePlugin[];

  constructor(plugins: ForgePlugin[] = []) {
    this.plugins = plugins;
  }

  /**
   * 将 Three.js 的 Scene 序列化为 ForgeSceneJSON 协议对象。
   * @param scene 根场景对象
   * @param projectName 项目名称
   * @param projectAssets 可选的当前项目统一资产注册表
   * @returns 序列化后的 JSON 数据
   */
  public serialize(scene: Object3D, projectName: string = 'Untitled Project', projectAssets?: Map<string, any>): ForgeSceneJSON {
    const externalModels: { parent: Object3D; object: Object3D }[] = [];
    const helpers: { parent: Object3D; object: Object3D }[] = [];
    const modifiedMaterials = new Set<THREE.Material>();

    const findNodesToDetach = (node: Object3D) => {
      if (node.userData && node.userData.isExternalModel) {
        if (node.parent) {
          externalModels.push({ parent: node.parent, object: node });
        }
        // 收集所有被标记修改的材质，确保序列化时能将其提取到 JSON 的 materials 列表中
        node.traverse((child) => {
          if (child.userData?._externalModifications?.material && (child as any).material) {
            const mat = (child as any).material;
            if (Array.isArray(mat)) {
              mat.forEach(m => modifiedMaterials.add(m));
            } else {
              modifiedMaterials.add(mat);
            }
          }
        });
        return; // do not traverse inside external model
      }

      if (node.userData && node.userData.isHelper) {
        if (node.parent) {
          helpers.push({ parent: node.parent, object: node });
        }
        return; // do not traverse inside helper
      }

      for (const child of node.children) {
        findNodesToDetach(child);
      }
    };
    findNodesToDetach(scene);

    // 构建虚拟材质包裹节点，欺骗 Three.js 的原生 toJSON，将材质和贴图序列化出来
    let dummyHolder: Mesh | null = null;
    if (modifiedMaterials.size > 0) {
      dummyHolder = new Mesh();
      dummyHolder.name = '__ForgeDummy__';
      dummyHolder.material = Array.from(modifiedMaterials);
      scene.add(dummyHolder);
    }

    // 临时剥离外部模型和辅助工具，防止原生的 toJSON() 深度遍历抽取无关资产
    for (const em of externalModels) {
      em.parent.remove(em.object);
    }
    for (const helper of helpers) {
      helper.parent.remove(helper.object);
    }

    // 1. 利用 Three.js 原生的序列化机制，高效提取原生资产
    const nativeJSON = scene.toJSON() as any;



    // 恢复外部模型节点和辅助工具
    for (const em of externalModels) {
      em.parent.add(em.object);
    }
    for (const helper of helpers) {
      helper.parent.add(helper.object);
    }

    // 处理通过 IndexedDB 传入的贴图数据，防止将大量的 Base64 URL 编入 JSON
    if (nativeJSON.textures && nativeJSON.images) {
      const dbImageUuids = new Set<string>();
      for (const tex of nativeJSON.textures) {
        if (tex.userData && tex.userData.dbId !== undefined) {
          dbImageUuids.add(tex.image);
        }
      }
      for (const img of nativeJSON.images) {
        if (dbImageUuids.has(img.uuid)) {
          // 将 url 替换为一个极小的 1x1 透明 PNG data URI，防止 JSON 膨胀，
          // 同时保证 ObjectLoader.parseAsync() 期间 createImageBitmap() 能够成功解析而不报错。
          // 后续会有 _applyDeserializedScene 从 IndexedDB 加载真实的贴图并进行就地替换。
          img.url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }
      }
    }

    const assets: ForgeAssets = {
      geometries: nativeJSON.geometries || [],
      materials: nativeJSON.materials || [],
      textures: nativeJSON.textures || [],
      images: nativeJSON.images || [], // Three.js 通常将图片和贴图一并提取
      models: [], // 自定义的外部模型资产引用，后续可由插件或外部逻辑填充
      registry: projectAssets ? Array.from(projectAssets.values()) : [],
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

    // 清理假节点，让其不干扰后续逻辑
    if (dummyHolder) {
      scene.remove(dummyHolder);
    }

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
    };

    if (rootExtensions) {
      json.extensions = rootExtensions;
    }

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

    // 提取光源的特定属性
    if ((node as any).isLight) {
      const light = node as any;
      if (light.color) forgeNode.color = light.color.getHex();
      if (light.intensity !== undefined) forgeNode.intensity = light.intensity;
      if (light.distance !== undefined) forgeNode.distance = light.distance;
      if (light.angle !== undefined) forgeNode.angle = light.angle;
      if (light.penumbra !== undefined) forgeNode.penumbra = light.penumbra;
      if (light.decay !== undefined) forgeNode.decay = light.decay;
      if (light.width !== undefined) forgeNode.width = light.width;
      if (light.height !== undefined) forgeNode.height = light.height;
    }

    // 提取场景的特定属性
    if ((node as any).isScene) {
      const scene = node as any;
      if (scene.background) {
        if (scene.background.isColor) {
          forgeNode.background = scene.background.getHex();
        } else if (scene.background.isTexture) {
          forgeNode.background = scene.background.uuid;
        }
      }
      if (scene.environment && scene.environment.isTexture) {
        forgeNode.environment = scene.environment.uuid;
      }
      if (scene.fog) {
        forgeNode.fog = {
          type: scene.fog.isFogExp2 ? 'FogExp2' : 'Fog',
          color: scene.fog.color.getHex(),
          near: scene.fog.near,
          far: scene.fog.far,
          density: scene.fog.density
        };
      }
    }

    // 提取并清理用户自定义数据 (userData)
    if (node.userData && Object.keys(node.userData).length > 0) {
      const cleanUserData = { ...node.userData };
      delete cleanUserData.isHelper;
      delete cleanUserData.isExternalModel;
      delete cleanUserData.externalModelId;
      delete cleanUserData._externalModifications;
      delete cleanUserData._unknownExtensions;
      delete cleanUserData.cameraAnimations; // Managed by CameraAnimationForgePlugin
      if (Object.keys(cleanUserData).length > 0) {
        forgeNode.userData = cleanUserData;
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

    // 处理外部模型：作为引用保存，不遍历其深层子节点
    if (node.userData && node.userData.isExternalModel) {
      forgeNode.type = 'ExternalModel';
      if (!forgeNode.extensions) forgeNode.extensions = {};
      
      const modifications: Record<string, any> = {};
      // 遍历其子节点，寻找带有修改标记的节点
      node.traverse((child) => {
        if (child.userData && child.userData._externalModifications) {
          const path = getPathToExternalRoot(child);
          if (path) {
            const modData: any = {};
            const extMods = child.userData._externalModifications;
            
            if (extMods.transform) {
              child.updateMatrix();
              modData.matrix = child.matrix.elements;
            }
            if (extMods.material && (child as any).material) {
              const mat = (child as any).material;
              modData.material = Array.isArray(mat) ? mat.map(m => m.uuid) : mat.uuid;
            }
            if (extMods.userData) {
              // 浅拷贝 userData 并剔除内部私有属性
              const ud = { ...child.userData };
              delete ud._externalModifications;
              delete ud.isExternalModel;
              modData.userData = ud;
            }
            
            modifications[path] = modData;
          }
        }
      });

      forgeNode.extensions['core_external_model'] = {
        id: node.userData.externalModelId,
        modifications: Object.keys(modifications).length > 0 ? modifications : undefined
      };
      return forgeNode;
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
