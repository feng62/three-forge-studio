import * as THREE from 'three'
import { Command } from './Command'
import { Engine } from '../engine/Engine'
import { markExternalModification } from '@forge/utils'

export class SetMaterialCommand implements Command {
  public name = 'SetMaterialCommand'
  private engine: Engine
  private objectUuid: string
  private oldMaterial: THREE.Material | THREE.Material[]
  private newMaterial: THREE.Material | THREE.Material[]

  constructor(
    engine: Engine,
    object: THREE.Object3D,
    newMaterial: THREE.Material | THREE.Material[]
  ) {
    this.engine = engine
    this.objectUuid = object.uuid
    // clone the material reference. We don't necessarily clone the material itself, 
    // just hold the reference to the old material so we can restore it.
    this.oldMaterial = (object as any).material
    this.newMaterial = newMaterial
  }

  execute(): void {
    const obj = this.engine.scene.getObjectByProperty('uuid', this.objectUuid) as THREE.Mesh
    if (obj) {
      obj.material = this.newMaterial
      markExternalModification(obj, 'material')
      if (this.engine.onSceneGraphChanged) {
        this.engine.onSceneGraphChanged()
      }
      this.engine.renderer.render(this.engine.scene, this.engine.camera)
    }
  }

  undo(): void {
    const obj = this.engine.scene.getObjectByProperty('uuid', this.objectUuid) as THREE.Mesh
    if (obj) {
      obj.material = this.oldMaterial
      markExternalModification(obj, 'material')
      if (this.engine.onSceneGraphChanged) {
        this.engine.onSceneGraphChanged()
      }
      this.engine.renderer.render(this.engine.scene, this.engine.camera)
    }
  }
}
