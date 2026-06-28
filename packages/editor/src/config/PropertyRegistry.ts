export interface PropertyField {
  id: string
  label: string
  type: 'number' | 'boolean' | 'string' | 'color' | 'vector3'
  path: string // The object property path e.g. 'position' or 'material.color'
  options?: {
    min?: number
    max?: number
    step?: number
  }
}

export interface PropertyGroup {
  name: string
  fields: PropertyField[]
}

type ConditionFn = (obj: any) => boolean

interface RegistryEntry {
  condition: ConditionFn
  groups: PropertyGroup[]
}

/**
 * 属性注册表，用于解耦属性面板
 * 插件可以通过 PropertyRegistry.register() 添加新的属性组
 */
class PropertyRegistryClass {
  private entries: RegistryEntry[] = []

  public register(condition: ConditionFn, groups: PropertyGroup[]) {
    this.entries.push({ condition, groups })
  }

  public getGroupsForObject(obj: any): PropertyGroup[] {
    const result: PropertyGroup[] = []
    for (const entry of this.entries) {
      if (entry.condition(obj)) {
        // 深拷贝一份返回，以免外部修改污染注册表
        result.push(...JSON.parse(JSON.stringify(entry.groups)))
      }
    }
    return result
  }
}

export const PropertyRegistry = new PropertyRegistryClass()

// =========================================================
// 注册基础内置对象的属性
// =========================================================

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

// 2. 所有灯光都具备的基础属性
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

// 3. 点光源专有属性
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

// 4. 聚光灯专有属性
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

// 5. 面光源专有属性
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

// 6. 透视相机 (PerspectiveCamera) 专有属性
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
