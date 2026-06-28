
import { Command } from './Command'
import { Engine } from '../engine/Engine'
import { markExternalModification } from '@forge/utils'
import * as THREE from 'three'

/**
 * 这是一个通用的属性设置命令，支持 undo/redo。
 * 它可以处理任何通过对象引用和属性键进行修改的操作。
 */
export class SetPropertyCommand implements Command {
  public name = 'SetPropertyCommand'
  private engine: Engine
  private objectUuid: string
  private propertyPath: string
  private oldValue: any
  private newValue: any

  constructor(
    engine: Engine,
    object: any,
    propertyPath: string,
    newValue: any,
    oldValue?: any
  ) {
    this.engine = engine
    // 如果是 Object3D，我们存 uuid，否则如果我们直接改 Material，就需要其他方式引用。
    // 为了简单，我们目前主要修改场景中的 Object3D (或其挂载的 material)。
    this.objectUuid = object.uuid || (object as any).id?.toString()
    this.propertyPath = propertyPath
    this.newValue = newValue
    
    // 如果明确传入了旧值（哪怕是 undefined），就用传入的值
    if (arguments.length >= 5) {
      this.oldValue = oldValue
    } else {
      this.oldValue = this.getValueByPath(object, propertyPath)
    }
  }

  execute(): void {
    const obj = this.getTargetObject()
    if (obj) {
      this.setValueByPath(obj, this.propertyPath, this.newValue)
      if (this.propertyPath.startsWith('userData')) {
        markExternalModification(obj, 'userData')
      } else if (this.propertyPath === 'position' || this.propertyPath === 'rotation' || this.propertyPath === 'scale' || this.propertyPath === 'matrix') {
        markExternalModification(obj, 'transform')
      }
      this.notifyUpdate(obj)
    }
  }

  undo(): void {
    const obj = this.getTargetObject()
    if (obj) {
      this.setValueByPath(obj, this.propertyPath, this.oldValue)
      if (this.propertyPath.startsWith('userData')) {
        markExternalModification(obj, 'userData')
      } else if (this.propertyPath === 'position' || this.propertyPath === 'rotation' || this.propertyPath === 'scale' || this.propertyPath === 'matrix') {
        markExternalModification(obj, 'transform')
      }
      this.notifyUpdate(obj)
    }
  }

  private getTargetObject(): any {
    // 假设目前修改的都是场景节点
    return this.engine.scene.getObjectByProperty('uuid', this.objectUuid)
  }

  private getValueByPath(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj
    for (const key of keys) {
      if (current === undefined || current === null) return undefined
      current = current[key]
    }
    // 对 THREE 里的类进行克隆以保留历史快照 (比如 Color, Vector3)
    if (current && typeof current.clone === 'function') {
      return current.clone()
    }
    return current
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] == null) {
        if (keys[i] === 'fog') {
          current[keys[i]] = new THREE.Fog(0xcccccc, 1, 100)
        } else {
          return
        }
      }
      current = current[keys[i]]
    }
    const finalKey = keys[keys.length - 1]
    
    // 如果旧值也是 Three 对象并且有 copy 方法，优先用 copy (如 Vector3, Color)
    if (current[finalKey] && typeof current[finalKey].copy === 'function' && value && typeof value.copy === 'function') {
      current[finalKey].copy(value)
    } else if (current[finalKey] && typeof current[finalKey].setHex === 'function' && typeof value === 'number') {
      // 特殊处理 Color 通过数字赋值
      current[finalKey].setHex(value)
    } else {
      current[finalKey] = value
    }
  }

  private notifyUpdate(obj: any) {
    // 如果修改了相机的核心属性，需要更新投影矩阵
    if (obj && obj.isPerspectiveCamera && ['fov', 'near', 'far'].includes(this.propertyPath)) {
      obj.updateProjectionMatrix()
    }

    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged()
    }
    // 如果选中对象的包围盒需要更新
    if (this.engine.selectionManager?.boxHelper && this.engine.selectedObjectUuid === this.objectUuid) {
      this.engine.selectionManager.boxHelper.update()
    }
    this.engine.renderer.render(this.engine.scene, this.engine.camera)
  }
}
