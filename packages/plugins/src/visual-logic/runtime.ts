import { VisualLogicCorePlugin } from './core';
import { VisualLogicForgePlugin } from './serializer';

export class VisualLogicRuntimePlugin {
  name = 'VisualLogic_Runtime_Bundle';
  
  private serializer = new VisualLogicForgePlugin();

  onInstall(engine: any) {
    engine.use(VisualLogicCorePlugin);
    engine.use(this.serializer);
  }
}

export const visualLogicRuntime = new VisualLogicRuntimePlugin();
