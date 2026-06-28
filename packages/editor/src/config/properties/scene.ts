import { PropertyRegistry } from '../PropertyRegistry'

PropertyRegistry.register(
  (obj) => obj.isScene,
  [
    {
      name: '背景与环境 (Background & Environment)',
      fields: [
        {
          id: 'scene.background.color',
          label: '背景颜色',
          type: 'color',
          path: 'background'
        },
        {
          id: 'scene.background.texture',
          label: '背景贴图',
          type: 'texture',
          path: 'background'
        },
        {
          id: 'scene.environment',
          label: '环境贴图 (HDR)',
          type: 'texture',
          path: 'environment'
        }
      ]
    },
    {
      name: '雾效 (Fog)',
      fields: [
        {
          id: 'scene.fog.color',
          label: '颜色',
          type: 'color',
          path: 'fog.color'
        },
        {
          id: 'scene.fog.near',
          label: '近点距离 (Near)',
          type: 'number',
          path: 'fog.near',
          options: { min: 0, step: 0.1 }
        },
        {
          id: 'scene.fog.far',
          label: '远点距离 (Far)',
          type: 'number',
          path: 'fog.far',
          options: { min: 0, step: 0.1 }
        }
      ]
    }
  ]
)
