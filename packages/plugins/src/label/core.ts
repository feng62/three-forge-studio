import * as THREE from 'three';
import { resolvePath } from '@forge/utils';
import { HtmlLabel, LabelManager } from './HtmlLabelSystem';
import type { LabelPluginState, LabelObject } from './types';
import { createApp } from 'vue/dist/vue.esm-bundler.js'; // Use the bundler version to include compiler

export const LabelCorePlugin = {
  name: 'Forge_Label_Core',
  engine: null as any,
  pluginState: { labels: [] } as LabelPluginState,
  
  labelManager: null as LabelManager | null,
  activeLabels: new Map<string, HtmlLabel>(),
  activeVueApps: new Map<string, any>(), // Track mounted Vue apps
  
  _animationFrameId: null as number | null,
  
  // Callback registry
  callbacks: {} as Record<string, Function[]>,

  onInstall(core: any) {
    this.engine = core;
    console.log("Label Core Plugin Installed");
    
    this._onSceneLoaded = () => {
      if (this.engine.scene && this.engine.scene.userData.labels) {
        this.pluginState = this.engine.scene.userData.labels;
      } else {
        this.pluginState = { labels: [] };
      }
      this.refreshLabels();
    };
    
    this.engine.addEventListener('json-load-complete', this._onSceneLoaded);
  },

  onMount(core: any) {
    if (!this.labelManager) {
      this.labelManager = new LabelManager(core);
    }
    
    if (this.engine.scene && this.engine.scene.userData.labels) {
      this.pluginState = this.engine.scene.userData.labels;
    }
    this.refreshLabels();
    
    // Start local animation loop for environments that don't call tick (e.g., EditorEngine)
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
    }
    
    const loop = () => {
      this.tick(0);
      this._animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  },

  onUnmount() {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    
    if (this.engine) {
      if (this._onSceneLoaded) {
        this.engine.removeEventListener('json-load-complete', this._onSceneLoaded);
      }
    }
    if (this.labelManager) {
      this.labelManager.dispose();
      this.labelManager = null;
    }
    this.activeLabels.clear();
    
    for (const app of this.activeVueApps.values()) {
      app.unmount();
    }
    this.activeVueApps.clear();
  },

  setState(newState: LabelPluginState) {
    this.pluginState = newState;
    this.refreshLabels();
  },

  refreshLabels() {
    if (!this.engine || !this.labelManager) return;
    
    const currentIds = new Set(this.pluginState.labels.map(l => l.id));
    
    // Remove deleted labels
    for (const [id, htmlLabel] of this.activeLabels.entries()) {
      if (!currentIds.has(id)) {
        this.labelManager.remove(htmlLabel);
        this.activeLabels.delete(id);
        
        if (this.activeVueApps.has(id)) {
          this.activeVueApps.get(id).unmount();
          this.activeVueApps.delete(id);
        }
      }
    }
    
    // Add or Update labels
    for (const labelDef of this.pluginState.labels) {
      let htmlLabel = this.activeLabels.get(labelDef.id);
      
      const shouldRecreate = !htmlLabel || (htmlLabel.element.getAttribute('data-code') !== labelDef.code) || (htmlLabel.element.getAttribute('data-render-type') !== labelDef.renderType);
      
      if (shouldRecreate) {
        if (htmlLabel) {
          this.labelManager.remove(htmlLabel);
          if (this.activeVueApps.has(labelDef.id)) {
            this.activeVueApps.get(labelDef.id).unmount();
            this.activeVueApps.delete(labelDef.id);
          }
        }
        
        const div = document.createElement('div');
        div.className = 'forge-label-container';
        div.setAttribute('data-code', labelDef.code);
        div.setAttribute('data-render-type', labelDef.renderType);
        
        // Prepare _data context
        const dataContext: any = { model: null, ...(labelDef._data || {}) };
        if (labelDef.targetType === 'model' && labelDef.targetModelUuid) {
          const targetObj = this.engine.scene.getObjectByProperty('uuid', labelDef.targetModelUuid);
          if (targetObj) {
            dataContext.model = {
              uuid: targetObj.uuid,
              name: targetObj.name,
              type: targetObj.type,
              userData: targetObj.userData
            };
          }
        }
        
        if (labelDef.renderType === 'vue') {
          // Vue runtime compilation
          try {
            const app = createApp({
              template: labelDef.code,
              setup() {
                return dataContext; // dataContext already has model
              }
            });
            app.mount(div);
            this.activeVueApps.set(labelDef.id, app);
          } catch (e) {
            console.error("Vue compilation error in label", e);
            div.innerHTML = `<div style="color:red;background:black;padding:4px">Vue Error</div>`;
          }
        } else {
          div.innerHTML = labelDef.code;
        }
        
        htmlLabel = new HtmlLabel(div, {
          anchor: labelDef.anchor,
          pointerEvents: 'auto',
          zIndexRange: [9999, 0] // Ensure it doesn't overlap editor UI
        });
        
        this.labelManager.add(htmlLabel);
        this.activeLabels.set(labelDef.id, htmlLabel);
      } else if (htmlLabel) {
        // Just update anchor without recreating element
        htmlLabel.options.anchor = labelDef.anchor;
      }
      
      // Update visibility and dispatch callbacks
      const wasVisible = htmlLabel.element.style.display !== 'none';
      const isVisible = !!labelDef.visible;
      
      htmlLabel.element.style.display = isVisible ? 'block' : 'none';
      
      if (!wasVisible && isVisible) {
        this.emit('plugin:LabelPlugin-show', { id: labelDef.id, label: labelDef });
        this.engine.dispatchEvent({ type: 'plugin:LabelPlugin-show', detail: { id: labelDef.id } });
      } else if (wasVisible && !isVisible) {
        this.emit('plugin:LabelPlugin-hide', { id: labelDef.id, label: labelDef });
        this.engine.dispatchEvent({ type: 'plugin:LabelPlugin-hide', detail: { id: labelDef.id } });
      }
      
      // Bind to 3D object
      this.bindLabelToTarget(htmlLabel, labelDef);
    }
  },

  bindLabelToTarget(htmlLabel: HtmlLabel, labelDef: LabelObject) {
    if (labelDef.targetType === 'coordinate') {
      const [x, y, z] = labelDef.targetPosition;
      const [ox, oy, oz] = labelDef.offset;
      
      if (htmlLabel.group.parent !== this.engine.scene) {
        this.engine.scene.add(htmlLabel.group);
      }
      
      htmlLabel.position(x + ox, y + oy, z + oz);
    } else if (labelDef.targetType === 'model') {
      const uuid = labelDef.targetModelUuid;
      let targetObj = this.engine.scene.getObjectByProperty('uuid', uuid);
      
      if (targetObj && labelDef.targetModelPath) {
        const childObj = resolvePath(targetObj, labelDef.targetModelPath);
        if (childObj) {
          targetObj = childObj;
        }
      }
      
      if (targetObj) {
        if (htmlLabel.group.parent !== targetObj) {
          targetObj.add(htmlLabel.group);
        }
        
        const box = new THREE.Box3().setFromObject(targetObj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        targetObj.worldToLocal(center);
        
        const [ox, oy, oz] = labelDef.offset;
        htmlLabel.position(center.x + ox, center.y + oy, center.z + oz);
      } else {
        if (htmlLabel.group.parent !== this.engine.scene) {
          this.engine.scene.add(htmlLabel.group);
        }
        htmlLabel.position(0, 0, 0);
      }
    }
  },

  tick(delta: number) {
    if (this.labelManager) {
      this.labelManager.update();
    }
  },
  
  // ---- Developer APIs ----
  
  /**
   * 注册回调函数
   */
  on(eventName: string, callback: Function) {
    if (!this.callbacks[eventName]) {
      this.callbacks[eventName] = [];
    }
    this.callbacks[eventName].push(callback);
  },
  
  emit(eventName: string, data: any) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].forEach(cb => cb(data));
    }
  },
  
  /**
   * 获取所有标签列表
   */
  getLabels(): LabelObject[] {
    return this.pluginState.labels;
  },
  
  /**
   * 获取指定标签状态
   */
  getLabelState(id: string): LabelObject | undefined {
    return this.pluginState.labels.find(l => l.id === id);
  },
  
  /**
   * 运行时设置标签显示/隐藏
   */
  setLabelVisible(id: string, visible: boolean) {
    const labelDef = this.pluginState.labels.find(l => l.id === id);
    if (labelDef) {
      labelDef.visible = visible;
      this.refreshLabels();
    }
  }
};
