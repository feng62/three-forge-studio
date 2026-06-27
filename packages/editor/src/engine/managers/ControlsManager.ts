import * as THREE from 'three';
import { 
    OrbitControls, MapControls, 
    PointerLockControls, DeviceOrientationControls, 
    TrackballControls, ArcballControls 
} from 'three-stdlib';
import { Engine } from '../Engine';

export type ControlType = 
    'OrbitControls' | 'MapControls' | 'FirstPersonControls' | 
    'PointerLockControls' | 'DeviceOrientationControls' | 
    'TrackballControls' | 'ArcballControls' | 'FlyControls';

export class ControlsManager {
    public currentControl: any = null;
    public currentType: ControlType = 'OrbitControls';

    private engine: Engine;
    private domElement: HTMLElement;
    private readonly defaultDampingFactor = 0.05;

    // Physics parameters for Fly/FirstPerson
    private velocity = new THREE.Vector3();
    private direction = new THREE.Vector3();
    private canJump = false;
    private readonly baseSpeed = 50.0;
    private readonly eyeLevel = 5.0;

    // Keys state for physics controls
    private keys: Record<string, boolean> = {
        'w': false, 'a': false, 's': false, 'd': false,
        'shift': false, ' ': false
    }

    private boundKeyDown = this.onKeyDown.bind(this)
    private boundKeyUp = this.onKeyUp.bind(this)
    private boundClick = this.onClick.bind(this)

    /**
     * 构造 ControlsManager，并初始化键盘监听器以及默认控制器
     * @param {Engine} engine - 当前运行的 3D 引擎实例
     * @param {HTMLElement} domElement - Three.js 渲染所绑定的 DOM 元素
     */
    constructor(engine: Engine, domElement: HTMLElement) {
        this.engine = engine;
        this.domElement = domElement;

        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        
        this.setControlType(this.currentType);
    }

    private onKeyDown(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key in this.keys) this.keys[key] = true;
    }

    private onKeyUp(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key in this.keys) this.keys[key] = false;
    }

    private onClick() {
        if (['FlyControls', 'FirstPersonControls', 'PointerLockControls'].includes(this.currentType)) {
            if (this.currentControl && typeof this.currentControl.lock === 'function') {
                this.currentControl.lock();
            }
        }
    }

    /**
     * 启用或禁用当前活动的控制器
     * 通常在切换到“选择”工具时禁用相机旋转，以免操作冲突
     * @param {boolean} enabled - 是否启用控制
     */
    public setEnable(enabled: boolean) {
        if (this.currentControl && 'enabled' in this.currentControl) {
            this.currentControl.enabled = enabled;
        }
    }

    /**
     * 更改当前的相机控制模式
     * 自动处理上一个控制器的销毁并挂载新的控制器
     * @param {ControlType} type - 新的控制类型
     */
    public setControlType(type: ControlType): void {
        this.currentType = type;
        this.rebindControl();
    }

    /**
     * 内部方法：重新绑定并实例化对应的控制器类
     * 并在切换时尝试保留视线目标点 (target)
     */
    private rebindControl(): void {
        const camera = this.engine.camera;
        const domElement = this.domElement;
        const lookTarget = new THREE.Vector3(0, 0, 0);

        if (this.currentControl && this.currentControl.target) {
            lookTarget.copy(this.currentControl.target);
        }

        if (this.currentControl) {
            if (typeof this.currentControl.dispose === 'function') {
                this.currentControl.dispose();
            }
            this.domElement.removeEventListener('click', this.boundClick);
            this.currentControl = null;
        }

        if (['OrbitControls', 'MapControls', 'FirstPersonControls', 'TrackballControls', 'FlyControls'].includes(this.currentType)) {
            camera.up.set(0, 1, 0);
            camera.lookAt(lookTarget); 
        }

        switch (this.currentType) {
            case 'OrbitControls':
                this.currentControl = new OrbitControls(camera, domElement);
                this.currentControl.target.copy(lookTarget);
                this.currentControl.enableDamping = true;
                this.currentControl.dampingFactor = this.defaultDampingFactor;
                this.currentControl.update(); 
                break;
            case 'MapControls':
                this.currentControl = new MapControls(camera, domElement);
                this.currentControl.target.copy(lookTarget);
                this.currentControl.enableDamping = true;
                this.currentControl.dampingFactor = this.defaultDampingFactor;
                this.currentControl.screenSpacePanning = false;
                this.currentControl.update();
                break;
            case 'TrackballControls':
                this.currentControl = new TrackballControls(camera, domElement);
                this.currentControl.target.copy(lookTarget);
                this.currentControl.staticMoving = false;
                this.currentControl.dynamicDampingFactor = this.defaultDampingFactor;
                break;
            case 'ArcballControls':
                this.currentControl = new ArcballControls(camera, domElement, this.engine.scene);
                break;
            case 'FlyControls':
            case 'FirstPersonControls':
            case 'PointerLockControls':
                this.currentControl = new PointerLockControls(camera, domElement);
                this.domElement.addEventListener('click', this.boundClick);
                this.velocity.set(0, 0, 0);
                this.canJump = true;
                if (this.currentType === 'FirstPersonControls') camera.position.y = this.eyeLevel;
                break;
            case 'DeviceOrientationControls':
                this.currentControl = new DeviceOrientationControls(camera);
                break;
            default:
                console.warn(`[ControlsManager] Unknown control type: ${this.currentType}`);
                break;
        }
    }

    /**
     * 在渲染循环 (requestAnimationFrame) 中调用
     * 处理带有阻尼的控制更新以及第一人称飞行控制的物理计算
     * @param {number} delta - 距离上一帧的时间增量 (秒)
     * @param {number} _time - 程序运行的总时间 (秒)
     */
    public update(delta: number, _time: number): void {
        if (!this.currentControl) return;

        if (['OrbitControls', 'MapControls', 'TrackballControls', 'ArcballControls'].includes(this.currentType)) {
            this.currentControl.update();
        } 
        else if (this.currentType === 'DeviceOrientationControls') {
            this.currentControl.update();
        }
        else if (this.currentType === 'FlyControls' || this.currentType === 'FirstPersonControls') {
            if (!this.currentControl.isLocked) return;

            const isAccelerating = this.keys['shift'];
            const speedMult = isAccelerating ? 3.0 : 1.0;
            const actualSpeed = this.baseSpeed * speedMult;

            this.direction.z = Number(this.keys['s']) - Number(this.keys['w']);
            this.direction.x = Number(this.keys['d']) - Number(this.keys['a']);
            this.direction.normalize();

            if (this.currentType === 'FlyControls') {
                if (this.direction.x !== 0) this.currentControl.moveRight(this.direction.x * actualSpeed * delta);
                if (this.direction.z !== 0) this.engine.camera.translateZ(this.direction.z * actualSpeed * delta);
                if (this.keys[' ']) this.engine.camera.translateY(actualSpeed * delta);
            } 
            else if (this.currentType === 'FirstPersonControls') {
                this.velocity.x -= this.velocity.x * 10.0 * delta;
                this.velocity.z -= this.velocity.z * 10.0 * delta;
                this.velocity.y -= 9.8 * 20.0 * delta;

                if (this.direction.x !== 0) this.velocity.x += this.direction.x * actualSpeed * 10.0 * delta;
                if (this.direction.z !== 0) this.velocity.z += this.direction.z * actualSpeed * 10.0 * delta;

                if (this.keys[' '] && this.canJump) {
                    this.velocity.y += 100.0;
                    this.canJump = false;
                }

                this.currentControl.moveRight(this.velocity.x * delta);
                this.currentControl.moveForward(-this.velocity.z * delta);
                this.engine.camera.position.y += this.velocity.y * delta;

                if (this.engine.camera.position.y < this.eyeLevel) {
                    this.velocity.y = 0;
                    this.engine.camera.position.y = this.eyeLevel;
                    this.canJump = true;
                }
            }
        }
    }

    /**
     * 释放所有占用的内存和事件监听器
     * 在 Engine 卸载或组件销毁时调用
     */
    public dispose(): void {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        this.domElement.removeEventListener('click', this.boundClick);
        if (this.currentControl && typeof this.currentControl.dispose === 'function') {
            this.currentControl.dispose();
        }
    }
}
