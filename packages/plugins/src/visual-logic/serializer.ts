import type { ForgePlugin } from '@forge/types';
import { Object3D } from 'three';

export class VisualLogicForgePlugin implements ForgePlugin {
  name = 'Forge_VisualLogic';
  version = '1.0.0';

  serializeRoot(scene: Object3D): Record<string, any> | undefined {
    if (scene.userData && scene.userData.visualLogic) {
      return JSON.parse(JSON.stringify(scene.userData.visualLogic));
    }
    return undefined;
  }

  deserializeRoot(extensionData: any, scene: Object3D): void {
    if (extensionData) {
      scene.userData.visualLogic = extensionData;
    }
  }
}
