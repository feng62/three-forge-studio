import * as THREE from 'three';
import { Command } from './Command';
import { Engine } from '../engine/Engine';

export class AddObjectCommand implements Command {
  public name = 'Add Object';
  
  constructor(
    private engine: Engine,
    private object: THREE.Object3D
  ) {}

  public execute(): void {
    this.engine.scene.add(this.object);
    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged();
    }
    this.engine.selectObjectByUuid(this.object.uuid);
  }

  public undo(): void {
    if (this.engine.selectedObjectUuid === this.object.uuid) {
      this.engine.selectObjectByUuid(null);
    }
    
    this.engine.scene.remove(this.object);
    
    // 如果想要彻底释放内存，需要 dispose 几何体和材质。
    // 但是对于撤销/重做系统，通常会先保留对象，直到命令被移出历史记录栈。
    
    if (this.engine.onSceneGraphChanged) {
      this.engine.onSceneGraphChanged();
    }
  }
}
