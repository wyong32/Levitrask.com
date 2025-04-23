const express = require('express');
const pool = require('../utils/db');
const PROJECT_ID = 'levitrask';

const router = express.Router();

// --- GET /api/news/ --- (Handles request for all news)
router.get('/', async (req, res) => {
  console.log('[API Router - news.js] GET / (Fetching all news)');
  try {
    const result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1', [PROJECT_ID]);

    // Transform array of rows into an object keyed by news_id
    const newsData = result.rows.reduce((acc, row) => {
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

    res.status(200).json(newsData);

  } catch (error) {
    console.error('Error fetching all news:', error);
    if (error.code === '42P01') {
        res.status(500).json({ message: 'Internal Server Error: Table "levitrask_news" does not exist.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

// --- GET /api/news/:id --- (Handles request for a single news item)
router.get('/:id', async (req, res) => {
  const newsId = req.params.id; // Get ID directly from route parameters
  console.log(`[API Router - news.js] GET /:id (Fetching news with ID: ${newsId})`);

  // Basic validation for the ID parameter if necessary (e.g., check format)
  if (!newsId) {
      return res.status(400).json({ message: 'News ID parameter is missing.'});
  }

  try {
    const result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1 AND news_id = $2', [PROJECT_ID, newsId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `News with ID '${newsId}' not found.` });
    }

    // Return the single news item
    const row = result.rows[0];
    const newsData = {
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

    res.status(200).json(newsData);

  } catch (error) {
    console.error(`Error fetching news with ID ${newsId}:`, error);
    // Avoid sending potentially sensitive error details unless needed for debugging
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Remove the allowCors wrapper as CORS is handled globally in server.js
module.exports = router; // Export the configured router 