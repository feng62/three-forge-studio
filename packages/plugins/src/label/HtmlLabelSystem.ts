import * as THREE from 'three';

export type LabelAnchor = [number, number];

export interface HtmlLabelOptions {
  anchor?: LabelAnchor;
  pointerEvents?: 'auto' | 'none' | 'visible' | 'all';
  zIndexRange?: [number, number];
}

type RequiredHtmlLabelOptions = Required<HtmlLabelOptions>;

export class HtmlLabel {
  public element: HTMLElement;
  public options: RequiredHtmlLabelOptions;
  public group: THREE.Group;
  
  public previousPosition: THREE.Vector3 = new THREE.Vector3(-9999, -9999, -9999);

  constructor(contentElement: HTMLElement, options?: HtmlLabelOptions) {
    this.element = contentElement;
    
    this.options = {
      anchor: [0, 0],
      pointerEvents: 'auto',
      zIndexRange: [16777271, 0],
      ...options,
    };

    this.group = new THREE.Group();

    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = this.options.pointerEvents;
    
    const [anchorX, anchorY] = this.options.anchor;
    const offsetX = -50 - (anchorX / 2);
    const offsetY = -50 + (anchorY / 2);
    this.element.style.transform = `translate3d(${offsetX}%, ${offsetY}%, 0)`;
  }

  public position(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }
}

export class LabelManager {
  private engine: any;
  private labels: HtmlLabel[] = [];
  private container: HTMLDivElement;

  constructor(engine: any) {
    this.engine = engine;

    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.overflow = 'hidden';
    this.container.style.zIndex = '10';

    if (this.engine.renderer.domElement.parentNode) {
      const parent = this.engine.renderer.domElement.parentNode as HTMLElement;
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(this.container);
    } else {
      console.warn('LabelManager: WebGLRenderer 的 domElement 尚未挂载到 DOM 树中！');
    }
  }

  public add(label: HtmlLabel): void {
    this.engine.scene.add(label.group);
    this.container.appendChild(label.element);
    this.labels.push(label);
  }

  public remove(label: HtmlLabel): void {
    this.engine.scene.remove(label.group);
    if (label.element.parentNode) {
      label.element.parentNode.removeChild(label.element);
    }
    this.labels = this.labels.filter((l) => l !== label);
  }

  public update(): void {
    if (this.labels.length === 0) return;

    const camera = this.engine.camera;
    camera.updateMatrixWorld();
    
    // Fallback to renderer size if container has no explicit dimensions
    const width = this.container.clientWidth || this.engine.renderer.domElement.clientWidth;
    const height = this.container.clientHeight || this.engine.renderer.domElement.clientHeight;

    for (let i = 0; i < this.labels.length; i++) {
      const label = this.labels[i];
      
      label.group.updateWorldMatrix(true, false);
      
      const objectPos = new THREE.Vector3().setFromMatrixPosition(label.group.matrixWorld);
      const screenPos = objectPos.clone().project(camera);
      
      if (screenPos.z > 1 || screenPos.z < -1) {
        if (label.element.style.display !== 'none') {
           label.element.style.display = 'none';
        }
        continue;
      } else if (label.element.style.display === 'none') {
        label.element.style.display = 'block';
      }

      const x = (screenPos.x * 0.5 + 0.5) * width;
      const y = (screenPos.y * -0.5 + 0.5) * height;

      if (
        Math.abs(label.previousPosition.x - x) > 0.05 ||
        Math.abs(label.previousPosition.y - y) > 0.05 ||
        Math.abs(label.previousPosition.z - screenPos.z) > 0.001
      ) {
        const [anchorX, anchorY] = label.options.anchor;
        const offsetX = -50 - (anchorX / 2);
        const offsetY = -50 + (anchorY / 2);
        
        label.element.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(${offsetX}%, ${offsetY}%, 0)`;
        
        const zIndex = Math.floor((1 - screenPos.z) * 100000);
        const [maxZ, minZ] = label.options.zIndexRange;
        label.element.style.zIndex = Math.max(minZ, Math.min(maxZ, zIndex)).toString();

        label.previousPosition.set(x, y, screenPos.z);
      }
    }
  }
  
  public dispose(): void {
    [...this.labels].forEach(label => this.remove(label));
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.labels = [];
  }
}
