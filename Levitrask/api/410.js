import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  // 设置 410 状态码
  res.status(410);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 读取并返回 index.html 内容
  const indexPath = join(process.cwd(), 'dist', 'index.html');
  const html = readFileSync(indexPath, 'utf-8');
  res.end(html);
} 