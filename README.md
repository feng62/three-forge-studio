# Three Forge Studio

**Three Forge Studio** 是一个采用“生与产解耦”架构设计的现代 3D 可视化编辑器与高性能渲染引擎。

## 🌟 项目简介

本项目旨在解决传统 3D 编辑器中“编辑态代码”与“运行态代码”严重耦合导致产物体积臃肿、性能低下、难以维护的痛点。
我们将整个系统划分为两个平行的宇宙：

- **`@forge/editor` (生产者)**：基于 Vue 3 + Element Plus 构建的全功能 3D 可视化 IDE。提供极致的开发者体验（DX），负责场景搭建、交互编辑，并最终导出一份标准的 JSON 场景数据。
- **`@forge/core` (消费者)**：极度轻量化的 Vanilla TypeScript 运行时渲染引擎。零外部依赖（仅依赖 Three.js），专为高性能业务大屏设计，通过解析 Editor 导出的 JSON 数据完美还原 3D 场景。

## 🏗️ 核心架构特点

1. **生与产彻底分离**：Editor 负责生产，Core 负责消费，两者完全独立，互不干涉。
2. **统一的 JSON 场景协议**：两个宇宙之间通过严格的 JSON 扩展协议（Extensions）进行数据流转。
3. **零依赖的插件系统 (Dual-Universe Plugin)**：插件同样采用双生设计（如 `@forge/plugin-physics/editor` 和 `@forge/plugin-physics/core`）。Core 端的插件基座采用基于 Vite/Rollup 风格的极简纯对象 Hook 机制，保持极致轻量。
4. **Monorepo 工程化**：基于 pnpm 和 Turborepo 构建，天然支持多包共存与本地依赖。

## 🚀 目录结构

- `apps/demo/`：全链路演示沙箱，集成编辑器与预览环境。
- `apps/docs/`：基于 VitePress 构建的官方设计文档与指南。
- `packages/editor/`：生产环境的 3D IDE 源码。
- `packages/core/`：轻量级运行时渲染引擎源码。
- `packages/utils/`：与视图无关的公共计算函数库。
- `packages/types/`：定义 JSON 协议与全栈 TypeScript 接口。
- `plugins/`：官方维护的双生插件库（物理引擎、泛光特效等）。
