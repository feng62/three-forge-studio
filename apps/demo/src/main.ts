import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// @ts-ignore
import 'element-plus/dist/index.css'
// @ts-ignore
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.mount('#app')
