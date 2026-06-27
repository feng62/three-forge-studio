import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('theme-pro')
  const themes = [
    { id: 'theme-pro', label: 'Pro (OLED)' },
    { id: 'theme-glass', label: 'Glassmorphism' },
    { id: 'theme-industrial', label: 'Industrial' }
  ]

  /**
   * 变更当前活动的主题
   * 会自动触发 watchEffect 将类名挂载到根 HTML 元素上，同时也会触发 Three.js 画布背景的同步
   * @param {string} themeId - 要设置的主题的 ID (如 'theme-pro', 'theme-glass')
   */
  function setTheme(themeId: string) {
    currentTheme.value = themeId
  }

  // Automatically apply theme to HTML document
  watchEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-pro', 'theme-glass', 'theme-industrial')
      document.documentElement.classList.add(currentTheme.value)
    }
  })

  return {
    currentTheme,
    themes,
    setTheme
  }
})
