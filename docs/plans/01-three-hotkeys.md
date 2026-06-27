# Plan: Three.js Integration & Hotkey Manager

## Overview
Initialize the highly decoupled Three.js engine and set up the global hotkey manager using Pinia for state management. This architecture separates the View (Vue), State (Pinia), Input (Hotkeys), and Engine (Three.js).

## Step 1 — Setup Editor State (Pinia)
**Intent**: Create a Pinia store in `@forge/editor` to hold the current active transform mode (`select`, `translate`, `rotate`, `scale`). This acts as the single source of truth for both the UI and the Three.js engine.
**Tags**: impl
- Create `packages/editor/src/stores/transformStore.ts`.
- Expose state `activeMode` and an action `setTransformMode(mode)`.

## Step 2 — Implement Hotkey Manager
**Intent**: Integrate `hotkeys-js` into the editor. Bind `g` (translate), `r` (rotate), `s` (scale), and `Space` (select) to mutate the Pinia store.
**Tags**: impl
- Create `packages/editor/src/managers/ShortcutManager.ts`.
- Map the keys `g`, `r`, `s`, and `space` to call `transformStore.setTransformMode()`.
- Initialize this manager in the `EditorLayout.vue` or app root.

## Step 3 — Scaffold Decoupled Three.js Core
**Intent**: Add `three` to `packages/core` and set up an object-oriented, framework-agnostic Engine class.
**Tags**: impl, design
- Add `three` and `@types/three` dependencies to `packages/core`.
- Create `packages/core/src/engine/Engine.ts` with basic setup (Scene, Camera, WebGLRenderer, requestAnimationFrame loop).
- Ensure it exposes a `mount(container: HTMLElement)` method.
- Out of scope: Complex scene serialization.

## Step 4 — Bridge Three.js with Editor Viewport
**Intent**: Mount the `Engine` inside `Viewport.vue` and sync the Pinia transform state to the Engine's `TransformControls` (using `three-viewport-gizmo` or standard controls later).
**Tags**: impl
- In `Viewport.vue`, get a template ref to a container `div`.
- Instantiate `Engine` and call `.mount()`.
- Watch `transformStore.activeMode` and push the state down into the `Engine` via an API like `engine.setTransformMode(mode)`.
