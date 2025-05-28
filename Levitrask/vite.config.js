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

// --- 使用正则表达式提取静态路由路径 (REVISED) --- //
const routerPath = path.resolve(__dirname, 'src/router/index.js')
let routerContent = ''
try {
  routerContent = fs.readFileSync(routerPath, 'utf-8')
} catch (error) {
  console.error('[Sitemap] Error reading router file:', error)
}

// Regex to find 'path: "..."' or 'path: '...'' or path: ''
// It captures the path value inside the quotes (or empty for '')
// It avoids capturing paths containing ':' (dynamic routes)
const staticPathRegex = /path:\s*(?:(?:"([^"\n:]*)")|(?:\'([^\'\n:]*)\'))/g;
const languages = ['en', 'zh-CN', 'ru']; // Define supported languages
let baseStaticRoutes = new Set(); // Use Set for automatic deduplication
let match;

while ((match = staticPathRegex.exec(routerContent)) !== null) {
  // match[1] is for double quotes, match[2] is for single quotes
  const pathValue = match[1] !== undefined ? match[1] : match[2];
  // Ensure it's a string and doesn't contain ':' (already handled by regex but double-check)
  if (typeof pathValue === 'string') {
      baseStaticRoutes.add(pathValue); // Add the base path (e.g., '', 'blog', 'news')
  }
}

// Generate language-prefixed routes
let staticRoutesWithLang = [];
baseStaticRoutes.forEach(basePath => {
    languages.forEach(lang => {
        // Handle the root path ('') and other paths
        const fullPath = basePath ? `/${lang}/${basePath}` : `/${lang}`;
        staticRoutesWithLang.push(fullPath);
    });
});

// Add the absolute root path '/' if needed (e.g., for fallback or redirection)
// staticRoutesWithLang.push('/'); // Optional: Only add if your app actually serves content at '/'

// Final static routes list (already unique due to Set and generation logic)
console.log(`[Sitemap] Found static routes with lang prefix: ${staticRoutesWithLang.join(', ')}`);

// --- 从导入的数据对象生成动态路由 --- // (修改)
// const generateRoutesFromData = (dataObject, routePrefix) => { ... }
// const blogRoutes = generateRoutesFromData(blogsData, '/blog/')
// const questionRoutes = generateRoutesFromData(questionData, '/questions/')
// const newsRoutes = generateRoutesFromData(newsData, '/news/')

// --- 合并所有路由 --- // (保持不变)
// const allRoutes = [...new Set([...staticRoutes, ...blogRoutes, ...questionRoutes, ...newsRoutes])]
// console.log(`[Sitemap] Total unique routes for sitemap: ${allRoutes.length}`)

// https://vite.dev/config/
// Wrap the export in an async IIFE to allow top-level await
export default (async () => { // <--- Start async IIFE

  // --- 异步函数：从 API 获取新闻路由 (REVISED TO RETURN ONLY SLUGS) ---
  async function getNewsRoutes(apiBaseUrl) {
    if (!apiBaseUrl) {
      console.warn('[Sitemap] VITE_API_BASE_URL is not set. Cannot fetch dynamic news routes.')
      return []
    }
    const apiUrl = `${apiBaseUrl}/api/news`
    console.log(`[Sitemap] Fetching news routes from: ${apiUrl}`)
    try {
      const response = await axios.get(apiUrl, { timeout: 8000 })
      const newsData = response.data
      if (Array.isArray(newsData)) {
        // Return only the slugs, assuming item.slug exists
        const slugs = newsData.map(item => item?.slug).filter(Boolean);
        console.log(`[Sitemap] Successfully fetched ${slugs.length} dynamic news slugs from array.`)
        return slugs
      } else if (typeof newsData === 'object' && newsData !== null) {
        // Fallback: If API returns object, keys are slugs
        const slugs = Object.keys(newsData);
        console.log(`[Sitemap] Successfully fetched ${slugs.length} dynamic news slugs from object keys.`)
        return slugs
      } else {
        console.warn('[Sitemap] Fetched news data is not a valid array or object from API.')
        return []
      }
    } catch (error) {
      console.error(`[Sitemap] Failed to fetch news routes from ${apiUrl}:`, error.message)
      console.warn('[Sitemap] Proceeding without dynamic news routes.')
      return []
    }
  }

  // --- 异步函数：从 API 获取博客路由 (REVISED TO RETURN ONLY SLUGS) ---
  async function getBlogRoutes(apiBaseUrl) {
    if (!apiBaseUrl) return []
    const apiUrl = `${apiBaseUrl}/api/blogs`
    console.log(`[Sitemap] Fetching blog routes from: ${apiUrl}`)
    try {
      const response = await axios.get(apiUrl, { timeout: 8000 })
      const blogsData = response.data
      if (Array.isArray(blogsData)) {
        const slugs = blogsData.map(item => item?.slug).filter(Boolean);
        console.log(`[Sitemap] Successfully fetched ${slugs.length} dynamic blog slugs from array.`)
        return slugs
      } else if (typeof blogsData === 'object' && blogsData !== null) {
        const slugs = Object.keys(blogsData);
        console.log(`[Sitemap] Successfully fetched ${slugs.length} dynamic blog slugs from object keys.`)
        return slugs
      } else {
        console.warn('[Sitemap] Fetched blog data is not a valid array or object from API.')
        return []
      }
    } catch (error) {
      console.error(`[Sitemap] Failed to fetch blog routes from ${apiUrl}:`, error.message)
      console.warn('[Sitemap] Proceeding without dynamic blog routes.')
      return []
    }
  }

    // --- 异步函数：从 API 获取问答路由 (REVISED TO RETURN ONLY IDS) ---
    async function getQuestionRoutes(apiBaseUrl) {
      if (!apiBaseUrl) return []
      const apiUrl = `${apiBaseUrl}/api/questions`
      console.log(`[Sitemap] Fetching question routes from: ${apiUrl}`)
      try {
        const response = await axios.get(apiUrl, { timeout: 8000 })
        const questionsData = response.data
        if (Array.isArray(questionsData)) {
           // Assuming questions use 'id'
          const ids = questionsData.map(item => item?.id).filter(Boolean);
          console.log(`[Sitemap] Successfully fetched ${ids.length} dynamic question ids from array.`)
          return ids
        } else if (typeof questionsData === 'object' && questionsData !== null) {
          const ids = Object.keys(questionsData);
          console.log(`[Sitemap] Successfully fetched ${ids.length} dynamic question ids from object keys.`)
          return ids
        } else {
          console.warn('[Sitemap] Fetched question data is not a valid array or object from API.')
          return []
        }
      } catch (error) {
        console.error(`[Sitemap] Failed to fetch question routes from ${apiUrl}:`, error.message)
        console.warn('[Sitemap] Proceeding without dynamic question routes.')
        return []
      }
    }

  // Load environment variables based on the current mode
  // We need to define the mode or default to 'production' or 'development'
  // Since this runs during build, 'production' is a sensible default if mode isn't easily available here.
  // Alternatively, we can try to get mode from process.env.NODE_ENV
  const mode = process.env.NODE_ENV || 'production';
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.VITE_API_BASE_URL
  const HOSTNAME = env.VITE_BASE_URL || 'https://levitrask.com/'

  console.log(`[Sitemap] Using API_BASE_URL: ${API_BASE_URL}`)
  console.log(`[Sitemap] Using HOSTNAME: ${HOSTNAME}`)

  // --- Fetch dynamic routes BEFORE defining the config (MODIFIED: Add language prefix) ---
  console.log('[Sitemap] Starting dynamic route fetching...');
  const [newsSlugs, blogSlugs, questionSlugs] = await Promise.all([
    getNewsRoutes(API_BASE_URL), // These now return arrays of slugs/ids
    getBlogRoutes(API_BASE_URL),
    getQuestionRoutes(API_BASE_URL)
  ]);

  // Generate dynamic routes with language prefixes
  let dynamicRoutesWithLang = [];
  languages.forEach(lang => {
      newsSlugs.forEach(slug => dynamicRoutesWithLang.push(`/${lang}/news/${slug}`));
      blogSlugs.forEach(slug => dynamicRoutesWithLang.push(`/${lang}/blog/${slug}`));
      questionSlugs.forEach(id => dynamicRoutesWithLang.push(`/${lang}/questions/${id}`));
  });

  console.log(`[Sitemap] Generated dynamic routes with lang prefix: ${dynamicRoutesWithLang.length} entries`);

  // Combine static (already prefixed) and dynamic (prefixed) routes
  const allRoutes = [...staticRoutesWithLang, ...dynamicRoutesWithLang];
  const uniqueRoutes = [...new Set(allRoutes)]; // Final deduplication
  console.log(`[Sitemap] Total unique routes for sitemap: ${uniqueRoutes.length}`);

  // Return the defineConfig result inside the async IIFE
  return defineConfig({ // <--- Return the actual config object
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      sitemap({
        hostname: HOSTNAME,
        dynamicRoutes: uniqueRoutes, // <--- Use the pre-fetched array
        robots: [
          {
            userAgent: '*',
            allow: '/',
            disallow: ['.git/', '/node_modules/'],
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
          target: 'http://localhost:3000', // Corrected: Added port 3000
          changeOrigin: true,
        }
      }
    }
    // Add build options if necessary, e.g., for sourcemaps
    // build: {
    //   sourcemap: true,
    // }
  });
})(); // <--- End and execute async IIFE
