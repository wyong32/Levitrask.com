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

// Modified handler logic
const blogsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const relativePath = req.url;
    const pathSegments = relativePath.split('/').filter(Boolean);

    let result;
    let blogsData;

    // Check if request is for a specific blog ID
    if (pathSegments.length === 1) {
      const blogId = pathSegments[0];
      console.log(`[API Handler - blogs.js] Fetching blog with ID: ${blogId}`);
      result = await pool.query('SELECT * FROM levitrask_blogs WHERE project_id = $1 AND blog_id = $2', [PROJECT_ID, blogId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: `Blog with ID '${blogId}' not found.` });
      }

      const row = result.rows[0];
      blogsData = {
        id: row.blog_id,
        listTitle: row.list_title,
        listDescription: row.list_description,
        listImage: row.list_image,
        listDate: row.list_date,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaKeywords: row.meta_keywords,
        navSections: row.nav_sections || [],
        sidebarData: row.sidebar_data || {},
        content: row.content,
      };

    } else if (pathSegments.length === 0) {
      // Request for all blogs
      console.log('[API Handler - blogs.js] Fetching all blogs');
      result = await pool.query('SELECT * FROM levitrask_blogs WHERE project_id = $1', [PROJECT_ID]);

      // Transform into object keyed by blog_id
      blogsData = result.rows.reduce((acc, row) => {
        const blogIdKey = row.blog_id;
        if (blogIdKey) {
          acc[blogIdKey] = {
            id: blogIdKey,
            listTitle: row.list_title,
            listDescription: row.list_description,
            listImage: row.list_image,
            listDate: row.list_date,
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            metaKeywords: row.meta_keywords,
            navSections: row.nav_sections || [],
            sidebarData: row.sidebar_data || {},
            content: row.content,
          };
        }
        return acc;
      }, {});
    } else {
      console.warn(`[API Handler - blogs.js] Invalid relative path: ${relativePath}`);
      return res.status(404).json({ message: 'Not Found' });
    }

    res.status(200).json(blogsData);

  } catch (error) {
    console.error('Error fetching blogs:', error);
    if (error.code === '42P01') {
        res.status(500).json({ message: 'Internal Server Error: Table "levitrask_blogs" does not exist.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

// Export the wrapped handler
module.exports = allowCors(blogsHandler); 