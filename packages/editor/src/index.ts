import './index.css';
import './config/properties/index';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

// 注入 three-mesh-bvh 以加速射线检测
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
import ForgeEditor from './components/layout/EditorLayout.vue';
import { db } from './db/database';
import { db as assetDb } from './db/db';
import { useProjectStore } from './stores/projectStore';

export { ForgeEditor, db, assetDb, useProjectStore };
