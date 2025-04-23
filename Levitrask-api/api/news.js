// api/news.js (Simplified for Vercel Debugging)

import express from 'express';
import pool from '../utils/db.js'; // 假设 db.js 也使用 export
// Assuming you have an auth middleware utility
// import verifyToken from '../middleware/auth.js'; // TODO: Implement and uncomment later

const PROJECT_ID = 'levitrask';
const router = express.Router();

// --- GET / --- (Handles request for all news)
router.get('/', async (req, res) => {
  console.log('[API Router - news.js] GET / (Fetching all news)');
  try {
    const result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1', [PROJECT_ID]);
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

// --- GET /:id --- (Handles request for a single news item)
router.get('/:id', async (req, res) => {
  const newsId = req.params.id;
  console.log(`[API Router - news.js] GET /:id (Fetching news with ID: ${newsId})`);
  if (!newsId) {
      return res.status(400).json({ message: 'News ID parameter is missing.'});
  }
  try {
    const result = await pool.query('SELECT * FROM levitrask_news WHERE project_id = $1 AND news_id = $2', [PROJECT_ID, newsId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `News with ID '${newsId}' not found.` });
    }
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
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- POST create a new news item (New route) ---
router.post('/', /* verifyToken, */ async (req, res) => {
    console.log('[API /api/news] POST request received');
    // TODO: Add authentication middleware here later to ensure only logged-in admins can create news
    
    const { 
        slug, 
        listTitle, 
        listDate, // Optional: YYYY-MM-DD or null
        listSource, 
        listImage, // Nested object: { src, alt }
        listDescription, 
        metaTitle, 
        metaDescription, 
        metaKeywords, 
        content 
    } = req.body; // Destructure from the request body

    const projectId = 'levitrask'; // Hardcode or get from env/config
    const listImageSrc = listImage?.src; // Extract src from nested object
    const listImageAlt = listImage?.alt; // Extract alt from nested object

    console.log('Received data for new news item:', req.body);

    // Basic validation (can add more robust validation)
    if (!slug || !listTitle || !listImageSrc || !listImageAlt || !listDescription || !metaTitle || !metaDescription || !metaKeywords || !content) {
        console.warn('[API /api/news] Validation failed: Missing required fields.');
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate slug format (same regex as frontend)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
         console.warn(`[API /api/news] Validation failed: Invalid slug format for slug: ${slug}`);
        return res.status(400).json({ message: 'Invalid slug format. Slug can only contain lowercase letters, numbers, and hyphens.'});
    }

    const client = await pool.connect();
    try {
        console.log('Executing INSERT query into levitrask_news...');
        const query = `
            INSERT INTO levitrask_news (
                news_id, project_id, list_title, list_date, list_source, 
                list_image_src, list_image_alt, list_description, 
                meta_title, meta_description, meta_keywords, content,
                created_at, updated_at 
            )
            VALUES ($1, $2, $3, COALESCE($4, TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD')), $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, news_id, list_title; -- Return some data to confirm insertion
        `;
        // Use COALESCE for list_date: if $4 is NULL, use current date formatted as YYYY-MM-DD
        const values = [
            slug, projectId, listTitle, listDate, listSource,
            listImageSrc, listImageAlt, listDescription,
            metaTitle, metaDescription, metaKeywords, content
        ];

        const result = await client.query(query, values);
        
        if (result.rowCount === 1) {
            console.log(`[API /api/news] Successfully inserted news item with ID: ${result.rows[0].id}, news_id: ${result.rows[0].news_id}`);
            res.status(201).json({ 
                message: 'News item created successfully', 
                newsItem: result.rows[0] 
            });
        } else {
             console.error('[API /api/news] INSERT query did not return expected row count.');
             res.status(500).json({ message: 'Failed to create news item after query execution' });
        }

    } catch (err) {
         // Check for unique constraint violation (e.g., duplicate slug/news_id for the project)
        if (err.code === '23505') { // PostgreSQL unique violation code
             console.warn(`[API /api/news] Error: Duplicate news_id (slug) '${slug}' for project '${projectId}'.`);
             res.status(409).json({ message: `Error: News slug '${slug}' already exists. Please use a unique slug.` });
        } else {
            console.error('[API /api/news] Error inserting news item:', err.stack);
            res.status(500).json({ message: 'Error creating news item', error: err.message });
        }
    } finally {
        client.release();
        console.log('[API /api/news] Database client released after POST request.');
    }
});

// --- DELETE a news item by news_id (slug) (New route) ---
router.delete('/:id', /* verifyToken, */ async (req, res) => {
    const newsId = req.params.id; // Get news_id (slug) from URL parameter
    const projectId = 'levitrask'; // Filter by project
    
    console.log(`[API /api/news/:id] DELETE request received for news_id: ${newsId}`);
    // TODO: Add authentication middleware here later

    if (!newsId) {
        return res.status(400).json({ message: 'Missing news ID (slug) in URL parameter' });
    }

    const client = await pool.connect();
    try {
        console.log(`Executing DELETE query for news_id: ${newsId}, project_id: ${projectId}...`);
        const query = `
            DELETE FROM levitrask_news 
            WHERE news_id = $1 AND project_id = $2
            RETURNING id; -- Optional: return id to confirm deletion
        `;
        const values = [newsId, projectId];
        
        const result = await client.query(query, values);

        if (result.rowCount === 1) {
            console.log(`[API /api/news/:id] Successfully deleted news item with news_id: ${newsId}`);
            // Send 200 OK with message or 204 No Content
            res.status(200).json({ message: 'News item deleted successfully' }); 
            // Or res.status(204).send(); 
        } else {
            // If rowCount is 0, it means no news item with that id/project combination was found
            console.warn(`[API /api/news/:id] News item with news_id: ${newsId} and project_id: ${projectId} not found for deletion.`);
            res.status(404).json({ message: 'News item not found' });
        }

    } catch (err) {
        console.error(`[API /api/news/:id] Error deleting news item with news_id: ${newsId}:`, err.stack);
        res.status(500).json({ message: 'Error deleting news item', error: err.message });
    } finally {
        client.release();
        console.log('[API /api/news/:id] Database client released after DELETE request.');
    }
});

// --- PUT update an existing news item by news_id (slug) (New route) ---
router.put('/:id', /* verifyToken, */ async (req, res) => {
    const newsId = req.params.id; // Get news_id (slug) from URL parameter
    const projectId = 'levitrask'; // Filter by project
    
    console.log(`[API /api/news/:id] PUT request received for news_id: ${newsId}`);
    // TODO: Add authentication middleware here later

    const { 
        // Note: Frontend might send the slug in payload, but we usually don't allow changing the ID/slug easily.
        // We'll ignore payload.slug if sent, and only use the one from the URL parameter.
        listTitle, 
        listDate, 
        listSource, 
        listImage, // { src, alt }
        listDescription, 
        metaTitle, 
        metaDescription, 
        metaKeywords, 
        content 
    } = req.body; // Destructure updated data from the request body

    const listImageSrc = listImage?.src;
    const listImageAlt = listImage?.alt;

    console.log('Received data for news item update:', req.body);

    // Basic validation for required fields (similar to POST, but maybe allow partial updates later?)
    if (!listTitle || !listImageSrc || !listImageAlt || !listDescription || !metaTitle || !metaDescription || !metaKeywords || !content) {
        console.warn('[API /api/news/:id] PUT Validation failed: Missing required fields.');
        return res.status(400).json({ message: 'Missing required fields for update' });
    }
    
    // No need to validate slug format here as we are using the existing one from the URL

    const client = await pool.connect();
    try {
        console.log(`Executing UPDATE query for news_id: ${newsId}, project_id: ${projectId}...`);
        const query = `
            UPDATE levitrask_news 
            SET 
                list_title = $1, 
                list_date = COALESCE($2, TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD')), 
                list_source = $3,
                list_image_src = $4, 
                list_image_alt = $5, 
                list_description = $6, 
                meta_title = $7, 
                meta_description = $8, 
                meta_keywords = $9, 
                content = $10,
                updated_at = CURRENT_TIMESTAMP
            WHERE news_id = $11 AND project_id = $12
            RETURNING id, news_id; -- Optional: return id to confirm update
        `;
        const values = [
            listTitle, listDate, listSource,
            listImageSrc, listImageAlt, listDescription,
            metaTitle, metaDescription, metaKeywords, content,
            newsId, projectId // WHERE clause parameters
        ];
        
        const result = await client.query(query, values);

        if (result.rowCount === 1) {
            console.log(`[API /api/news/:id] Successfully updated news item with news_id: ${newsId}`);
            res.status(200).json({ 
                message: 'News item updated successfully', 
                updatedItem: { news_id: newsId } // Indicate which item was updated
            }); 
        } else {
            // If rowCount is 0, it means no news item with that id/project combination was found
            console.warn(`[API /api/news/:id] News item with news_id: ${newsId} and project_id: ${projectId} not found for update.`);
            res.status(404).json({ message: 'News item not found for update' });
        }

    } catch (err) {
        // Note: Unique constraint errors are less likely on UPDATE unless changing the slug (which we prevent here)
        console.error(`[API /api/news/:id] Error updating news item with news_id: ${newsId}:`, err.stack);
        res.status(500).json({ message: 'Error updating news item', error: err.message });
    } finally {
        client.release();
        console.log('[API /api/news/:id] Database client released after PUT request.');
    }
});

// TODO: Add route for GET /api/news/:id (Get single item details)

export default router; // 使用 ES Module 导出 