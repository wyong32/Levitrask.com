// api/news.js (Simplified for Vercel Debugging)

function simpleNewsHandler(req, res) {
  console.log('[API Simple Handler - news.js] Request received for:', req.originalUrl || req.url);
  // Directly send a success response without DB or complex logic
  res.status(200).json({ 
      message: 'Simple news handler reached successfully!',
      path: req.originalUrl || req.url
  });
}

console.log('[API Simple Handler - news.js] Module loaded, exporting simpleNewsHandler...');
module.exports = simpleNewsHandler; 