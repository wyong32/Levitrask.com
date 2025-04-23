import express from 'express';
import pool from '../utils/db.js';

const PROJECT_ID = 'levitrask';
const router = express.Router();

// --- GET /api/blogs/ --- (Handles request for all blogs)
router.get('/', async (req, res) => {
  console.log('[API Router - blogs.js] GET / (Fetching all blogs)');
  try {
    const result = await pool.query('SELECT * FROM levitrask_blogs WHERE project_id = $1', [PROJECT_ID]);

    // Transform into object keyed by blog_id
    const blogsData = result.rows.reduce((acc, row) => {
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

    res.status(200).json(blogsData);

  } catch (error) {
    console.error('Error fetching all blogs:', error);
    if (error.code === '42P01') {
        res.status(500).json({ message: 'Internal Server Error: Table "levitrask_blogs" does not exist.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

// --- GET /api/blogs/:id --- (Handles request for a single blog item)
router.get('/:id', async (req, res) => {
  const blogId = req.params.id;
  console.log(`[API Router - blogs.js] GET /:id (Fetching blog with ID: ${blogId})`);

  if (!blogId) {
      return res.status(400).json({ message: 'Blog ID parameter is missing.'});
  }

  try {
    const result = await pool.query('SELECT * FROM levitrask_blogs WHERE project_id = $1 AND blog_id = $2', [PROJECT_ID, blogId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Blog with ID '${blogId}' not found.` });
    }

    const row = result.rows[0];
    const blogsData = {
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

    res.status(200).json(blogsData);

  } catch (error) {
    console.error(`Error fetching blog with ID ${blogId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router; 