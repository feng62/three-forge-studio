import * as THREE from 'three';

export type LabelAnchor = [number, number];

export interface HtmlLabelOptions {
  anchor?: LabelAnchor;
  pointerEvents?: 'auto' | 'none' | 'visible' | 'all';
  zIndexRange?: [number, number];
  is3D?: boolean;
  occluded?: boolean;
  fixedRotation?: boolean;
  followAxis?: 'none' | 'x' | 'y' | 'z';
  rotation?: [number, number, number];
}

type RequiredHtmlLabelOptions = Required<HtmlLabelOptions>;

export class HtmlLabel {
  public element: HTMLElement;
  public options: RequiredHtmlLabelOptions;
  public group: THREE.Group;
  
  public previousPosition: THREE.Vector3 = new THREE.Vector3(-9999, -9999, -9999);
  public previousScale: number = 1;
  public previousVisible: boolean = true;
  public previousFixedRotation: boolean = false;
  public previousRotationMatrix: string = '';

  constructor(contentElement: HTMLElement, options?: HtmlLabelOptions) {
    this.element = contentElement;
    
    this.options = {
      anchor: [0, 0],
      pointerEvents: 'auto',
      zIndexRange: [16777271, 0],
      is3D: false,
      occluded: false,
      fixedRotation: false,
      followAxis: 'none',
      rotation: [0, 0, 0],
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
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

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
    this.container.style.transformStyle = 'preserve-3d';

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

    // Set container perspective to match camera FOV for correct CSS3D vanishing points
    const fov = (camera as any).fov || 50;
    const fovRad = THREE.MathUtils.degToRad(fov);
    const cameraZ = (height / 2) / Math.tan(fovRad / 2);
    this.container.style.perspective = `${cameraZ}px`;

    for (let i = 0; i < this.labels.length; i++) {
      const label = this.labels[i];
      
      label.group.updateWorldMatrix(true, false);
      
      const objectPos = new THREE.Vector3().setFromMatrixPosition(label.group.matrixWorld);
      const screenPos = objectPos.clone().project(camera);
      
      if (screenPos.z > 1 || screenPos.z < -1) {
        if (label.previousVisible !== false) {
           label.element.style.display = 'none';
           label.previousVisible = false;
        }
        continue;
      }

      let isVisible = true;
      let scale = 1;

      if (label.options.occluded) {
        const direction = new THREE.Vector3().subVectors(objectPos, camera.position);
        const distance = direction.length();
        direction.normalize();
        this.raycaster.set(camera.position, direction);
        
        // Ensure raycaster near/far is suitable
        this.raycaster.near = camera.near || 0.1;
        this.raycaster.far = distance;

        const intersects = this.raycaster.intersectObjects(this.engine.scene.children, true);
        for (let j = 0; j < intersects.length; j++) {
          const intersect = intersects[j];
          if (intersect.object.type === 'Mesh' && intersect.object.visible && !intersect.object.userData.isHelper) {
            // Found a mesh closer than the label
            if (intersect.distance < distance - 1.0) { // 1.0 margin to prevent self-occlusion artifacts
              isVisible = false;
              break;
            }
          }
        }
      }

      if (!isVisible) {
        if (label.previousVisible !== false) {
          label.element.style.display = 'none';
          label.previousVisible = false;
        }
        continue;
      } else {
        if (label.previousVisible === false) {
          label.element.style.display = 'block';
          label.previousVisible = true;
        }
      }

      if (label.options.is3D) {
        const distance = camera.position.distanceTo(objectPos);
        // Arbitrary reference distance = 50. Scale linearly inversely with distance.
        scale = Math.max(0.01, 50 / Math.max(0.1, distance));
      }

      let matrix3dStr = '';
      if (label.options.is3D && label.options.fixedRotation) {
        const cameraQuat = camera.quaternion.clone();
        const invCameraQuat = cameraQuat.invert();
        
        const rot = label.options.rotation || [0, 0, 0];
        const labelEulerX = THREE.MathUtils.degToRad(rot[0]);
        const labelEulerY = THREE.MathUtils.degToRad(rot[1]);
        const labelEulerZ = THREE.MathUtils.degToRad(rot[2]);
        
        const finalWorldQuat = new THREE.Quaternion();
        
        if (label.options.followAxis && label.options.followAxis !== 'none') {
           const axis = label.options.followAxis;
           // 始终使用 YXZ 顺序来分解相机的旋转（偏航 -> 俯仰 -> 滚转），符合标准摄像机模型
           const camEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
           
           const finalX = axis === 'x' ? camEuler.x : labelEulerX;
           const finalY = axis === 'y' ? camEuler.y : labelEulerY;
           const finalZ = axis === 'z' ? camEuler.z : labelEulerZ;
           
           finalWorldQuat.setFromEuler(new THREE.Euler(finalX, finalY, finalZ, 'YXZ'));
        } else {
           finalWorldQuat.setFromEuler(new THREE.Euler(labelEulerX, labelEulerY, labelEulerZ, 'YXZ'));
        }
        
        // Q_world = Q_camera * Q_local  =>  Q_local = Q_camera^-1 * Q_world
        const localQuat = new THREE.Quaternion().copy(invCameraQuat).multiply(finalWorldQuat);
        
        const m = new THREE.Matrix4().makeRotationFromQuaternion(localQuat);
        const e = m.elements;
        
        function epsilon(value: number) {
            return Math.abs(value) < 1e-10 ? 0 : value;
        }
        
        // Convert Three.js right-handed (Y-up) rotation matrix to CSS3D left-handed (Y-down) matrix
        matrix3dStr = `matrix3d(${epsilon(e[0])},${epsilon(-e[1])},${epsilon(e[2])},0, ${epsilon(-e[4])},${epsilon(e[5])},${epsilon(-e[6])},0, ${epsilon(e[8])},${epsilon(-e[9])},${epsilon(e[10])},0, 0,0,0,1)`;
      }

      const x = (screenPos.x * 0.5 + 0.5) * width;
      const y = (screenPos.y * -0.5 + 0.5) * height;

      if (
        Math.abs(label.previousPosition.x - x) > 0.05 ||
        Math.abs(label.previousPosition.y - y) > 0.05 ||
        Math.abs(label.previousPosition.z - screenPos.z) > 0.001 ||
        Math.abs(label.previousScale - scale) > 0.001 ||
        label.previousFixedRotation !== !!label.options.fixedRotation ||
        label.previousRotationMatrix !== matrix3dStr
      ) {
        const [anchorX, anchorY] = label.options.anchor;
        const originX = 50 + (anchorX / 2);
        const originY = 50 - (anchorY / 2);
        
        label.element.style.transformOrigin = `${originX}% ${originY}%`;
        
        // Ensure accurate pivot rendering sequence: Position -> Center Pivot -> Scale -> Rotate
        let transform = `translate3d(${x}px, ${y}px, 0) translate3d(-${originX}%, -${originY}%, 0) scale(${scale})`;
        if (matrix3dStr) {
           transform += ` ${matrix3dStr}`;
        }
        label.element.style.transform = transform;
        
        const zIndex = Math.floor((1 - screenPos.z) * 100000);
        const [maxZ, minZ] = label.options.zIndexRange;
        label.element.style.zIndex = Math.max(minZ, Math.min(maxZ, zIndex)).toString();

        label.previousPosition.set(x, y, screenPos.z);
        label.previousScale = scale;
        label.previousFixedRotation = !!label.options.fixedRotation;
        label.previousRotationMatrix = matrix3dStr;
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
