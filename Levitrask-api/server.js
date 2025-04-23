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

// --- 静态加载 API 路由 --- 
console.log('[Server] Loading API routers statically...');
try {
  const newsRouter = require('./api/news');
  const blogsRouter = require('./api/blogs');
  const questionsRouter = require('./api/questions');

  // 可以在这里加一层验证，确保require成功
  if (!newsRouter || !blogsRouter || !questionsRouter) {
      throw new Error('One or more routers failed to load.');
  }

  app.use('/api/news', newsRouter);
  console.log('  ✓ Mounted router for: /api/news');
  app.use('/api/blogs', blogsRouter);
  console.log('  ✓ Mounted router for: /api/blogs');
  app.use('/api/questions', questionsRouter);
  console.log('  ✓ Mounted router for: /api/questions');

} catch (error) {
    console.error('[Server] Failed to load or mount routers:', error);
    // 可以在这里决定是否让服务器启动失败
    // process.exit(1); // 如果加载路由失败则退出
}

// --- 启动服务器 ---
app.listen(port, () => {
  console.log(`\n🚀 本地 API 服务器已启动: http://localhost:${port}`);
  console.log(`   允许来自源的请求: ${corsOptions.origin}`);
  console.log(`   数据库连接字符串使用 POSTGRES_URL 环境变量`);
}); 