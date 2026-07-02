import * as THREE from 'three';
import { resolvePath } from '@forge/utils';
import type { InteractionPluginState, ModelReference, SupportedEvent } from './types';

/**
 * 鼠标交互事件核心控制插件
 * 负责绑定渲染画布的 DOM 事件，并在触发时使用射线检测来判定目标物体
 */
export const InteractionCorePlugin = {
  name: 'Forge_Interaction_Core',
  
  /** 三维引擎实例引用 */
  engine: null as any,
  
  /** 插件的核心响应式状态 */
  pluginState: { events: {} } as InteractionPluginState,
  
  /** 缓存所有当前绑定的回调，以便清理 */
  boundListeners: {} as Record<string, EventListener>,
  
  /** 共享的射线投射器与鼠标位置对象 */
  raycaster: new THREE.Raycaster(),
  mouseNDC: new THREE.Vector2(),

  /** 记录上一次 hover 的对象，用于计算 pointerenter 和 pointerleave */
  lastHoveredTarget: null as THREE.Object3D | null,
  
  /** 记录等待节流执行的悬停目标 */
  pendingHoverTarget: null as THREE.Object3D | null,
  hoverTimeout: null as any,

  /**
   * 插件挂载时的初始化回调
   * @param core 传入的三维引擎 Engine 实例
   */
  onInstall(core: any) {
    this.engine = core;
    console.log("Interaction Core Plugin Installed");
    this.refreshListeners();
  },

  /**
   * 外部或 Editor 插件用于更新状态的入口
   * @param newState 新的事件配置状态
   */
  setState(newState: InteractionPluginState) {
    this.pluginState = newState;
    this.refreshListeners();
  },

  /**
   * 动态刷新监听器：根据当前的 events 配置绑定或解绑 DOM 事件
   */
  refreshListeners() {
    if (!this.engine || !this.engine.renderer) return;
    
    const canvas = this.engine.renderer.domElement;
    const requiredEvents = Object.keys(this.pluginState.events);
    
    // 计算需要绑定在 canvas 上的原生 DOM 事件
    const nativeEventsToBind = new Set(requiredEvents);
    // 移入移出是根据 pointermove 计算出来的衍生事件
    if (nativeEventsToBind.has('pointerenter') || nativeEventsToBind.has('pointerleave')) {
      nativeEventsToBind.add('pointermove');
      nativeEventsToBind.delete('pointerenter');
      nativeEventsToBind.delete('pointerleave');
    }

    // 移除已经不需要的事件
    for (const eventName in this.boundListeners) {
      if (!nativeEventsToBind.has(eventName)) {
        canvas.removeEventListener(eventName, this.boundListeners[eventName]);
        delete this.boundListeners[eventName];
      }
    }
    
    // 绑定新的事件
    for (const eventName of nativeEventsToBind) {
      if (!this.boundListeners[eventName]) {
        let handler = (e: Event) => this.handleMouseEvent(e as MouseEvent, eventName as SupportedEvent);
        
        // 为 pointermove 加上节流处理 (50ms 约 20fps)，避免移入移出计算过于频繁
        if (eventName === 'pointermove') {
          handler = this.throttle((e: Event) => this.handleMouseEvent(e as MouseEvent, 'pointermove'), 50);
        }
        
        this.boundListeners[eventName] = handler;
        canvas.addEventListener(eventName, handler);
      }
    }
  },

  /**
   * 简单的节流函数，保障性能
   */
  throttle(func: Function, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let previous = 0;
    return function(this: any, ...args: any[]) {
      const now = Date.now();
      const remaining = wait - (now - previous);
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  },

  /**
   * 处理画布鼠标事件的核心逻辑
   */
  handleMouseEvent(e: MouseEvent, eventType: string) {
    if (!this.engine || !this.engine.scene || !this.engine.camera) return;

    // 如果是原生的 pointermove，我们需要同时为 move, enter, leave 准备参与检测的模型引用
    const eventTypesToCheck = eventType === 'pointermove' 
      ? ['pointermove', 'pointerenter', 'pointerleave'] 
      : [eventType];

    const activeRefs: ModelReference[] = [];
    const refToEventTypes = new Map<ModelReference, Set<string>>();

    for (const ev of eventTypesToCheck) {
      const refs = this.pluginState.events[ev];
      if (refs) {
        for (const ref of refs) {
          activeRefs.push(ref);
          if (!refToEventTypes.has(ref)) {
            refToEventTypes.set(ref, new Set());
          }
          refToEventTypes.get(ref)!.add(ev);
        }
      }
    }

    // 如果此时没有任何参与检测的引用，清空可能的悬停状态并退出
    if (activeRefs.length === 0) {
      if (eventType === 'pointermove' && this.lastHoveredTarget) {
        this.triggerLeave(e);
      }
      return;
    }

    // 1. 获取鼠标在 Canvas 上的 NDC 归一化坐标
    const canvas = this.engine.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // 2. 根据 activeRefs 解析出要参与射线检测的目标对象数组
    const targetObjects: THREE.Object3D[] = [];
    const objToRefMap = new Map<THREE.Object3D, ModelReference>();
    
    for (const ref of activeRefs) {
      const rootObj = this.engine.scene.getObjectByProperty('uuid', ref.uuid);
      if (!rootObj) continue;

      if (ref.path) {
        const childObj = resolvePath(rootObj, ref.path);
        if (childObj && !targetObjects.includes(childObj)) {
          targetObjects.push(childObj);
          objToRefMap.set(childObj, ref);
        }
      } else {
        if (!targetObjects.includes(rootObj)) {
          targetObjects.push(rootObj);
          objToRefMap.set(rootObj, ref);
        }
      }
    }

    if (targetObjects.length === 0) {
      if (eventType === 'pointermove' && this.lastHoveredTarget) {
        this.triggerLeave(e);
      }
      return;
    }

    // 3. 靶向射线检测
    this.raycaster.setFromCamera(this.mouseNDC, this.engine.camera);
    let intersects = this.raycaster.intersectObjects(targetObjects, true);

    // 过滤掉不可见的物体
    intersects = intersects.filter(hit => {
      let visible = true;
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (!curr.visible) {
          visible = false;
          break;
        }
        curr = curr.parent;
      }
      return visible;
    });

    let hitTarget: THREE.Object3D | null = null;
    let firstHit: THREE.Intersection | null = null;

    if (intersects.length > 0) {
      firstHit = intersects[0];
      let current: THREE.Object3D | null = firstHit.object;
      while (current) {
        if (targetObjects.includes(current)) {
          hitTarget = current;
          break;
        }
        current = current.parent;
      }
      if (!hitTarget) hitTarget = firstHit.object;
    }

    // 4. 计算并分发事件
    
    // a. 处理衍生的 pointerenter 和 pointerleave
    if (eventType === 'pointermove') {
      if (hitTarget !== this.pendingHoverTarget) {
        if (this.hoverTimeout) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
        }
        
        this.pendingHoverTarget = hitTarget;
        
        // 加上节流/防抖 (50ms)，避免鼠标快速划过时触发大量无用移入移出
        this.hoverTimeout = setTimeout(() => {
          if (hitTarget !== this.lastHoveredTarget) {
            // 1. 如果之前有 hover 的对象，触发它的离开事件
            if (this.lastHoveredTarget) {
              this.triggerLeave(e);
            }
            // 2. 如果现在 hit 到了新对象，触发它的进入事件
            if (hitTarget) {
              const ref = objToRefMap.get(hitTarget);
              if (ref && refToEventTypes.get(ref)?.has('pointerenter')) {
                this.dispatchInteraction('pointerenter', hitTarget, firstHit!, ref, e);
              }
            }
            this.lastHoveredTarget = hitTarget;
          }
        }, 50);
      }
    }

    // b. 分发当前的常规原生事件 (包括 move 本身，click, dblclick, pointerdown 等)
    if (hitTarget) {
      const ref = objToRefMap.get(hitTarget);
      if (ref && refToEventTypes.get(ref)?.has(eventType)) {
        this.dispatchInteraction(eventType as SupportedEvent, hitTarget, firstHit!, ref, e);
      }
    }
  },

  /**
   * 触发移出事件
   */
  triggerLeave(originalEvent: MouseEvent) {
    if (!this.lastHoveredTarget) return;
    
    // 找出到底哪个 ref 绑定了这个 leave 事件
    const leaveRefs = this.pluginState.events['pointerleave'];
    if (leaveRefs) {
      for (const ref of leaveRefs) {
        const rootObj = this.engine.scene.getObjectByProperty('uuid', ref.uuid);
        if (rootObj) {
          let expectedObj = rootObj;
          if (ref.path) {
            const childObj = resolvePath(rootObj, ref.path);
            if (childObj) expectedObj = childObj;
          }
          if (expectedObj === this.lastHoveredTarget) {
            this.dispatchInteraction('pointerleave', this.lastHoveredTarget, null, ref, originalEvent);
            break;
          }
        }
      }
    }
    this.lastHoveredTarget = null;
  },

  /**
   * 统一派发自定义插件事件
   */
  dispatchInteraction(
    eventType: SupportedEvent, 
    object: THREE.Object3D, 
    hit: THREE.Intersection | null, 
    ref: ModelReference, 
    originalEvent: MouseEvent
  ) {
    this.engine.dispatchEvent({
      type: 'plugin:interaction-trigger',
      eventType: eventType,
      object: object,
      intersectedMesh: hit ? hit.object : null,
      ref: ref,
      point: hit ? hit.point : null,
      face: hit ? hit.face : null,
      originalEvent: originalEvent
    });
  }
};

