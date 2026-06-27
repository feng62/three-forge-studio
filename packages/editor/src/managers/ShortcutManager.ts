import hotkeys from 'hotkeys-js'
import { useTransformStore } from '../stores/transformStore'

export class ShortcutManager {
  private initialized = false

  /**
   * 初始化快捷键管理器
   * 绑定全局的键盘快捷键（如 G, R, S, Space）来切换编辑器模式，
   * 并且会默认阻止在 input、textarea 等输入框内触发快捷键。
   */
  public init() {
    if (this.initialized) return
    
    // Prevent hotkeys from triggering inside input/textarea by default
    hotkeys.filter = function(event) {
      const target = (event.target || event.srcElement) as HTMLElement
      const tagName = target.tagName
      return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA')
    }

    const transformStore = useTransformStore()

    hotkeys('g', (event) => {
      event.preventDefault()
      transformStore.setTransformMode('translate')
    })

    hotkeys('r', (event) => {
      event.preventDefault()
      transformStore.setTransformMode('rotate')
    })

    hotkeys('s', (event) => {
      event.preventDefault()
      transformStore.setTransformMode('scale')
    })

    hotkeys('space', (event) => {
      event.preventDefault()
      transformStore.setTransformMode('select')
    })

    // Manual Save
    hotkeys('ctrl+s, command+s', (event) => {
      event.preventDefault()
      import('../stores/projectStore').then(({ useProjectStore }) => {
        const projectStore = useProjectStore()
        projectStore.saveProject().then(() => {
          import('element-plus').then(({ ElMessage }) => {
            ElMessage.success('项目已手动保存')
          })
        })
      })
    })

    this.initialized = true
    console.log('[ShortcutManager] Initialized')
  }

  /**
   * 销毁并解绑所有注册的全局快捷键
   * 通常在组件或系统销毁时调用，以防止内存泄漏或快捷键冲突
   */
  public destroy() {
    hotkeys.unbind('g')
    hotkeys.unbind('r')
    hotkeys.unbind('s')
    hotkeys.unbind('space')
    hotkeys.unbind('ctrl+s, command+s')
    this.initialized = false
  }
}

export const shortcutManager = new ShortcutManager()
