import { ForgeMetadata, ForgeProject } from './metadata';
import { ForgeSettings } from './settings';
import { ForgeSceneNode } from './node';
import { ForgeAssets } from './assets';
import { ForgeExtensions } from './base';

/**
 * 🌟 完整的 Forge 场景 JSON 协议结构
 */
export interface ForgeSceneJSON {
  metadata: ForgeMetadata;
  project: ForgeProject;
  settings: ForgeSettings;
  scene: ForgeSceneNode;
  assets: ForgeAssets;
  extensions?: ForgeExtensions;
}
