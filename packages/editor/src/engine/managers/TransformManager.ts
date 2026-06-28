import * as THREE from 'three'
import { Engine } from '../Engine'
import { TransformControls } from 'three-stdlib'
import { historyManager } from '../../history/HistoryManager'
import { TransformCommand } from '../../history/TransformCommand'

export class TransformManager {
  private engine: Engine
  public transformControls: TransformControls
  
  private transformStartPos: THREE.Vector3 | null = null
  private transformStartRot: THREE.Euler | null = null
  private transformStartScale: THREE.Vector3 | null = null

  constructor(engine: Engine) {
    this.engine = engine
    
    // 初始化 TransformControls
    this.transformControls = new TransformControls(this.engine.camera, this.engine.renderer.domElement)
    this.transformControls.userData.isHelper = true // 避免被场景射线选到导致死循环
  }

  public mount() {
    this.transformControls.addEventListener('dragging-changed' as any, this.onDraggingChanged)
    this.transformControls.addEventListener('change' as any, this.onChange)
    this.engine.scene.add(this.transformControls)
  }

  public unmount() {
    this.transformControls.removeEventListener('dragging-changed' as any, this.onDraggingChanged)
    this.transformControls.removeEventListener('change' as any, this.onChange)
    this.transformControls.dispose()
  }

  private onDraggingChanged = (event: any) => {
    // 拖拽时禁用相机的 OrbitControls，防止打架
    if (this.engine.orbitControls) {
      this.engine.orbitControls.enabled = !event.value
    }

    const obj = (this.transformControls as any).object
    if (event.value) {
      // 拖拽开始，记录初始状态
      if (obj) {
        this.transformStartPos = obj.position.clone()
        this.transformStartRot = obj.rotation.clone()
        this.transformStartScale = obj.scale.clone()
      }
    } else {
      // 拖拽结束，生成变换命令存入历史
      if (obj && this.transformStartPos && this.transformStartRot && this.transformStartScale) {
        // 如果位置/旋转/缩放有变化，记录命令
        if (
          !obj.position.equals(this.transformStartPos) ||
          !obj.rotation.equals(this.transformStartRot) ||
          !obj.scale.equals(this.transformStartScale)
        ) {
          const cmd = new TransformCommand(
            this.engine,
            obj,
            this.transformStartPos,
            this.transformStartRot,
            this.transformStartScale
          )
          historyManager.execute(cmd)
        }
      }
      this.transformStartPos = null
      this.transformStartRot = null
      this.transformStartScale = null
    }
  }

  private onChange = () => {
    if (this.engine.selectionManager?.boxHelper && this.engine.selectionManager.boxHelper.visible) {
      this.engine.selectionManager.boxHelper.update()
    }
    const obj = (this.transformControls as any).object
    if (obj) {
      this.engine.dispatchEvent({ type: 'objectTransformChanged', object: obj } as any)
    }
  }

  /**
   * 从外部状态管理器调用 (如 Pinia)
   * 触发模型变换模式 (移动、旋转、缩放等)
   * @param {'select' | 'translate' | 'rotate' | 'scale'} mode - 变换模式
   */
  public setTransformMode(mode: 'select' | 'translate' | 'rotate' | 'scale') {
    console.log('[TransformManager] Transform mode updated:', mode)
    this.engine.currentTransformMode = mode
    
    if (mode === 'select') {
      this.transformControls.detach()
    } else {
      this.transformControls.setMode(mode)
      if (this.engine.selectedObjectUuid) {
        const obj = this.engine.scene.getObjectByProperty('uuid', this.engine.selectedObjectUuid)
        if (obj) {
          this.transformControls.attach(obj)
        }
      }
    }
  }
}
