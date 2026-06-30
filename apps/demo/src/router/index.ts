import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import PreviewView from '../views/PreviewView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: EditorView
    },
    {
      path: '/preview',
      name: 'preview',
      component: PreviewView
    }
  ]
})

export default router
