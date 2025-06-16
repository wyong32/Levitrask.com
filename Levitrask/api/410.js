export default function handler(req, res) {
  res.status(410).sendFile('index.html', { root: process.cwd() + '/dist' });
} 