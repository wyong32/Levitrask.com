import express, { Router } from 'express';
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const PROJECT_ID = 'levitrask';
const blogsRouter = Router();

// --- GET /api/blogs/ --- (Handles request for all blogs)
blogsRouter.get('/', async (req, res) => {
  console.log('[API Router - blogs.js] GET / (Fetching all blogs)');
  try {
    // ADDED list_image_alt to SELECT
    const result = await pool.query(
      'SELECT blog_id, list_title, list_date, list_image, list_image_alt FROM levitrask_blogs WHERE project_id = $1 ORDER BY list_date DESC, created_at DESC', 
      [PROJECT_ID]
    );
    const blogsData = result.rows.reduce((acc, row) => {
      acc[row.blog_id] = {
          id: row.blog_id,
          blog_id: row.blog_id,
          listTitle: row.list_title,
          listDate: row.list_date,
          // CHANGED: Use listImageSrc and listImageAlt to match frontend expectations
          listImageSrc: row.list_image, // Map db list_image to listImageSrc
          listImageAlt: row.list_image_alt // Map db list_image_alt to listImageAlt
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
    // Select sidebar_data directly
    const result = await pool.query('SELECT *, list_image_alt FROM levitrask_blogs WHERE project_id = $1 AND blog_id = $2', [PROJECT_ID, blogId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Blog with ID '${blogId}' not found.` });
    }

    const row = result.rows[0];
    
    // Parse nav_sections (keep existing logic)
    let navSectionsParsed = [];
    try { navSectionsParsed = typeof row.nav_sections === 'string' ? JSON.parse(row.nav_sections) : (row.nav_sections || []); } catch (e) { console.error('Error parsing nav_sections for blog:', blogId, e);}
    
    // Prepare response data
    const blogsData = {
        id: row.blog_id,
        blog_id: row.blog_id, 
        listTitle: row.list_title,
        listDescription: row.list_description,
        listImageSrc: row.list_image, 
        listImageAlt: row.list_image_alt, 
        listDate: row.list_date,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaKeywords: row.meta_keywords,
        navSections: navSectionsParsed, 
        // Directly use the sidebar_data from DB (should be array or null)
        sidebarData: row.sidebar_data || [], // Return empty array if null
        content: row.content,
      };

    res.status(200).json(blogsData);

  } catch (error) {
    console.error(`Error fetching blog with ID ${blogId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- POST /api/blogs/ --- (Create - ADD stringify)
blogsRouter.post('/', authenticateAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/blogs request received`);
  
  // Destructure expected fields, including the new sidebar_data array
  const {
    slug,             
    listTitle,        
    listDate,         
    listImageSrc,     
    listImageAlt,     
    listDescription,  
    metaTitle,        
    metaDescription,  
    metaKeywords,     
    navSections,      
    sidebarData, // Expecting an array of {title, html_content, display_order?}
    content           
  } = req.body;
  
  const blogId = slug;

  // Basic validation (keep existing checks)
  if (!blogId || !listTitle || !listImageSrc || !listImageAlt || !metaTitle || !metaDescription || !content) {
      console.warn('[Validation Failed] Missing required fields for blog. Received:', { blogId, listTitle, listImageSrc: listImageSrc ? '[provided]' : '[missing]', listImageAlt: listImageAlt ? '[provided]' : '[missing]', metaTitle, metaDescription, content: content ? '[provided]' : '[missing]' });
      return res.status(400).json({ message: 'Missing required fields (slug/ID, listTitle, listImageSrc, listImageAlt, metaTitle, metaDescription, content)' });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blogId)) {
      console.warn(`[Validation Failed] Invalid ID/Slug format for blog. Received ID: '${blogId}'`);
      return res.status(400).json({ message: 'Invalid ID/Slug format.' });
  }

  // --- Validate and prepare sidebar_data and nav_sections for DB --- 
  let sidebarDataForDb = null; 
  if (sidebarData && Array.isArray(sidebarData)) {
      const isValid = sidebarData.every(block => 
          typeof block === 'object' && block !== null && 
          typeof block.title === 'string' && typeof block.html_content === 'string'
      );
      if (isValid) {
          sidebarDataForDb = sidebarData;
      } else {
          console.warn(`[Validation Failed - POST /api/blogs] Invalid structure inside sidebarData array for blog ID: ${blogId}`);
          sidebarDataForDb = []; // Or null
      }
  } else if (sidebarData) {
       console.warn(`[Validation Failed - POST /api/blogs] sidebarData was provided but is not an array for blog ID: ${blogId}`);
       sidebarDataForDb = []; 
  }

  const navSectionsData = Array.isArray(navSections) ? navSections : [];

  // === ADD JSON.stringify() here ===
  // Stringify arrays before passing to INSERT query
  const sidebarDataString = sidebarDataForDb !== null ? JSON.stringify(sidebarDataForDb) : null;
  const navSectionsString = JSON.stringify(navSectionsData);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO levitrask_blogs (
        blog_id, project_id, list_title, list_date, list_image, list_image_alt, 
        list_description, meta_title, meta_description, meta_keywords,
        nav_sections, sidebar_data, content,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING blog_id;
    `;

    // === Pass the STRINGIFIED values ===
    const values = [
      blogId,               // $1
      PROJECT_ID,           // $2
      listTitle,            // $3
      listDate,             // $4
      listImageSrc,         // $5
      listImageAlt,         // $6
      listDescription,      // $7
      metaTitle,            // $8
      metaDescription,      // $9
      metaKeywords,         // $10
      navSectionsString,    // $11 (Pass stringified array)
      sidebarDataString,    // $12 (Pass stringified array or null)
      content               // $13
    ];

    console.log('Executing INSERT with stringified sidebarData:', sidebarDataString);
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

// --- PUT /api/blogs/:id --- (Update - RE-ADD stringify)
blogsRouter.put('/:id', authenticateAdmin, async (req, res) => {
  const blogId = req.params.id;
  console.log(`[${new Date().toISOString()}] PUT /api/blogs/${blogId} request received`);
  
  // Destructure fields, including sidebarData array
  const {
    listTitle, listDate, listImageSrc, listImageAlt, listDescription,
    metaTitle, metaDescription, metaKeywords,
    navSections, 
    sidebarData, 
    content
  } = req.body;

  // Basic validation (keep existing)
  if (!listTitle || !listImageSrc || !listImageAlt || !metaTitle || !metaDescription || !content) {
     return res.status(400).json({ message: 'Missing required fields for update (listTitle, listImageSrc, listImageAlt, metaTitle, metaDescription, content)' });
  }

  // --- Validate and prepare sidebar_data and nav_sections for DB --- 
  let sidebarDataForDb = null; 
  if (sidebarData && Array.isArray(sidebarData)) {
      const isValid = sidebarData.every(block => 
          typeof block === 'object' && block !== null && 
          typeof block.title === 'string' && typeof block.html_content === 'string'
      );
      if (isValid) {
          sidebarDataForDb = sidebarData;
      } else {
           console.warn(`[Validation Failed - PUT /api/blogs/${blogId}] Invalid structure inside sidebarData array.`);
           sidebarDataForDb = []; // Or null
      }
  } else if (sidebarData) {
       console.warn(`[Validation Failed - PUT /api/blogs/${blogId}] sidebarData was provided but is not an array.`);
       sidebarDataForDb = []; 
  }
  
  const navSectionsData = Array.isArray(navSections) ? navSections : [];

  // === RE-ADD JSON.stringify() ===
  // Stringify the arrays before passing to the UPDATE query
  // Use null for sidebarData if it should be null, otherwise stringify the array (even empty)
  const sidebarDataString = sidebarDataForDb !== null ? JSON.stringify(sidebarDataForDb) : null;
  // Always stringify navSections as it defaults to []
  const navSectionsString = JSON.stringify(navSectionsData); 

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE levitrask_blogs SET
        list_title = $1,
        list_date = $2,
        list_image = $3,        
        list_image_alt = $4,    
        list_description = $5,
        meta_title = $6,
        meta_description = $7,
        meta_keywords = $8,
        nav_sections = $9,     
        sidebar_data = $10,    
        content = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = $12 AND blog_id = $13
      RETURNING blog_id;
    `;

    // === Pass the STRINGIFIED values ===
    const values = [
      listTitle,            // $1
      listDate,             // $2
      listImageSrc,         // $3
      listImageAlt,         // $4
      listDescription,      // $5
      metaTitle,            // $6
      metaDescription,      // $7
      metaKeywords,         // $8
      navSectionsString,    // $9  (Pass stringified array)
      sidebarDataString,    // $10 (Pass stringified array or null)
      content,              // $11
      PROJECT_ID,           // $12
      blogId                // $13
    ];
    
    // Log the values JUST BEFORE the query for debugging
    console.log(`Executing UPDATE for blog ${blogId} with stringified values:`, 
      values.map((v, i) => `\n  $${i + 1}: ${v}`) // Log directly, they are strings now
    );

    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        console.warn(`Attempted to update non-existent blog with ID: ${blogId}`);
        return res.status(404).json({ message: `Blog with ID '${blogId}' not found, update failed.` });
    }

    await client.query('COMMIT');
    console.log(`Blog updated successfully: ${result.rows[0].blog_id}`);
    res.status(200).json({ message: 'Blog updated successfully', blogId: result.rows[0].blog_id });

  } catch (error) {
    await client.query('ROLLBACK');
    // Log the specific error from the database
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