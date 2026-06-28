import { ForgeSerializer } from './packages/utils/src/protocol/serializer.ts';
import { CameraAnimationForgePlugin } from './packages/plugins/src/camera-animation/serializer.ts';
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.userData.cameraAnimations = { viewpoints: [{ id: '1', name: 'test' }] };

const serializer = new ForgeSerializer([new CameraAnimationForgePlugin()]);
const json = serializer.serialize(scene);

console.log(JSON.stringify(json, null, 2));
