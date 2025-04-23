import express, { Router } from 'express';
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const PROJECT_ID = 'levitrask';
const blogsRouter = Router();

// --- GET /api/blogs/ --- (Handles request for all blogs)
blogsRouter.get('/', async (req, res) => {
  console.log('[API Router - blogs.js] GET / (Fetching all blogs)');
  try {
    // UPDATED: Select list_image column as well
    const result = await pool.query(
      'SELECT blog_id, list_title, list_date, list_image FROM levitrask_blogs WHERE project_id = $1 ORDER BY list_date DESC, created_at DESC', 
      [PROJECT_ID]
    );
    const blogsData = result.rows.reduce((acc, row) => {
      acc[row.blog_id] = {
          id: row.blog_id,
          blog_id: row.blog_id,
          listTitle: row.list_title,
          listDate: row.list_date,
          // UPDATED: Add listImage (containing Base64 or null)
          listImage: row.list_image 
      };
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
blogsRouter.get('/:id', async (req, res) => {
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
    // Prepare data, parsing JSON if stored as string, or handling potential nulls
    let navSectionsParsed = [];
    try { navSectionsParsed = typeof row.nav_sections === 'string' ? JSON.parse(row.nav_sections) : (row.nav_sections || []); } catch (e) { console.error('Error parsing nav_sections for blog:', blogId, e);}
    let sidebarDataParsed = {};
    try { sidebarDataParsed = typeof row.sidebar_data === 'string' ? JSON.parse(row.sidebar_data) : (row.sidebar_data || {}); } catch (e) { console.error('Error parsing sidebar_data for blog:', blogId, e);}

    const blogsData = {
        id: row.blog_id,
        blog_id: row.blog_id, // Include both for clarity if needed
        listTitle: row.list_title,
        listDescription: row.list_description,
        // Handle list_image potentially being split into src/alt or a single URL
        // Assuming it might be JSON like { src: '...', alt: '...'} or just a URL string
        listImage: typeof row.list_image === 'string' ? row.list_image : (row.list_image || {}),
        listDate: row.list_date,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaKeywords: row.meta_keywords,
        navSections: navSectionsParsed, // Return parsed array
        sidebarData: sidebarDataParsed, // Return parsed object
        content: row.content,
      };

    res.status(200).json(blogsData);

  } catch (error) {
    console.error(`Error fetching blog with ID ${blogId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- POST /api/blogs/ --- (Create)
blogsRouter.post('/', authenticateAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/blogs request received`);
  // Destructure with clear naming, matching frontend payload structure
  const {
    slug,             // blog_id in DB
    listTitle,        // list_title
    listDate,         // list_date
    listImage,        // { src: base64, alt: text }
    listDescription,  // list_description
    metaTitle,        // meta_title
    metaDescription,  // meta_description
    metaKeywords,     // meta_keywords
    navSections,      // nav_sections (JSONB)
    includeRelatedPosts, // boolean flag
    relatedPosts,     // relatedPosts (array for sidebar_data)
    includeFaqs,      // boolean flag
    faqs,             // faqs (array for sidebar_data)
    content           // content
  } = req.body;

  const blogId = slug; // Use slug as blog_id

  // Basic required fields validation (adjust as needed)
  // Note: listImage.alt is not used due to DB schema lacking a dedicated column
  if (!blogId || !listTitle || !listImage?.src || !metaTitle || !metaDescription || !content) {
      console.warn('[Validation Failed] Missing required fields for blog. Received:', { blogId, listTitle, listImageSrc: listImage?.src ? '[provided]' : '[missing]', metaTitle, metaDescription, content: content ? '[provided]' : '[missing]' });
      return res.status(400).json({ message: 'Missing required fields (slug/ID, listTitle, listImage.src, metaTitle, metaDescription, content)' });
  }
  // Slug format validation
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blogId)) {
      console.warn(`[Validation Failed] Invalid ID/Slug format for blog. Received ID: '${blogId}'`);
      return res.status(400).json({ message: 'Invalid ID/Slug format.' });
  }

  // --- Prepare data for DB insertion ---
  const listImageDataForDb = listImage?.src || null;
  const sidebarData = { // Combine sidebar related fields into one object
      includeRelatedPosts: !!includeRelatedPosts,
      relatedPosts: Array.isArray(relatedPosts) ? relatedPosts : [],
      includeFaqs: !!includeFaqs,
      faqs: Array.isArray(faqs) ? faqs : []
  };
  const navSectionsData = Array.isArray(navSections) ? navSections : [];

  // RE-ADDED: Explicitly stringify JSON data before sending to pg driver
  const sidebarDataJson = JSON.stringify(sidebarData);
  const navSectionsDataJson = JSON.stringify(navSectionsData);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO levitrask_blogs (
        blog_id, project_id, list_title, list_date, list_image,
        list_description, meta_title, meta_description, meta_keywords,
        nav_sections, sidebar_data, content,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING blog_id;
    `;

    // Pass the stringified JSON data to the query
    const values = [
      blogId,               // $1
      PROJECT_ID,           // $2
      listTitle,            // $3
      listDate,             // $4
      listImageDataForDb,   // $5
      listDescription,      // $6
      metaTitle,            // $7
      metaDescription,      // $8
      metaKeywords,         // $9
      navSectionsDataJson, // $10 - Pass stringified JSON
      sidebarDataJson,    // $11 - Pass stringified JSON
      content               // $12
    ];

    console.log('Executing INSERT with stringified JSON values:', { blogId, PROJECT_ID, listTitle });

    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');
    console.log(`Blog created successfully with ID: ${result.rows[0].blog_id}`);
    res.status(201).json({ message: 'Blog created successfully', blogId: result.rows[0].blog_id });

  } catch (error) {
    await client.query('ROLLBACK');
    // Handle unique constraint violation for blog_id
    if (error.code === '23505' && error.constraint === 'levitrask_blogs_blog_id_key') { // Check constraint name if possible
        console.warn(`Attempted to create blog with duplicate ID (Slug): '${blogId}'`);
        return res.status(409).json({ message: `Error creating blog: ID (Slug) '${blogId}' already exists.`});
    }
    // Handle other potential errors (e.g., invalid JSONB format if driver fails)
    console.error('Error creating blog:', error);
    // Provide a more generic error message to the client
    res.status(500).json({ message: 'Internal server error while creating blog.', error: error.message }); // Keep detailed error server-side
  } finally {
    client.release();
  }
});

// --- PUT /api/blogs/:id --- (Update)
blogsRouter.put('/:id', authenticateAdmin, async (req, res) => {
  const blogId = req.params.id;
  console.log(`[${new Date().toISOString()}] PUT /api/blogs/${blogId} request received`);
  // Destructure fields needed for update
  const {
    listTitle, listDate, listImage, listDescription,
    metaTitle, metaDescription, metaKeywords,
    navSections, includeRelatedPosts, relatedPosts, includeFaqs, faqs,
    content
  } = req.body;

  // UPDATED Validation: Removed check for listImage.alt
  if (!listTitle || !listImage?.src || !metaTitle || !metaDescription || !content) {
    console.warn(`[Validation Failed - PUT /api/blogs/${blogId}] Missing required fields. Received:`, { listTitle, listImageSrc: listImage?.src ? '[provided]' : '[missing]', metaTitle, metaDescription, content: content ? '[provided]' : '[missing]' });
    return res.status(400).json({ message: 'Missing required fields for update (listTitle, listImage.src, metaTitle, metaDescription, content)' });
  }

  // Prepare data for DB update (remains the same)
  const listImageDataForDb = listImage?.src || null;
  const sidebarData = {
      includeRelatedPosts: !!includeRelatedPosts,
      relatedPosts: Array.isArray(relatedPosts) ? relatedPosts : [],
      includeFaqs: !!includeFaqs,
      faqs: Array.isArray(faqs) ? faqs : []
  };
  const navSectionsData = Array.isArray(navSections) ? navSections : [];

  // Explicitly stringify JSON data (remains the same)
  const sidebarDataJson = JSON.stringify(sidebarData);
  const navSectionsDataJson = JSON.stringify(navSectionsData);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE levitrask_blogs SET
        list_title = $1,
        list_date = $2,
        list_image = $3,       -- Use list_image column
        list_description = $4,
        meta_title = $5,
        meta_description = $6,
        meta_keywords = $7,
        nav_sections = $8,     -- Pass stringified JSON for JSONB
        sidebar_data = $9,     -- Pass stringified JSON for JSONB
        content = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = $11 AND blog_id = $12
      RETURNING blog_id;
    `;

    const values = [
      listTitle,            // $1
      listDate,             // $2
      listImageDataForDb,   // $3 - Store Base64 in TEXT column
      listDescription,      // $4
      metaTitle,            // $5
      metaDescription,      // $6
      metaKeywords,         // $7
      navSectionsDataJson, // $8 - Pass stringified JSON
      sidebarDataJson,    // $9 - Pass stringified JSON
      content,              // $10
      PROJECT_ID,           // $11
      blogId                // $12
    ];

     console.log('Executing UPDATE for blogId:', blogId, 'with stringified JSON values:', { listTitle, project_id: PROJECT_ID }); // Avoid logging large fields

    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      console.warn(`Blog not found for update with ID: ${blogId}`);
      return res.status(404).json({ message: `Blog with ID '${blogId}' not found.` });
    }

    await client.query('COMMIT');
    console.log(`Blog updated successfully with ID: ${result.rows[0].blog_id}`);
    res.status(200).json({ message: 'Blog updated successfully', blogId: result.rows[0].blog_id });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating blog with ID ${blogId}:`, error);
    res.status(500).json({ message: 'Internal server error while updating blog.', error: error.message });
  } finally {
    client.release();
  }
});

// --- DELETE /api/blogs/:id --- (Delete)
blogsRouter.delete('/:id', authenticateAdmin, async (req, res) => {
  const blogId = req.params.id;
  console.log(`[${new Date().toISOString()}] DELETE /api/blogs/${blogId} request received`);
  // ... (Similar logic to DELETE /api/questions/:id) ...
  if (!blogId) { return res.status(400).json({ message: 'Missing blog ID' }); }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleteQuery = `DELETE FROM levitrask_blogs WHERE project_id = $1 AND blog_id = $2 RETURNING blog_id;`;
    const result = await client.query(deleteQuery, [PROJECT_ID, blogId]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK'); return res.status(404).json({ message: 'Blog not found' });
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Blog deleted successfully' }); 
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  } finally {
    client.release();
  }
});

export default blogsRouter; 