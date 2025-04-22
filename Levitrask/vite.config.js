// vite.config.js
// !! Removed direct import of routes to avoid build error !!
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs' // 导入 Node.js 文件系统模块
import path from 'node:path' // 导入 Node.js 路径模块
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import sitemap from 'vite-plugin-sitemap'
import axios from 'axios' // 导入 axios

// --- 获取路由文件内容 --- // (修改)
const routerPath = path.resolve(__dirname, 'src/router/index.js')
let routerContent = ''
try {
  routerContent = fs.readFileSync(routerPath, 'utf-8')
} catch (error) {
  console.error('[Sitemap] Error reading router file:', error)
}

// --- 使用正则表达式提取静态路由路径 --- // (修改)
const staticPathRegex = /path:\s*'((?:\/[^\s:']*)?)'/g // 匹配 path: '/path/...'
let staticRoutes = []
let match
while ((match = staticPathRegex.exec(routerContent)) !== null) {
  // 确保捕获到的是有效的、非空的路径
  if (typeof match[1] === 'string' && !match[1].includes(':')) {
    staticRoutes.push(match[1])
  }
}
// 去重 (移除显式添加根路径的逻辑，依赖正则捕获和 Set)
staticRoutes = [...new Set(staticRoutes)].filter(route => route !== '') // 确保移除空路径并去重
if (!staticRoutes.includes('/')) staticRoutes.push('/'); // 确保根路径存在
console.log(`[Sitemap] Found static routes via regex: ${staticRoutes.join(', ')}`)

// --- 从导入的数据对象生成动态路由 --- // (修改)
// const generateRoutesFromData = (dataObject, routePrefix) => { ... }
// const blogRoutes = generateRoutesFromData(blogsData, '/blog/')
// const questionRoutes = generateRoutesFromData(questionData, '/questions/')
// const newsRoutes = generateRoutesFromData(newsData, '/news/')

// --- 合并所有路由 --- // (保持不变)
// const allRoutes = [...new Set([...staticRoutes, ...blogRoutes, ...questionRoutes, ...newsRoutes])]
// console.log(`[Sitemap] Total unique routes for sitemap: ${allRoutes.length}`)

// https://vite.dev/config/
export default defineConfig(({ mode }) => { // <--- 包装在函数中以使用 mode
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.VITE_API_BASE_URL
  const HOSTNAME = env.VITE_BASE_URL || 'https://levitrask.com/' // 使用 VITE_BASE_URL 或默认值

  console.log(`[Sitemap] Using API_BASE_URL: ${API_BASE_URL}`)
  console.log(`[Sitemap] Using HOSTNAME: ${HOSTNAME}`)

  // --- 异步函数：从 API 获取新闻路由 ---
  async function getNewsRoutes() {
    if (!API_BASE_URL) {
      console.warn('[Sitemap] VITE_API_BASE_URL is not set. Cannot fetch dynamic news routes.')
      return []
    }
    const apiUrl = `${API_BASE_URL}/api/news`
    console.log(`[Sitemap] Fetching news routes from: ${apiUrl}`)
    try {
      // 设置超时以防 API 响应过慢影响构建
      const response = await axios.get(apiUrl, { timeout: 8000 })
      const newsData = response.data // API 应返回以 ID 为键的对象

      if (typeof newsData === 'object' && newsData !== null) {
        const routes = Object.keys(newsData).map(key => `/news/${key}`)
        console.log(`[Sitemap] Successfully fetched ${routes.length} dynamic news routes.`)
        return routes
      } else {
        console.warn('[Sitemap] Fetched news data is not a valid object from API.')
        return []
      }
    } catch (error) {
      console.error(`[Sitemap] Failed to fetch news routes from ${apiUrl}:`, error.message)
      console.warn('[Sitemap] Proceeding without dynamic news routes.')
      return []
    }
  }

  // --- 异步函数：从 API 获取博客路由 (示例，需要后端支持 /api/blogs) ---
  async function getBlogRoutes() {
    if (!API_BASE_URL) return []
    const apiUrl = `${API_BASE_URL}/api/blogs` // 假设的 API 端点
    console.log(`[Sitemap] Fetching blog routes from: ${apiUrl}`)
    try {
      const response = await axios.get(apiUrl, { timeout: 8000 })
      const blogsData = response.data // 假设返回以 ID 为键的对象
      if (typeof blogsData === 'object' && blogsData !== null) {
        const routes = Object.keys(blogsData).map(key => `/blog/${key}`)
        console.log(`[Sitemap] Successfully fetched ${routes.length} dynamic blog routes.`)
        return routes
      } else {
        return []
      }
    } catch (error) {
      console.error(`[Sitemap] Failed to fetch blog routes from ${apiUrl}:`, error.message)
      return []
    }
  }

    // --- 异步函数：从 API 获取问答路由 (示例，需要后端支持 /api/questions) ---
    async function getQuestionRoutes() {
      if (!API_BASE_URL) return []
      const apiUrl = `${API_BASE_URL}/api/questions` // 假设的 API 端点
      console.log(`[Sitemap] Fetching question routes from: ${apiUrl}`)
      try {
        const response = await axios.get(apiUrl, { timeout: 8000 })
        const questionsData = response.data // 假设返回以 ID 为键的对象
        if (typeof questionsData === 'object' && questionsData !== null) {
          const routes = Object.keys(questionsData).map(key => `/questions/${key}`)
          console.log(`[Sitemap] Successfully fetched ${routes.length} dynamic question routes.`)
          return routes
        } else {
          return []
        }
      } catch (error) {
        console.error(`[Sitemap] Failed to fetch question routes from ${apiUrl}:`, error.message)
        return []
      }
    }

  // 返回配置对象
  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      sitemap({
        hostname: HOSTNAME, // 使用环境变量或默认值
        dynamicRoutes: async () => { // <--- 改为异步函数
          console.log('[Sitemap] Starting dynamic route fetching...')
          // 并行获取所有动态路由
          const [newsRoutes, blogRoutes, questionRoutes] = await Promise.all([
            getNewsRoutes(),
            getBlogRoutes(), // 调用获取博客路由的函数
            getQuestionRoutes() // 调用获取问答路由的函数
          ])
          // 合并静态路由和所有获取到的动态路由
          const allDynamicRoutes = [...staticRoutes, ...newsRoutes, ...blogRoutes, ...questionRoutes]
          const uniqueRoutes = [...new Set(allDynamicRoutes)]
          console.log(`[Sitemap] Total unique routes for sitemap: ${uniqueRoutes.length}`)
          return uniqueRoutes
        },
        robots: [
          {
            userAgent: '*',
            allow: '/',
            // 注意：如果您不再使用 /post/, /author-*/, /tags-*/ 等路径，可以考虑移除它们
            disallow: ['/.git/', '/node_modules/'],
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    }
  }
})
