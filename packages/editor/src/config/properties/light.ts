import { PropertyRegistry } from '../PropertyRegistry'

// 1. 所有灯光都具备的基础属性
PropertyRegistry.register(
  (obj) => obj.isLight && !obj.userData.isHelper,
  [
    {
      name: '灯光基础 (Light Base)',
      fields: [
        { id: 'color', label: '颜色 (Color)', type: 'color', path: 'color' },
        { id: 'intensity', label: '强度 (Intensity)', type: 'number', path: 'intensity', options: { min: 0, max: 100, step: 0.1 } }
      ]
    }
  ]
)

// 2. 点光源专有属性
PropertyRegistry.register(
  (obj) => obj.type === 'PointLight',
  [
    {
      name: '点光源设置 (Point Light)',
      fields: [
        { id: 'distance', label: '距离 (Distance)', type: 'number', path: 'distance', options: { min: 0, step: 0.5 } },
        { id: 'decay', label: '衰减 (Decay)', type: 'number', path: 'decay', options: { min: 0, max: 5, step: 0.1 } }
      ]
    }
  ]
)

// 3. 聚光灯专有属性
PropertyRegistry.register(
  (obj) => obj.type === 'SpotLight',
  [
    {
      name: '聚光灯设置 (Spot Light)',
      fields: [
        { id: 'distance', label: '距离 (Distance)', type: 'number', path: 'distance', options: { min: 0, step: 0.5 } },
        { id: 'angle', label: '角度 (Angle)', type: 'number', path: 'angle', options: { min: 0, max: 90, step: 1 } }, // UI 使用角度
        { id: 'penumbra', label: '边缘模糊 (Penumbra)', type: 'number', path: 'penumbra', options: { min: 0, max: 1, step: 0.01 } },
        { id: 'decay', label: '衰减 (Decay)', type: 'number', path: 'decay', options: { min: 0, max: 5, step: 0.1 } }
      ]
    }
  ]
)

// 4. 面光源专有属性
PropertyRegistry.register(
  (obj) => obj.type === 'RectAreaLight',
  [
    {
      name: '面光源设置 (RectArea Light)',
      fields: [
        { id: 'width', label: '宽度 (Width)', type: 'number', path: 'width', options: { min: 0.1, step: 0.5 } },
        { id: 'height', label: '高度 (Height)', type: 'number', path: 'height', options: { min: 0.1, step: 0.5 } }
      ]
    }
  ]
)
