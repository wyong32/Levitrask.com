import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n' // 导入 i18n 实例
import { smartPreloadManager } from './utils/smartPreload'


// --- Element Plus ---
import ElementPlus from 'element-plus'          // 引入 Element Plus
import 'element-plus/dist/index.css'         // 引入 Element Plus 样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue' // 引入所有图标 (可选, 如果按需引入则不同)

// 创建应用实例
const app = createApp(App)

// 按正确顺序安装插件
app.use(createPinia())
app.use(i18n) // 先安装 i18n
app.use(ElementPlus) // 注册 Element Plus
app.use(router) // 最后安装 router

// 全局注册所有图标 (如果使用上面的 import *)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}



// 简化的应用初始化
async function initApp() {
  try {
    console.log('[App Init] Starting application initialization...')



    // 确保 i18n 实例可用
    if (!i18n || !i18n.global) {
      throw new Error('i18n instance is not properly initialized')
    }
    console.log('[App Init] i18n is ready with locale:', i18n.global.locale.value)

    // 等待 router 准备就绪
    await router.isReady()
    console.log('[App Init] Router is ready')

    // 挂载应用
    app.mount('#app')
    console.log('[App Init] Application mounted successfully')

    // 初始化智能预加载
    smartPreloadManager.init()
    console.log('[App Init] Smart preload manager initialized')
  } catch (error) {
    console.error('[App Init] Application initialization failed:', error)
    // 即使出错也尝试挂载应用，避免永久白屏
    setTimeout(() => {
      try {
        app.mount('#app')
        console.log('[App Init] Application mounted after error recovery')
      } catch (mountError) {
        console.error('[App Init] Failed to mount application:', mountError)
      }
    }, 100)
  }
}

// 初始化应用
initApp()
