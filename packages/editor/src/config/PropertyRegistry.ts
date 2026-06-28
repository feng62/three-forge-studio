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

