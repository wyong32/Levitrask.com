// Levitrask-api/server.js
require('dotenv').config(); // 加载 .env 文件变量
const express = require('express');
const cors = require('cors');    // 引入 cors 中间件
// const fs = require('fs'); // No longer needed for dynamic loading
// const path = require('path'); // No longer needed for dynamic loading

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

// --- 简化路由加载 (仅用于调试) --- 
console.log('[Server] Attemping to load simple news handler...');
try {
  const simpleNewsHandler = require('./api/news');

  if (typeof simpleNewsHandler === 'function') {
    // 使用精确路径匹配挂载简单处理器
    app.get('/api/news', simpleNewsHandler);
    app.get('/api/news/:id', simpleNewsHandler); // 让详情路径也能被捕获
    console.log('  ✓ Mounted simple handler for /api/news and /api/news/:id');
  } else {
      console.error('[Server] Failed: require("./api/news") did not return a function. Got:', typeof simpleNewsHandler);
      throw new Error('Simple news handler is not a function.');
  }

  // 其他路由暂时不加载
  console.log('[Server] Blogs and Questions routers are intentionally NOT loaded for this test.');

} catch (error) {
    console.error('[Server] Critical error during simplified handler loading:', error);
    // 可以在这里决定是否让服务器启动失败
    // process.exit(1); 
}

// --- 启动服务器 ---
app.listen(port, () => {
  console.log(`\n🚀 本地 API 服务器已启动: http://localhost:${port}`);
  console.log(`   允许来自源的请求: ${corsOptions.origin}`);
  console.log(`   数据库连接字符串使用 POSTGRES_URL 环境变量`);
}); 