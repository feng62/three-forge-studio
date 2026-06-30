import * as THREE from 'three';
import { AmbientLight, PointLight, SpotLight, DirectionalLight, RectAreaLight } from 'three/webgpu';
import { 
  PhCube, 
  PhCircle, 
  PhSquare, 
  PhCylinder, 
  PhLightbulb, 
  PhSun,
  PhPalette,
  PhDrop,
  PhDiamond,
} from '@phosphor-icons/vue';

export const builtInModels = [
  { type: 'Box', label: '立方体', icon: PhCube },
  { type: 'Sphere', label: '球体', icon: PhCircle },
  { type: 'Plane', label: '平面', icon: PhSquare },
  { type: 'Cylinder', label: '圆柱体', icon: PhCylinder },
];

export const builtInLights = [
  { type: 'AmbientLight', label: '环境光', icon: PhSun },
  { type: 'PointLight', label: '点光源', icon: PhLightbulb },
  { type: 'DirectionalLight', label: '平行光', icon: PhSun },
  { type: 'SpotLight', label: '聚光灯', icon: PhLightbulb },
  { type: 'RectAreaLight', label: '面光源', icon: PhSquare },
];

export const builtInMaterials = [
  { type: 'Material_Basic', label: '基础材质', icon: PhPalette },
  { type: 'Material_Standard', label: '标准材质', icon: PhPalette },
  { type: 'Material_Physical', label: '物理材质', icon: PhPalette },
  { type: 'Material_Lambert', label: '兰伯特材质', icon: PhPalette },
  { type: 'Material_Phong', label: '冯氏材质', icon: PhPalette },
  { type: 'Material_Metal', label: '金属材质', icon: PhDiamond },
  { type: 'Material_Glass', label: '玻璃材质', icon: PhDrop },
  { type: 'Material_Wireframe', label: '线框材质', icon: PhPalette },
];

export const createBuiltInAsset = (type: string, material: THREE.Material): { obj: THREE.Object3D | null, yOffset: number } => {
  let obj: THREE.Object3D | null = null;
  let yOffset = 0;

  switch (type) {
    case 'Box':
      obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
      obj.name = 'Box';
      yOffset = 0.5;
      break;
    case 'Sphere':
      obj = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), material);
      obj.name = 'Sphere';
      yOffset = 0.5;
      break;
    case 'Plane':
      obj = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5), 
        new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide })
      );
      obj.name = 'Plane';
      obj.rotation.x = -Math.PI / 2;
      yOffset = 0.01; // 稍微抬高一点防止z-fighting
      break;
    case 'Cylinder':
      obj = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), material);
      obj.name = 'Cylinder';
      yOffset = 0.5;
      break;
    case 'AmbientLight':
      obj = new AmbientLight(0xffffff, 0.5);
      obj.name = 'AmbientLight';
      yOffset = 0;
      break;
    case 'PointLight':
      obj = new PointLight(0xffffff, 1, 100);
      obj.name = 'PointLight';
      yOffset = 2;
      break;
    case 'SpotLight':
      obj = new SpotLight(0xffffff, 1);
      obj.name = 'SpotLight';
      (obj as SpotLight).angle = Math.PI / 6;
      yOffset = 5;
      break;
    case 'DirectionalLight':
      obj = new DirectionalLight(0xffffff, 1);
      obj.name = 'DirectionalLight';
      yOffset = 5;
      break;
    case 'RectAreaLight':
      obj = new RectAreaLight(0xffffff, 5, 2, 2);
      obj.name = 'RectAreaLight';
      obj.lookAt(0, 0, 0);
      yOffset = 3;
      break;
  }
  return { obj, yOffset };
}

export const createBuiltInMaterial = (type: string): THREE.Material | null => {
  let newMaterial: THREE.Material | null = null;
  const color = 0xcccccc;
  
  switch (type) {
    case 'Material_Basic':
      newMaterial = new THREE.MeshBasicMaterial({ color });
      newMaterial.name = '基础材质';
      break;
    case 'Material_Standard':
      newMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
      newMaterial.name = '标准材质';
      break;
    case 'Material_Physical':
      newMaterial = new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0.1, clearcoat: 1.0 });
      newMaterial.name = '物理材质';
      break;
    case 'Material_Lambert':
      newMaterial = new THREE.MeshLambertMaterial({ color });
      newMaterial.name = '兰伯特材质';
      break;
    case 'Material_Phong':
      newMaterial = new THREE.MeshPhongMaterial({ color, shininess: 30 });
      newMaterial.name = '冯氏材质';
      break;
    case 'Material_Metal':
      newMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 1.0 });
      newMaterial.name = '金属材质';
      break;
    case 'Material_Glass':
      newMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, transmission: 1.0, opacity: 1, transparent: true, roughness: 0.1, ior: 1.5 
      });
      newMaterial.name = '玻璃材质';
      break;
    case 'Material_Wireframe':
      newMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
      newMaterial.name = '线框材质';
      break;
  }
  return newMaterial;
}
