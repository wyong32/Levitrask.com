export default function handler(req, res) {
  // 设置 410 状态码
  res.status(410);
  // 设置 Location 头，重定向到 /en/404
  res.setHeader('Location', '/en/404');
  // 返回 410 状态码和重定向
  res.end();
} 