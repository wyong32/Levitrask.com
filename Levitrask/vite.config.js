// vite.config.js
// !! Removed direct import of routes to avoid build error !!
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs' // 导入 Node.js 文件系统模块
import path from 'node:path' // 导入 Node.js 路径模块

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import sitemap from 'vite-plugin-sitemap'

// --- 导入数据文件 --- // (修改)
import blogsData from './src/Datas/BlogsData.js' // 直接导入 JS 对象
import questionData from './src/Datas/questionData.js'
import newsData from './src/Datas/newsData.js'

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
staticRoutes = [...new Set(staticRoutes)]
console.log(`[Sitemap] Found static routes via regex: ${staticRoutes.join(', ')}`)

// --- 从导入的数据对象生成动态路由 --- // (修改)
const generateRoutesFromData = (dataObject, routePrefix) => {
  if (typeof dataObject !== 'object' || dataObject === null) {
    console.warn(`[Sitemap] Invalid data object provided for prefix ${routePrefix}`)
    return []
  }
  // 遍历对象的键 (keys)，这些键就是 ID/Slug
  const routes = Object.keys(dataObject).map((key) => `${routePrefix}${key}`)
  console.log(`[Sitemap] Generated ${routes.length} dynamic routes for prefix ${routePrefix}`)
  return routes
}

const blogRoutes = generateRoutesFromData(blogsData, '/blog/')
const questionRoutes = generateRoutesFromData(questionData, '/questions/')
const newsRoutes = generateRoutesFromData(newsData, '/news/')

// --- 合并所有路由 --- // (保持不变)
const allRoutes = [...new Set([...staticRoutes, ...blogRoutes, ...questionRoutes, ...newsRoutes])]
console.log(`[Sitemap] Total unique routes for sitemap: ${allRoutes.length}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    sitemap({
      hostname: 'https://levitrask.com/',
      dynamicRoutes: allRoutes,
      // Configure robots rules for generation
      robots: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/.git/', '/node_modules/', '/author-*.html', '/post/', '/tags-*.html'],
        },
      ],
      // Sitemap directive is automatically added based on hostname
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
