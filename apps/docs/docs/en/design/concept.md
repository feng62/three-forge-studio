# Design Philosophy

The core design philosophy of Forge Studio is **simplicity** while maintaining **high extensibility**.

## 1. Why Start From Scratch?

As 3D Web applications become increasingly complex, we found that existing solutions often struggle to balance "out-of-the-box" readiness with "deep customization." Therefore, we decided to design Forge Studio from the ground up.

## 2. Core Principles

- **Architecture First**: Adopting a Monorepo and component-based design ensures that every layer of logic can be decoupled and independently tested.
- **Embrace Modern Ecosystem**: Deeply integrated with Vue 3's reactivity system and Vite's ultra-fast build capabilities.
- **Developer Experience (DX)**: Providing excellent type inference (TypeScript) and developer-friendly debugging tools.
- **Future Proof**: Preserving enough flexibility in the underlying rendering engine abstraction to support advanced WebGPU features in the future.

> "Good architecture is not designed; it evolves. But a good starting point makes the path of evolution much smoother."
