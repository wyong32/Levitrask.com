const pool = require('../utils/db');
const { URL } = require('url'); // Import URL module to parse request URL
const PROJECT_ID = 'levitrask'; // Define project identifier

// --- CORS Helper Function ---
// This simple helper adds necessary CORS headers.
// Replace 'YOUR_FRONTEND_URL' with your actual frontend deployment URL
// or better, use an environment variable like process.env.FRONTEND_URL
const allowCors = (handler) => async (req, res) => {
  // IMPORTANT: Set this to your *actual* frontend deployment URL
  // e.g., 'https://levitrask-com.vercel.app'
  const allowedOrigin = process.env.FRONTEND_URL || '*'; // Use env var or '*' for testing

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request (sent by browsers before GET/POST etc.)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Pass the original req object which might have base path info if needed by handler
  // Although we'll rely on req.url which is modified by app.use
  return handler(req, res);
};
// --- End CORS Helper ---

// Modified handler logic to handle requests relative to the prefix used in app.use
const newsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    // Note: CORS headers are already set by the wrapper even for errors
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // req.url is now relative to the mount point (e.g., '/' or '/some-id')
    const relativePath = req.url;
    const pathSegments = relativePath.split('/').filter(Boolean); // e.g., [] for '/' or ['some-id'] for '/some-id'

    let result;
    let newsData;

    // Check if the request is for a specific news ID (path has one segment: the ID)
    if (pathSegments.length === 1) {
      const newsId = pathSegments[0]; // Get the ID from the relative path
      console.log(`[API Handler - news.js] Fetching news with ID: ${newsId}`);
      result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1 AND news_id = $2', [PROJECT_ID, newsId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: `News with ID '${newsId}' not found.` });
      }

      // Return the single news item
      const row = result.rows[0];
      newsData = {
        id: row.news_id,
        listTitle: row.list_title,
        listDate: row.list_date,
        listSource: row.list_source,
        listImage: { src: row.list_image_src, alt: row.list_image_alt },
        listDescription: row.list_description,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaKeywords: row.meta_keywords,
        content: row.content,
      };

    } else if (pathSegments.length === 0) { // Request is for the base path (e.g., '/api/news' -> '/')
      // Request for all news
      console.log('[API Handler - news.js] Fetching all news');
      result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1', [PROJECT_ID]);

      // Transform array of rows into an object keyed by news_id
      newsData = result.rows.reduce((acc, row) => {
        const newsIdKey = row.news_id;
        if (newsIdKey) {
            acc[newsIdKey] = {
                id: newsIdKey,
                listTitle: row.list_title,
                listDate: row.list_date,
                listSource: row.list_source,
                listImage: { src: row.list_image_src, alt: row.list_image_alt },
                listDescription: row.list_description,
                metaTitle: row.meta_title,
                metaDescription: row.meta_description,
                metaKeywords: row.meta_keywords,
                content: row.content,
            };
        }
        return acc;
      }, {});
    } else {
      // Invalid path relative to /api/news (e.g., /api/news/id/extra)
      console.warn(`[API Handler - news.js] Invalid relative path: ${relativePath}`);
      return res.status(404).json({ message: 'Not Found' });
    }

    res.status(200).json(newsData); // Send back the result

  } catch (error) {
    console.error('Error fetching news:', error);
    // Check if the error is due to the table not existing (common issue initially)
    if (error.code === '42P01') { // '42P01' is PostgreSQL's code for undefined_table
        res.status(500).json({ message: 'Internal Server Error: Table "news" does not exist. Please create it first.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

// Export the wrapped handler
module.exports = allowCors(newsHandler); 