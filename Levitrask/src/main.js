import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n' // 导入 i18n 实例

// --- Element Plus ---
import ElementPlus from 'element-plus'          // 引入 Element Plus
import 'element-plus/dist/index.css'         // 引入 Element Plus 样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue' // 引入所有图标 (可选, 如果按需引入则不同) 

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus) // <--- 注册 Element Plus
app.use(i18n) // 使用 i18n 实例

// 全局注册所有图标 (如果使用上面的 import *)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
