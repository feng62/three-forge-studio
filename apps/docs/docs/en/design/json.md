# JSON Protocol Design

The JSON protocol is the sole communication bridge between `@forge/editor` (Producer) and `@forge/core` (Consumer). To ensure seamless collaboration between these two parallel universes, we designed a strict and extensible JSON Schema standard.

## Design Goals

1. **Complete Decoupling**: The editor focuses only on exporting, while the renderer focuses only on parsing.
2. **Extreme Lightweight**: Eliminates irrelevant fields, keeping only the data structures essential for rendering the scene.
3. **High Extensibility**: Supports fast extension of custom data by official plugins and third-party businesses.
4. **Three.js Compatibility**: Structurally consistent with Three.js's Object3D tree structure to minimize parsing overhead.

## Protocol Structure

A complete scene JSON file mainly consists of the following sections:

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

### 1. Metadata & Project
Records metadata of the scene file and basic project configurations, such as the generator version and creation time.

### 2. Scene (Scene Tree)
Adopts a recursive tree structure to describe all nodes in the scene. Includes:
- `uuid`: Unique identifier of the node.
- `type`: Node type (e.g., `Mesh`, `PointLight`, `Group`).
- `matrix`: Local transformation matrix of the node.
- `geometry`: Referenced geometry UUID.
- `material`: Referenced material UUID.
- `children`: List of child nodes.

### 3. Assets (Asset Library)
To avoid redundant resource configurations in the scene tree, we centralize geometries, materials, and textures in the `assets` object. Nodes in the scene tree reference them via `uuid`.
This design reduces the JSON size and enables the Asset Manager in the `@forge/core` layer to efficiently cache and deduplicate resources.

### 4. Extensions (Plugin Data)
The plugin system is a critical part of the JSON protocol. Any data that does not belong to standard Three.js core properties (such as physics engine properties, post-processing bloom, or complex business metadata) should be stored in the `extensions` field.

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

## Serialization and Deserialization

- **Serialization (Editor)**: During export, the editor traverses its internal scene tree, extracts necessary properties, and invokes plugin hooks to write extension data into `extensions`.
- **Deserialization (Core)**: The core runtime parses the basic tree structure to reconstruct `Object3D` instances, then triggers parsing hooks for each plugin to convert data in `extensions` into runtime logic.

## Complete TypeScript Definitions Reference

Based on the protocol structure and the support for advanced features like camera controllers and external model overrides, the complete TypeScript interfaces are provided below for reference during development:

### 1. Basic Info & Metadata

Describes the version, generator, and project-level business data of the scene.

```typescript
/**
 * Scene Metadata
 */
export interface ForgeMetadata {
  /** Protocol version for backward compatibility */
  version: string;
  /** Generator name, e.g., "ThreeForgeStudio" */
  generator: string;
}

/**
 * Basic Business/Project Info
 */
export interface ForgeProject {
  name: string;
  createdAt: number;
  updatedAt?: number;
}
```

**ForgeMetadata Properties**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `version` | `string` | Protocol version number for backward compatibility during parsing. |
| `generator` | `string` | Generator identifier, e.g., `"ThreeForgeStudio"`. |

**ForgeProject Properties**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Name of the current business project. |
| `createdAt` | `number` | Project creation timestamp. |
| `updatedAt` | `number` (Optional) | Project's last updated timestamp. |

### 2. Global Settings & Extensions Carrier

`Settings` define the default behaviors (like active camera) when the Core engine boots up. `ForgeExtensions` is the data container used for plugins at both the global and node levels.

```typescript
/**
 * Global Settings
 * Determines default behaviors when Core engine boots up
 */
export interface ForgeSettings {
  /** UUID of the active main camera */
  activeCamera?: string;
  /** Global background color or environment map UUID (Optional) */
  background?: string;
  /** Ambient HDR environment map UUID (Optional) */
  environment?: string;
}

/**
 * Carrier for arbitrary plugin extension data
 */
export type ForgeExtensions = Record<string, any>;
```

**ForgeSettings Properties**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `activeCamera` | `string` (Optional) | UUID of the currently active main camera. Core engine uses this for initial rendering. |
| `background` | `string` (Optional) | Color value for the global background or UUID of an environment map asset. |
| `environment` | `string` (Optional) | UUID of the global ambient HDR environment map asset used for PBR. |

**ForgeExtensions Properties**

| Type | Description |
| :--- | :--- |
| `Record<string, any>` | A dynamic key-value container. The key must be a unique plugin namespace (e.g., `Forge_Physics`), and the value is any custom data object defined by the plugin. |

### 3. Assets Library Definition

To avoid data redundancy, all geometries, materials, textures, and external model URLs are centrally extracted to `assets` for unified caching.

```typescript
/**
 * Assets Library for centralized management and deduplication
 */
export interface ForgeAssets {
  geometries?: any[];
  materials?: any[];
  textures?: any[];
  /** External model references (e.g., GLB, FBX) */
  models?: Array<{
    uuid: string;
    url: string;
    format: string;
  }>;
  [key: string]: any;
}
```

**ForgeAssets Properties**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `geometries` | `any[]` (Optional) | List of all native geometries used in the scene, deduplicated by UUID. |
| `materials` | `any[]` (Optional) | List of all native materials used in the scene, deduplicated by UUID. |
| `textures` | `any[]` (Optional) | List of all textures used in the scene, deduplicated by UUID. |
| `models` | `Array<{...}>` (Optional) | Records pointing to external model resources (like `.glb`, `.fbx`). |
| `[key: string]`| `any` | Allows for future expansion of other global asset libraries (like fonts or shader scripts). |

### 4. Scene Node Definition

Derived and simplified from the Three.js Object3D tree. Uses a matrix to record spatial transformations and UUIDs to reference assets.

```typescript
/**
 * Definition for a single node in the scene tree
 */
export interface ForgeSceneNode {
  uuid: string;
  name?: string;
  type: string;
  
  /** Local transform matrix (16-float array), compressing position, rotation, and scale */
  matrix: number[];
  
  visible?: boolean;
  layers?: number;
  
  /** Camera specific properties */
  fov?: number;
  near?: number;
  far?: number;

  /** References for Mesh assets */
  geometry?: string;
  material?: string | string[];

  /** Custom plugin extension data attached to this node */
  extensions?: ForgeExtensions;

  /** Reserved for standard business user data not handled by plugins */
  userData?: Record<string, any>;

  /** List of child nodes (recursive) */
  children?: ForgeSceneNode[];
}
```

**ForgeSceneNode Properties**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `uuid` | `string` | Global unique identifier of the node. |
| `name` | `string` (Optional) | Readable name of the node in the scene tree. |
| `type` | `string` | Corresponds to the Three.js object type (e.g., `Scene`, `Mesh`, `Group`, `PerspectiveCamera`). |
| `matrix` | `number[]` | 16-element float array representing the local transform matrix (compresses position, rotation, scale). |
| `visible` | `boolean` (Optional) | Controls the visibility of the node and its children. |
| `layers` | `number` (Optional) | Three.js render layer mask. |
| `fov`, `near`, `far` | `number` (Optional) | Projection parameters specific to cameras. |
| `geometry` | `string` (Optional) | UUID of the referenced geometry (must exist in `assets.geometries`). |
| `material` | `string` \| `string[]` (Optional) | UUID of the referenced material (must exist in `assets.materials`). |
| `extensions` | `ForgeExtensions` (Optional) | Specific plugin data attached to this node (e.g., override rules, rigid body components). |
| `userData` | `Record<string, any>` (Optional) | Reserved for general custom data from external business systems. |
| `children` | `ForgeSceneNode[]` (Optional) | Recursive list of child nodes. |

### 5. Root Protocol & Typical Plugin Extensions

Assembles all the above modules into the final top-level structure. Also provides reference extensions for advanced features like global controllers (e.g., OrbitControls) and inner model node overrides.

```typescript
/**
 * 🌟 Complete Forge Scene JSON Protocol Structure
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
 * Typical Built-in Extension Type References
 * ------------------------------------------------------------------------
 */

/**
 * [Extension] Global Controller Configuration 
 * Stored at: JSON Root `extensions.Forge_Controls`
 */
export interface ForgeControlsExtension {
  type: 'OrbitControls' | 'FirstPersonControls' | 'TrackballControls';
  target: [number, number, number];
  enableDamping?: boolean;
  dampingFactor?: number;
  maxDistance?: number;
}

/**
 * [Extension] External Model Overrides Configuration
 * Stored at: SceneNode Level `extensions.Forge_ModelReference`
 */
export interface ForgeModelReferenceExtension {
  /** Points to external model UUID defined in assets.models */
  assetUuid: string;
  /** 
   * Override rules for inner model nodes
   * Key: Inner node name or path (e.g., "RootNode/Body/Shell")
   * Value: Properties to override
   */
  overrides?: Record<string, Partial<Pick<ForgeSceneNode, 'matrix' | 'material' | 'visible' | 'extensions'>>>;
}
```

**ForgeSceneJSON (Root Structure) Properties**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `metadata` | `ForgeMetadata` | Protocol-level metadata. |
| `project` | `ForgeProject` | Project-level basic info. |
| `settings` | `ForgeSettings` | Global runtime base configuration. |
| `scene` | `ForgeSceneNode` | Root node of the scene tree (entry point). |
| `assets` | `ForgeAssets` | Dictionary of assets referenced by the scene. |
| `extensions` | `ForgeExtensions` (Optional) | Global dimensional plugin data (like environment light effects, controllers, etc.). |

**Typical Plugin Extensions Examples**

| Extension Type | Storage Level | Description |
| :--- | :--- | :--- |
| `ForgeControlsExtension` | Global (`JSON.extensions`) | Records runtime camera interaction controllers (e.g., `OrbitControls`) and damping parameters. |
| `ForgeModelReferenceExtension` | Node (`Node.extensions`) | Records differential "override rules" (overwriting material, matrix, etc. of specific subcomponents) when an external model is referenced. |
