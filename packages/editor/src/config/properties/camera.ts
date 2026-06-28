import { PropertyRegistry } from '../PropertyRegistry'

// 1. 透视相机 (PerspectiveCamera) 专有属性
PropertyRegistry.register(
  (obj) => obj.isPerspectiveCamera && !obj.userData.isHelper,
  [
    {
      name: '相机设置 (Camera)',
      fields: [
        { id: 'fov', label: '视野角度 (FOV)', type: 'number', path: 'fov', options: { min: 1, max: 179, step: 1 } },
        { id: 'near', label: '近裁切面 (Near)', type: 'number', path: 'near', options: { min: 0.01, step: 0.1 } },
        { id: 'far', label: '远裁切面 (Far)', type: 'number', path: 'far', options: { min: 1, step: 10 } }
      ]
    }
  ]
)
