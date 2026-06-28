import * as THREE from 'three';
import { Command } from './Command';
import { Engine } from '../engine/Engine';

export class RemoveObjectCommand implements Command {
  public name = 'Remove Object';
  
  private parent: THREE.Object3D | null = null;
  
  constructor(
    private engine: Engine,
    private object: THREE.Object3D
  ) {
    this.parent = object.parent;
  }

  public execute(): void {
    if (this.engine.selectedObjectUuid === this.object.uuid) {
      this.engine.selectObjectByUuid(null);
    }

    if (this.parent) {
      this.parent.remove(this.object);
    } else {
      this.engine.scene.remove(this.object);
    }
    
    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged();
    }
  }

  public undo(): void {
    // 恢复物体
    if (this.parent) {
      this.parent.add(this.object);
    } else {
      this.engine.scene.add(this.object);
    }

    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged();
    }
    
    // 重新选中被恢复的物体
    this.engine.selectObjectByUuid(this.object.uuid);
  }
}
