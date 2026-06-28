import * as THREE from 'three';
import { Command } from './Command';
import { Engine } from '../engine/Engine';
import { markExternalModification } from '@forge/utils';

export class TransformCommand implements Command {
  public name = 'Transform Object';

  private newPosition: THREE.Vector3;
  private newRotation: THREE.Euler;
  private newScale: THREE.Vector3;

  constructor(
    private engine: Engine,
    private object: THREE.Object3D,
    private oldPosition: THREE.Vector3,
    private oldRotation: THREE.Euler,
    private oldScale: THREE.Vector3
  ) {
    // 实例化命令时记录物体当前的最新状态
    this.newPosition = object.position.clone();
    this.newRotation = object.rotation.clone();
    this.newScale = object.scale.clone();
  }

  public execute(): void {
    // 前进到新状态
    this.object.position.copy(this.newPosition);
    this.object.rotation.copy(this.newRotation);
    this.object.scale.copy(this.newScale);
    
    // 如果该物体正好是当前选中的物体，通知引擎更新相关UI（包围盒等）
    if (this.engine.selectedObjectUuid === this.object.uuid) {
      this.engine.selectObjectByUuid(this.object.uuid);
    }
    
    // 标记是否为外部模型的子节点修改
    markExternalModification(this.object, 'transform');
  }

  public undo(): void {
    // 退回到旧状态
    this.object.position.copy(this.oldPosition);
    this.object.rotation.copy(this.oldRotation);
    this.object.scale.copy(this.oldScale);
    
    // 更新UI
    if (this.engine.selectedObjectUuid === this.object.uuid) {
      this.engine.selectObjectByUuid(this.object.uuid);
    }
    
    // 标记退回操作同样是一种修改
    markExternalModification(this.object, 'transform');
  }
}
