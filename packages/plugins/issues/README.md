# 常见问题与知识库目录 (Issues & FAQ)

这是一个专门用于记录开发过程中容易出现的问题、原理说明以及知识沉淀的目录。

## 目录索引

- [节点数据输入口的回退（Fallback）机制](./node-input-fallback/node-input-fallback.md)
  - **描述**：说明如何在 Rete.js v2 中实现“如果有连线则使用连线的值，如果没有连线则使用默认控件值”的功能，以及其底层重点逻辑。
  - **相关文件**：`visual-logic/engine/nodes` 及各个具体插件节点实现。

- [TypeScript 严格类型检查问题记录](./typescript-strict-checks/typescript-strict-checks.md)
  - **描述**：记录关于 TS 控制流丢失、第三方库宽泛类型返回（ModuleExport 为 null 等）、以及接口可选属性和实际强类型（如 boolean | undefined -> boolean）引发的常见报错类型（TS2345, TS2322, TS2339），并提供强制转换和安全降级方案。
  - **相关文件**：`label/core.ts` 及各强类型底层模块。
