// Levitrask-api/api/index.js (New Vercel Entry Point)
import 'dotenv/config'; // Load .env variables
import express from 'express';
import cors from 'cors'; // Import cors
import path from 'path';
import { fileURLToPath } from 'url';

// Import the refactored routers
import newsRouter from './news.js';
import blogsRouter from './blogs.js';
import questionsRouter from './questions.js';
import adminQuestionsRouter from './admin_questions.js'; // Admin question routes
import authRouter from './auth.js'; // <-- 引入认证路由
// Restore original homepage router import
import homepageRouter from './admin_homepage.js'; // Restored original import
// import { registerHomepageRoutes } from './admin_homepage.js'; // Commented out function import
import contentRouter from './content.js'; 
import sidebarsRouter from './sidebars.js'; // <--- 添加引入
import managedPagesRouter from './managed_pages.js'; // <-- 引入新的 managed pages 路由

// Determine __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Option 1: Rely solely on vercel.json for CORS (remove this section)
// Option 2: Keep Express CORS middleware as backup/for local dev
//           (Make sure FRONTEND_URL env var is set correctly)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'], // 允许 POST, DELETE, PUT
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // If you need credentials/cookies
};
app.use(cors(corsOptions)); 

// Body parsing middleware (Temporarily commented out for testing POST)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger middleware
app.use('/api', (req, res, next) => {
  console.log(`[Request Logger] Received request: ${req.method} ${req.originalUrl}`);
  next(); // Continue to next middleware/router
});

// !!!!! TEMPORARY TEST ROUTE !!!!!
app.get('/api/managed-pages', (req, res) => {
  console.log('>>>> TEST ROUTE /api/managed-pages HIT <<<<');
  res.status(200).json({ message: 'Test route hit!', type: req.query.type, lang: req.query.lang });
});
// !!!!! END TEMPORARY TEST ROUTE !!!!!

// --- Mount Routers / Register Routes ---
console.log('[API Entry] Mounting/Registering routers...');

// 1. Mount MOST specific admin routes first
app.use('/api/admin/questions', adminQuestionsRouter); 
console.log('  ✓ Mounted /api/admin/questions');
app.use('/api/admin/homepage', homepageRouter); // Restore mounting the router
console.log('  ✓ Mounted /api/admin/homepage (blocks)');

// 2. Mount other specific resource routes
app.use('/api/auth', authRouter);
console.log('  ✓ Mounted /api/auth');
app.use('/api/news', newsRouter);
console.log('  ✓ Mounted /api/news');
app.use('/api/blogs', blogsRouter);
console.log('  ✓ Mounted /api/blogs');
app.use('/api/questions', questionsRouter); // Public questions
console.log('  ✓ Mounted /api/questions (public)');
app.use('/api/managed-pages', managedPagesRouter);
console.log('  ✓ Mounted /api/managed-pages');
app.use('/api/sidebars', sidebarsRouter);
console.log('  ✓ Mounted /api/sidebars');

// 4. Mount more general routes LAST
app.use('/api', contentRouter); // Generic public content getter
console.log('  ✓ Mounted /api (public content)');

// --- Static Files Serving (for production build) ---
// Serve static files from the Vue build directory
const buildPath = path.join(__dirname, '../../../Levitrask/dist');
console.log(`Serving static files from: ${buildPath}`);
app.use(express.static(buildPath));

// --- SPA Fallback (for production) ---
// Handle any requests that don't match the ones above by serving the index.html file
app.get('*.*.', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// --- Export the Express app for Vercel ---
console.log('[API Entry] Exporting Express app for Vercel...');
export default app;

// --- Listener for Local Development (Optional but Recommended) ---
// This block allows running `node api/index.js` locally
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n[Local Server] Running on http://localhost:${PORT}`);
        console.log(`   CORS configured for origin: ${corsOptions.origin}`);
        console.log('   Ensure POSTGRES_URL and JWT_SECRET are set in .env for local DB access.'); // 提示需要 JWT_SECRET
    });
} 