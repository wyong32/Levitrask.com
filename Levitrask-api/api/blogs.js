const pool = require('../utils/db');
const PROJECT_ID = 'levitrask'; // Define project identifier

// --- CORS Helper Function ---
const allowCors = (handler) => async (req, res) => {
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return handler(req, res);
};
// --- End CORS Helper ---

// Original handler logic
const blogsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Query the new table name
    const result = await pool.query('SELECT * FROM levitrask_blogs WHERE project_id = $1', [PROJECT_ID]);

    // Transform array of rows into an object keyed by blog_id
    const blogsData = result.rows.reduce((acc, row) => {
      const blogIdKey = row.blog_id;
      if (blogIdKey) {
        // Directly use the values from JSONB columns (pg driver parses them)
        acc[blogIdKey] = {
            id: blogIdKey,
            listTitle: row.list_title,
            listDescription: row.list_description,
            listImage: row.list_image, // Directly use the image path string
            listDate: row.list_date,
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            metaKeywords: row.meta_keywords,
            navSections: row.nav_sections || [],  // Use directly, default to empty array
            sidebarData: row.sidebar_data || {},  // Use directly, default to empty object
            content: row.content,
        };
      }
      return acc;
    }, {});

    res.status(200).json(blogsData); // Send back the transformed object

  } catch (error) {
    console.error('Error fetching blogs:', error);
    if (error.code === '42P01') { // undefined_table
        res.status(500).json({ message: 'Internal Server Error: Table "levitrask_blogs" does not exist. Please create it first.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

// Export the wrapped handler
module.exports = allowCors(blogsHandler); 