# JSON 协议设计

JSON 协议是 `@forge/editor` (生产者) 和 `@forge/core` (消费者) 之间唯一的数据沟通桥梁。为了保证两个平行的宇宙能够完美协作，我们设计了一套严格、可扩展的 JSON Schema 标准。

## 设计目标

1. **生与产彻底解耦**：编辑器只需关心如何导出，渲染器只需关心如何解析。
2. **极度轻量化**：精简无关字段，只保留渲染场景必需的数据结构。
3. **高可扩展性**：支持官方插件和第三方业务快速拓展自定义数据。
4. **完全兼容 Three.js**：在结构设计上尽量与 Three.js 的 Object3D 树形结构保持一致，降低解析成本。

## 协议基本结构

一份完整的场景 JSON 文件主要包含以下几个部分：

```json
{
  "metadata": {
    "version": "1.0",
    "generator": "ThreeForgeStudio"
  },
  "project": {
    "name": "My 3D Scene",
    "createdAt": 1690000000000
  },
  "scene": {
    "uuid": "...",
    "type": "Scene",
    "children": []
  },
  "assets": {
    "geometries": [],
    "materials": [],
    "textures": []
  },
  "extensions": {}
}
```

### 1. Metadata 与 Project
记录场景文件的元数据信息以及项目基础配置，如生成器版本、创建时间等。

### 2. Scene (场景树)
采用递归的树形结构，描述场景中的所有节点。包括：
- `uuid`: 节点的唯一标识。
- `type`: 节点类型（如 `Mesh`, `PointLight`, `Group`）。
- `matrix`: 节点的本地变换矩阵。
- `geometry`: 引用的几何体 UUID。
- `material`: 引用的材质 UUID。
- `children`: 子节点列表。

### 3. Assets (资产库)
为避免在场景树中重复记录相同的资源配置，我们将几何体 (geometries)、材质 (materials) 和贴图 (textures) 集中存储在 `assets` 中。场景树中的节点通过 `uuid` 进行索引。
这种设计不仅减小了 JSON 体积，还便于 `@forge/core` 层的资产管理器（Asset Manager）进行统一的缓存和去重。

### 4. Extensions (插件扩展数据)
插件系统是 JSON 协议的重要组成部分。任何不属于标准 Three.js 核心属性的数据（如物理引擎属性、后期泛光特效、复杂的业务元数据），都应存放在 `extensions` 字段中。

```json
"extensions": {
  "Forge_Physics": {
    "rigidBody": "dynamic",
    "mass": 1.0
  },
  "Forge_PostProcessing": {
    "bloom": {
      "intensity": 1.5,
      "radius": 0.4
    }
  }
}
```

## 序列化与反序列化

- **序列化 (Editor)**：编辑器在导出时，遍历内部的场景树，提取必要属性，同时调用各插件的钩子函数将扩展数据写入 `extensions` 中。
- **反序列化 (Core)**：核心运行时解析基础树形结构并还原 `Object3D` 实例，随后触发各插件的解析钩子，将 `extensions` 中的数据转换为运行时的附加逻辑。

## 完整 TypeScript 定义参考

基于以上的协议结构以及对相机控制器、外部模型覆写等高级特性的支持，完整的 TypeScript 接口约束如下（供开发时参考）：

### 1. 基础信息与元数据

用于描述场景的版本、生成器以及业务项目维度的数据。

```typescript
/**
 * 场景元数据
 */
export interface ForgeMetadata {
  /** 协议版本号，用于向下兼容 */
  version: string;
  /** 生成器名称，如 "ThreeForgeStudio" */
  generator: string;
}

/**
 * 业务/项目基础信息
 */
export interface ForgeProject {
  name: string;
  createdAt: number;
  updatedAt?: number;
}
```

**ForgeMetadata 属性说明**

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `version` | `string` | 协议版本号，用于解析时的向下兼容处理。 |
| `generator` | `string` | 生成器标识，例如 `"ThreeForgeStudio"`。 |

**ForgeProject 属性说明**

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | `string` | 当前业务项目的名称。 |
| `createdAt` | `number` | 项目创建的时间戳。 |
| `updatedAt` | `number` (可选) | 项目最后更新的时间戳。 |

### 2. 全局配置与扩展载体

`Settings` 用于定义 Core 引擎启动时的默认表现（如主相机选型）。`ForgeExtensions` 则是贯穿全局和节点层级的插件数据容器。

```typescript
/**
 * 运行时全局配置 (Settings)
 * 决定了 Core 引擎启动时的默认表现
 */
export interface ForgeSettings {
  /** 当前激活的主相机的 UUID，Core 引擎启动时会用它作为默认渲染相机 */
  activeCamera?: string;
  /** 全局背景色或环境贴图的 UUID（可选） */
  background?: string;
  /** 环境光 HDR 贴图的 UUID（可选） */
  environment?: string;
}

/**
 * 任意插件的扩展数据载体
 */
export type ForgeExtensions = Record<string, any>;
```

**ForgeSettings 属性说明**

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `activeCamera` | `string` (可选) | 当前激活的主相机 UUID，Core 引擎启动时将以该相机进行渲染。 |
| `background` | `string` (可选) | 全局背景色的色值或环境贴图资产的 UUID。 |
| `environment` | `string` (可选) | 用于 PBR 渲染的全局环境光 HDR 贴图资产的 UUID。 |

**ForgeExtensions 属性说明**

| 类型 | 说明 |
| :--- | :--- |
| `Record<string, any>` | 动态的键值对容器。Key 必须是插件的唯一命名空间（例如 `Forge_Physics`），Value 是该插件自定义的任意数据对象。 |

### 3. 资产库定义

为了避免数据冗余，所有的几何体、材质、贴图及外部模型 URL 都集中提取到 `assets` 中进行统一缓存。

```typescript
/**
 * 场景资产库，用于资源的集中管理和去重引用
 */
export interface ForgeAssets {
  geometries?: any[];
  materials?: any[];
  textures?: any[];
  /** 外部模型引用资源 (如 GLB, FBX) */
  models?: Array<{
    uuid: string;
    url: string;
    format: string;
  }>;
  [key: string]: any;
}
```

**ForgeAssets 属性说明**

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `geometries` | `any[]` (可选) | 场景中使用的所有原生几何体列表，按 UUID 去重存储。 |
| `materials` | `any[]` (可选) | 场景中使用的所有原生材质列表，按 UUID 去重存储。 |
| `textures` | `any[]` (可选) | 场景中使用的所有贴图列表，按 UUID 去重存储。 |
| `models` | `Array<{...}>` (可选) | 指向外部文件（如 `.glb`, `.fbx`）的模型资源记录。 |
| `[key: string]`| `any` | 允许后续扩展其他类型的全局资产库（如字体、着色器脚本）。 |

### 4. 场景节点定义

继承并精简自 Three.js Object3D 树，利用矩阵记录空间位置，使用 UUID 引用所需资产。

```typescript
/**
 * 场景树中的单个节点定义
 */
export interface ForgeSceneNode {
  uuid: string;
  name?: string;
  type: string;
  
  /** 本地变换矩阵 (16位浮点数数组)，压缩了 position, rotation, scale */
  matrix: number[];
  
  visible?: boolean;
  layers?: number;
  
  /** 相机特有属性 */
  fov?: number;
  near?: number;
  far?: number;

  /** Mesh 的资产引用 */
  geometry?: string;
  material?: string | string[];

  /** 该节点挂载的自定义插件扩展数据 */
  extensions?: ForgeExtensions;

  /** 预留给不需要被插件系统接管的普通业务用户数据 */
  userData?: Record<string, any>;

  /** 子节点列表 (递归) */
  children?: ForgeSceneNode[];
}
```

**ForgeSceneNode 属性说明**

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `uuid` | `string` | 节点的全局唯一标识符。 |
| `name` | `string` (可选) | 节点在场景树中的可读名称。 |
| `type` | `string` | 对应 Three.js 的对象类型（如 `Scene`, `Mesh`, `Group`, `PerspectiveCamera`）。 |
| `matrix` | `number[]` | 16 位浮点数数组，表示当前节点的本地变换矩阵（压缩了位置、旋转、缩放）。 |
| `visible` | `boolean` (可选) | 控制节点及其子节点的显示或隐藏。 |
| `layers` | `number` (可选) | Three.js 的渲染层级掩码。 |
| `fov`, `near`, `far` | `number` (可选) | 相机特有的投影参数。 |
| `geometry` | `string` (可选) | 引用的几何体 `uuid`（必须存在于 `assets.geometries` 中）。 |
| `material` | `string` \| `string[]` (可选) | 引用的材质 `uuid`（必须存在于 `assets.materials` 中）。 |
| `extensions` | `ForgeExtensions` (可选) | 当前节点挂载的特定插件数据（如覆写规则、刚体组件等）。 |
| `userData` | `Record<string, any>` (可选) | 预留给外部业务系统的常规附加数据。 |
| `children` | `ForgeSceneNode[]` (可选) | 递归的子节点列表。 |

### 5. 协议根结构与典型插件扩展

将上述所有模块拼装成最终的顶级结构，并且我们提供了全局控制器（如 OrbitControls）以及模型节点覆写（Overrides）这两类典型高级功能的扩展定义参考。

```typescript
/**
 * 🌟 完整的 Forge 场景 JSON 协议结构
 */
export interface ForgeSceneJSON {
  metadata: ForgeMetadata;
  project: ForgeProject;
  settings: ForgeSettings;
  scene: ForgeSceneNode;
  assets: ForgeAssets;
  extensions?: ForgeExtensions;
}

/**
 * ------------------------------------------------------------------------
 * 典型内置扩展类型定义参考
 * ------------------------------------------------------------------------
 */

/**
 * [扩展] 全局控制器配置 
 * 存储于: JSON根级 `extensions.Forge_Controls`
 */
export interface ForgeControlsExtension {
  type: 'OrbitControls' | 'FirstPersonControls' | 'TrackballControls';
  target: [number, number, number];
  enableDamping?: boolean;
  dampingFactor?: number;
  maxDistance?: number;
}

/**
 * [扩展] 外部模型覆写 (Overrides) 配置
 * 存储于: SceneNode 级别 `extensions.Forge_ModelReference`
 */
export interface ForgeModelReferenceExtension {
  /** 指向 assets.models 中定义的外部模型 UUID */
  assetUuid: string;
  /** 
   * 模型内部节点覆写规则
   * Key: 内部节点名字或层级路径 (如: "RootNode/Body/Shell")
   * Value: 覆写属性
   */
  overrides?: Record<string, Partial<Pick<ForgeSceneNode, 'matrix' | 'material' | 'visible' | 'extensions'>>>;
}
```

**ForgeSceneJSON (根结构) 属性说明**

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `metadata` | `ForgeMetadata` | 协议级元数据。 |
| `project` | `ForgeProject` | 项目级基础信息。 |
| `settings` | `ForgeSettings` | 全局基础运行配置。 |
| `scene` | `ForgeSceneNode` | 场景节点树的根节点（入口）。 |
| `assets` | `ForgeAssets` | 场景引用的资产库字典。 |
| `extensions` | `ForgeExtensions` (可选) | 全局维度的插件数据（如环境光效、控制器等）。 |

**典型插件扩展示例说明**

| 扩展类型 | 存储层级 | 说明 |
| :--- | :--- | :--- |
| `ForgeControlsExtension` | 全局 (`JSON.extensions`) | 记录运行时的摄像机交互控制器（如 `OrbitControls`）及阻尼参数。 |
| `ForgeModelReferenceExtension` | 节点 (`Node.extensions`) | 记录外部模型引用时的差异化“覆写规则”（覆盖特定子部件的材质、矩阵等）。 |
