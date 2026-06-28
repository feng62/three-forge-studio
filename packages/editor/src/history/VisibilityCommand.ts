import { Command } from './Command'
import * as THREE from 'three'

export class VisibilityCommand implements Command {
  public name = 'Toggle Visibility'
  private object: THREE.Object3D
  private previousVisible: boolean
  private newVisible: boolean
  private onStateChanged?: () => void

  constructor(object: THREE.Object3D, newVisible: boolean, onStateChanged?: () => void) {
    this.object = object
    this.previousVisible = object.visible
    this.newVisible = newVisible
    this.onStateChanged = onStateChanged
  }

  execute() {
    this.object.visible = this.newVisible
    if (this.onStateChanged) {
      this.onStateChanged()
    }
  }

  undo() {
    this.object.visible = this.previousVisible
    if (this.onStateChanged) {
      this.onStateChanged()
    }
  }
}
