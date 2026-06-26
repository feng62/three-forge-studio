import { defineConfig } from 'vitepress'

export default defineConfig({
  // Shared configs
  title: "Forge Studio",
  
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh',
      description: 'Three Forge Studio 官方文档',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '设计', link: '/design/concept' },
          { text: '指南', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' }
        ],
        sidebar: {
          '/design/': [
            {
              text: '设计',
              items: [
                { text: '设计理念', link: '/design/concept' },
                { text: '系统架构', link: '/design/architecture' },
                { text: '插件系统', link: '/design/plugin' }
              ]
            }
          ],
          '/guide/': [
            {
              text: '指南',
              items: [
                { text: '快速开始', link: '/guide/getting-started' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API 参考',
              items: [
                { text: 'API 概览', link: '/api/' }
              ]
            }
          ]
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: 'Documentation for the Three Forge Studio project',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Design', link: '/en/design/concept' },
          { text: 'Guide', link: '/en/guide/getting-started' },
          { text: 'API', link: '/en/api/' }
        ],
        sidebar: {
          '/en/design/': [
            {
              text: 'Design',
              items: [
                { text: 'Design Philosophy', link: '/en/design/concept' },
                { text: 'Architecture', link: '/en/design/architecture' },
                { text: 'Plugin System', link: '/en/design/plugin' }
              ]
            }
          ],
          '/en/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/en/guide/getting-started' }
              ]
            }
          ],
          '/en/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'API Overview', link: '/en/api/' }
              ]
            }
          ]
        }
      }
    }
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
