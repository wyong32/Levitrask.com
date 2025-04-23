import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../utils/db.js';

const router = express.Router();
const PROJECT_ID = 'levitrask'; // 确保项目 ID 一致

// --- POST /api/auth/login ---
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. 基本输入验证
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  let client;
  try {
    // 2. 查询用户信息
    console.log(`[API Auth] Attempting login for user: ${username}, project: ${PROJECT_ID}`);
    client = await pool.connect();
    const query = 'SELECT id, username, password_hash FROM admin_users WHERE project_id = $1 AND username = $2';
    const result = await client.query(query, [PROJECT_ID, username]);

    if (result.rows.length === 0) {
      console.log(`[API Auth] Login failed: User not found for ${username}`);
      // 注意：为安全起见，通常返回通用错误消息
      return res.status(401).json({ message: 'Invalid credentials.' }); 
    }

    const user = result.rows[0];

    // 3. 比较密码哈希值
    console.log(`[API Auth] User found for ${username}. Comparing password...`);
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.log(`[API Auth] Login failed: Password mismatch for ${username}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 4. 登录成功，生成 JWT
    console.log(`[API Auth] Login successful for ${username}. Generating JWT...`);
    
    // 从环境变量读取 JWT 密钥和有效期
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h'; // 默认 1 小时

    if (!jwtSecret) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
      return res.status(500).json({ message: 'Internal server configuration error.'});
    }

    const payload = {
      userId: user.id,
      username: user.username,
      projectId: PROJECT_ID // 可以包含项目 ID 或其他需要的信息
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

    // 5. 返回 Token
    console.log(`[API Auth] JWT generated for ${username}`);
    // 通常也将 token 放在 Authorization Header 中，但也可以放在 body
    res.status(200).json({ 
      message: 'Login successful', 
      token: token 
      // 可以选择性返回用户信息（去除密码哈希）
      // user: { id: user.id, username: user.username } 
    });

  } catch (error) {
    console.error('[API Auth] Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router; 