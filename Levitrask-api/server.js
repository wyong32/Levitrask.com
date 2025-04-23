// Levitrask-api/server.js
require('dotenv').config(); // 加载 .env 文件变量
const express = require('express');
const cors = require('cors');    // 引入 cors 中间件
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // 后端服务器监听端口，默认为 3000

// --- CORS 配置 ---
// 允许来自前端开发服务器的请求 (从 .env 获取 URL)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // 确认端口
  methods: ['GET', 'OPTIONS'], // 允许的方法
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions)); // 应用 CORS 中间件

// --- 动态加载 API 路由 (使用 Express Router) ---
const apiDir = path.join(__dirname, 'api');
console.log(`Loading API routers from: ${apiDir}`);

fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.js')) {
    const routeName = path.basename(file, '.js');
    const mountPath = `/api/${routeName}`; // e.g., '/api/news'
    try {
      // Require the router exported from the file
      const router = require(path.join(apiDir, file));
      // Check if it's a valid Express Router
      if (router && typeof router === 'function' && router.stack) {
         console.log(`  ✓ Mounting router for: ${mountPath}`);
         // Mount the router at the specified path
         app.use(mountPath, router); // <--- 修改为此
      } else {
         console.warn(`  ✗ Skipping ${file}: module does not export a valid Express Router.`);
      }
    } catch (error) {
      console.error(`  ✗ Error loading or mounting router ${routeName} from ${file}:`, error);
    }
  }
});

// --- 启动服务器 ---
app.listen(port, () => {
  console.log(`\n🚀 本地 API 服务器已启动: http://localhost:${port}`);
  console.log(`   允许来自源的请求: ${corsOptions.origin}`);
  console.log(`   数据库连接字符串使用 POSTGRES_URL 环境变量`);
}); 