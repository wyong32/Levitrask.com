const pool = require('../utils/db');
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

  // Call the original handler
  return handler(req, res);
};
// --- End CORS Helper ---

// Original handler logic
const newsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    // Note: CORS headers are already set by the wrapper even for errors
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // This query assumes the 'levitrask_news' table and 'project_id', 'news_id' columns exist
    const result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1', [PROJECT_ID]);

    // Transform array of rows into an object keyed by news_id
    const newsData = result.rows.reduce((acc, row) => {
      // Assuming the column name in the DB is 'news_id' which corresponds to the keys in original JS data
      const newsIdKey = row.news_id; 
      if (newsIdKey) {
          // Reconstruct the object structure similar to the original newsData.js
          // We might need to adjust column names based on the actual table schema
          acc[newsIdKey] = {
              id: newsIdKey, // Use news_id from DB as id
              listTitle: row.list_title,
              listDate: row.list_date,
              listSource: row.list_source,
              listImage: { // Reconstruct nested object
                  src: row.list_image_src,
                  alt: row.list_image_alt,
              },
              listDescription: row.list_description,
              metaTitle: row.meta_title,
              metaDescription: row.meta_description,
              metaKeywords: row.meta_keywords,
              content: row.content, 
              // Add other fields if necessary, matching original structure
          };
      }
      return acc;
    }, {});

    res.status(200).json(newsData); // Send back the transformed object
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