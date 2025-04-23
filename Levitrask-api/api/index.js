// Levitrask-api/api/index.js (New Vercel Entry Point)
import 'dotenv/config'; // Load .env variables
import express from 'express';
import cors from 'cors'; // Import cors

// Import the refactored routers
import newsRouter from './news.js';
import blogsRouter from './blogs.js';
import questionsRouter from './questions.js';
import authRouter from './auth.js'; // <-- 引入认证路由

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

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Mount Routers ---
console.log('[API Entry] Mounting routers...');
app.use('/api/auth', authRouter); // <-- 挂载认证路由
console.log('  ✓ Mounted /api/auth');
app.use('/api/news', newsRouter);
console.log('  ✓ Mounted /api/news');
app.use('/api/blogs', blogsRouter);
console.log('  ✓ Mounted /api/blogs');
app.use('/api/questions', questionsRouter);
console.log('  ✓ Mounted /api/questions');

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