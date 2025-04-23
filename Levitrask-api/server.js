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
  console.log('[Server] Requiring news router...');
  const newsRouter = require('./api/news');
  console.log('[Server] --- Detailed Check for newsRouter --- ');
  console.log(`[Server] typeof newsRouter: ${typeof newsRouter}`);
  if (newsRouter && typeof newsRouter === 'object') {
    console.log(`[Server] newsRouter keys: ${Object.keys(newsRouter)}`);
    console.log(`[Server] newsRouter.stack exists?: ${!!newsRouter.stack}`);
    // Avoid logging the entire object if it might be huge or circular
  } else if (typeof newsRouter === 'function') {
      console.log(`[Server] newsRouter is a function. Stack exists?: ${!!newsRouter.stack}`);
  } else {
    console.log(`[Server] newsRouter value: ${newsRouter}`);
  }
  console.log('[Server] --- End Detailed Check for newsRouter --- ');
  if (!newsRouter || typeof newsRouter !== 'function' || !newsRouter.stack) {
    throw new Error('Failed to load a valid newsRouter.');
  }
  app.use('/api/news', newsRouter);
  console.log('  ✓ Mounted router for: /api/news');

  console.log('[Server] Requiring blogs router...');
  const blogsRouter = require('./api/blogs');
  console.log('[Server] --- Detailed Check for blogsRouter --- ');
  console.log(`[Server] typeof blogsRouter: ${typeof blogsRouter}`);
  if (blogsRouter && typeof blogsRouter === 'object') {
    console.log(`[Server] blogsRouter keys: ${Object.keys(blogsRouter)}`);
    console.log(`[Server] blogsRouter.stack exists?: ${!!blogsRouter.stack}`);
  } else if (typeof blogsRouter === 'function') {
      console.log(`[Server] blogsRouter is a function. Stack exists?: ${!!blogsRouter.stack}`);
  } else {
    console.log(`[Server] blogsRouter value: ${blogsRouter}`);
  }
  console.log('[Server] --- End Detailed Check for blogsRouter --- ');
   if (!blogsRouter || typeof blogsRouter !== 'function' || !blogsRouter.stack) {
    throw new Error('Failed to load a valid blogsRouter.');
  }
  app.use('/api/blogs', blogsRouter);
  console.log('  ✓ Mounted router for: /api/blogs');

  console.log('[Server] Requiring questions router...');
  const questionsRouter = require('./api/questions');
  console.log('[Server] --- Detailed Check for questionsRouter --- ');
  console.log(`[Server] typeof questionsRouter: ${typeof questionsRouter}`);
  if (questionsRouter && typeof questionsRouter === 'object') {
    console.log(`[Server] questionsRouter keys: ${Object.keys(questionsRouter)}`);
    console.log(`[Server] questionsRouter.stack exists?: ${!!questionsRouter.stack}`);
  } else if (typeof questionsRouter === 'function') {
      console.log(`[Server] questionsRouter is a function. Stack exists?: ${!!questionsRouter.stack}`);
  } else {
    console.log(`[Server] questionsRouter value: ${questionsRouter}`);
  }
  console.log('[Server] --- End Detailed Check for questionsRouter --- ');
   if (!questionsRouter || typeof questionsRouter !== 'function' || !questionsRouter.stack) {
    throw new Error('Failed to load a valid questionsRouter.');
  }
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