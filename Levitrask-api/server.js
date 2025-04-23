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

// --- 动态加载 API 路由 (添加详细日志) ---
const apiDir = path.join(__dirname, 'api');
console.log(`[Server] Loading API routers from: ${apiDir}`);

fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.js')) {
    const routeName = path.basename(file, '.js');
    const mountPath = `/api/${routeName}`;
    const filePath = path.join(apiDir, file);
    console.log(`[Server] Processing file: ${file}`);
    try {
      console.log(`[Server] Attempting to require router from: ${filePath}`);
      const routerModule = require(filePath);
      console.log(`[Server] Required module for ${file}. Type: ${typeof routerModule}`);

      // More specific check for Express Router
      if (routerModule && typeof routerModule === 'function' && routerModule.stack) {
         console.log(`[Server]   ✓ Module is a valid Router. Mounting at: ${mountPath}`);
         app.use(mountPath, routerModule);
      } else {
         // Log details if it's not a valid router
         console.warn(`[Server]   ✗ Skipping ${file}: Exported module is NOT a valid Express Router.`);
         // Avoid logging the whole object if it's large or circular
         if (routerModule && typeof routerModule === 'object') {
            console.warn(`[Server]   -> Exported value keys: ${Object.keys(routerModule).join(', ')}`);
         } else {
            console.warn(`[Server]   -> Exported value: ${routerModule}`);
         }
      }
    } catch (error) {
      // Log require/mount errors specifically
      console.error(`[Server]   ✗ Error requiring or mounting router ${routeName} from ${file}:`, error);
    }
  }
});

// --- 启动服务器 ---
app.listen(port, () => {
  console.log(`\n🚀 本地 API 服务器已启动: http://localhost:${port}`);
  console.log(`   允许来自源的请求: ${corsOptions.origin}`);
  console.log(`   数据库连接字符串使用 POSTGRES_URL 环境变量`);
}); 