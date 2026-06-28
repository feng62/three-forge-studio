import { PropertyRegistry } from '../PropertyRegistry'

// 1. 所有 Object3D 都有的基础属性 (排除辅助对象)
PropertyRegistry.register(
  (obj) => obj.isObject3D && !obj.userData.isHelper,
  [
    {
      name: '基础变换 (Transform)',
      fields: [
        { id: 'visible', label: '可见性 (Visible)', type: 'boolean', path: 'visible' },
        { id: 'position', label: '位置 (Position)', type: 'vector3', path: 'position', options: { step: 0.1 } },
        { id: 'rotation', label: '旋转 (Rotation)', type: 'vector3', path: 'rotation', options: { step: 1 } }, // 约定 UI 传过来的是角度
        { id: 'scale', label: '缩放 (Scale)', type: 'vector3', path: 'scale', options: { step: 0.1 } }
      ]
    }
  ]
)
