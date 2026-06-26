# 插件系统设计 (Plugin System)

在“生与产分离”的系统架构下，为了保持核心（Core）的极度纯净与轻量化，同时赋予系统无限的垂直领域扩展能力，我们设计了这套**零依赖的双生插件体系**。

## 1. 底层基座：Vite 风格的极简架构 (Zero-Dependency)

在插件基座的技术选型上，我们坚决**不引入任何第三方插件库（如 Tapable）**，而是采用类似 **Vite / Rollup 风格的极简纯对象 Hook 机制**。

在这个设计下，插件本质上就是一个包含了特定生命周期函数的普通 JavaScript 对象。这种“大道至简”的设计带来了三大优势：

1. **绝对的零依赖**：`@forge/core` 能够保持极其纯净（除 `three.js` 外零生产依赖），这对其独立开源和嵌入其他系统是巨大优势。
2. **极佳的调试体验**：没有复杂的动态编译代码，如果渲染循环报错，调用栈（Call Stack）一目了然。
3. **性能与够用**：对于 3D 渲染，一个极其简单的对象数组遍历（如 `plugins.forEach(p => p.onBeforeRender?.())`）在性能和满足度上完全足够。

## 2. 核心理念：双生插件体系 (Dual-Universe)

由于我们的系统存在于两个平行的宇宙（`@forge/editor` 和 `@forge/core`），一个完整的插件也必须是“双面”的。

以“泛光特效”插件（`@forge/plugin-bloom`）为例，它必须包含两个维度的实现：

1. **`PluginEditor` (编辑态注入)**
   - **挂载点**：注入到 `@forge/editor` 中。
   - **职责**：注册属性面板的 UI（如：强度滑块）、处理交互输入。
   - **产出**：将参数实时写入到场景 JSON 中。

2. **`PluginCore` (运行态注入)**
   - **挂载点**：注入到 `@forge/core` 中。
   - **职责**：读取 JSON 参数，在核心渲染循环中注入后处理逻辑（如 `UnrealBloomPass`）。
   - **要求**：绝不能包含任何 Vue/DOM UI 代码，确保可以被完美 Tree-shaking。

## 3. 插件工程目录结构

官方内置插件和核心模块一样，作为独立的 npm 包存放在 Monorepo 项目的 `plugins/` 目录下统一管理。

```text
three-forge-studio/
├── apps/
├── packages/
│   ├── editor/
│   ├── core/
│   └── utils/
└── plugins/                       # 【官方插件集合】
    ├── physics/                   # 物理引擎插件包 (@forge/plugin-physics)
    │   ├── package.json
    │   ├── src/editor/            # 暴露给 Editor 的逻辑与 Vue 组件
    │   └── src/core/              # 暴露给 Core 的渲染、物理步进解析逻辑
    ├── bloom/                     # 泛光特效插件包 (@forge/plugin-bloom)
    └── transform-controls/        # 坐标轴工具（也可抽离为插件）
```
*第三方社区插件则由业务方独立建包发布，安装方式与官方插件一致。*

## 4. 沟通桥梁：JSON Extensions 机制

分离成两半的插件如何通信？我们借鉴了 `glTF` 格式的经验，在 JSON 场景协议中引入了 **`extensions`（扩展字段）** 机制。

**数据流转示例：**
```json
{
  "version": "1.0.0",
  "extensions": {
    "Forge_Bloom_Plugin": {
      "enabled": true,
      "strength": 1.5
    }
  },
  "nodes": [
    {
      "id": "node_01",
      "extensions": {
        "Forge_Physics": { "mass": 1.5, "colliderType": "box" }
      }
    }
  ]
}
```
`@forge/editor` 负责把 UI 操作写入对应的 `extensions`，而 `@forge/core` 在解析时，对应的插件会去读取它并执行逻辑。

## 5. 开发与安装示例

### Core 端内部的极简调度器
```typescript
class ForgeCore {
  private plugins: ForgePlugin[] = [];

  use(plugin: ForgePlugin) {
    this.plugins.push(plugin);
    plugin.onInstall?.(this);
  }

  private tick(deltaTime: number) {
    // 渲染前钩子
    for (const plugin of this.plugins) {
      plugin.onBeforeRender?.(deltaTime);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
```

### 业务端安装示例
**Editor 端安装：**
```typescript
import { ForgeEditor } from '@forge/editor';
import { BloomEditorPlugin } from '@forge/plugin-bloom/editor';

const editor = new ForgeEditor('#editor-container');
editor.use(BloomEditorPlugin); // 安装带 UI 的插件
editor.start();
```

**Core 端安装：**
```typescript
import { ForgeCore } from '@forge/core';
import { BloomCorePlugin } from '@forge/plugin-bloom/core';

const core = new ForgeCore('#canvas-container');
core.use(BloomCorePlugin); // 安装极其轻量的运行时插件
core.loadJSON(sceneJson);
core.render();
```
