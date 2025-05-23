import express, { Router } from 'express';
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const PROJECT_ID = 'levitrask';
const DEFAULT_LANG = 'en'; // Define default language
const blogsRouter = Router();

// --- Helper Functions (Similar to managed_pages.js) ---
const sanitizeLangCode = (lang) => {
    if (typeof lang === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return lang;
    }
    return null;
}

// Helper to extract translatable fields from body for Blogs
const extractBlogTranslatableFields = (body) => ({
    list_title: body.list_title || null,
    list_description: body.list_description || null,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    meta_keywords: body.meta_keywords || null,
    nav_sections: body.nav_sections && Array.isArray(body.nav_sections) ? JSON.stringify(body.nav_sections) : null,
    sidebar_data: body.sidebar_data && Array.isArray(body.sidebar_data) ? JSON.stringify(body.sidebar_data) : null,
    content: body.content || null,
    list_image_alt: body.list_image_alt || null,
});

// Helper to extract non-translatable fields from body for Blogs (for create)
const extractBlogNonTranslatableFields = (body) => ({
  blog_id: body.slug ? body.slug.trim() : null, // Frontend uses slug, map to blog_id (the slug column)
  list_image: body.listImageSrc || null, // Map from frontend naming
  list_date: body.listDate || null, // Map from frontend naming
});


// --- Admin Endpoints (Protected by authenticateAdmin) ---

// GET /api/blogs/admin - Get list of blogs for admin UI
blogsRouter.get('/admin', authenticateAdmin, async (req, res) => {
  console.log(`[API Blogs] GET /admin - Fetching list for admin (Project: ${PROJECT_ID})`);
  try {
    const query = `
      SELECT
        b.id,           -- Numeric ID
        b.blog_id,      -- Slug
        COALESCE(t_en.list_title, '[No Title - ' || b.blog_id || ']') AS list_title,
        b.updated_at    -- Use main table updated_at
      FROM levitrask_blogs b
      LEFT JOIN levitrask_blog_translations t_en ON b.id = t_en.blog_id AND t_en.language_code = $1
      WHERE b.project_id = $2
      ORDER BY b.list_date DESC, b.created_at DESC; -- Order by date from main table
    `;
    const result = await pool.query(query, [DEFAULT_LANG, PROJECT_ID]);
    console.log(`[API Blogs] Fetched ${result.rows.length} blogs for admin.`);
    // Send the raw rows, frontend expects an array of objects
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[API Blogs] Error fetching admin list:', error);
    res.status(500).json({ message: 'Internal Server Error fetching admin blog list.' });
  }
});

console.log('>>> Defining route: GET /admin/:id');

// GET /api/blogs/admin/:id - Get blog details (main data + default lang translation) for editing
blogsRouter.get('/admin/:id', authenticateAdmin, async (req, res) => {
  console.log(`>>> Handler invoked for GET /admin/:id. ID=${req.params.id}`);
  const { id } = req.params;
  const langToFetch = DEFAULT_LANG;
  console.log(`[API Blogs] GET /admin/:id - Fetching details for ID '${id}' (lang: ${langToFetch})`);

  if (isNaN(parseInt(id))) {
      console.warn(`[API Blogs] GET /admin/:id - Received non-numeric ID: ${id}`);
      return res.status(400).json({ message: 'Invalid Blog ID - Expected numeric ID.' });
  }

  try {
     const query = `
      SELECT
        b.id,               -- Numeric ID
        b.blog_id AS slug,  -- The slug
        b.list_date,
        b.list_image,
        b.created_at,
        b.updated_at,
        t.language_code,
        t.list_title,
        t.list_description,
        t.meta_title,
        t.meta_description,
        t.meta_keywords,
        t.nav_sections,
        t.sidebar_data,
        t.content,
        t.list_image_alt
      FROM
        levitrask_blogs b
      LEFT JOIN
        levitrask_blog_translations t ON b.id = t.blog_id AND t.language_code = $1
      WHERE
        b.id = $2 AND b.project_id = $3;
    `;
    const result = await pool.query(query, [langToFetch, id, PROJECT_ID]);

    if (result.rows.length === 0) {
       console.log(`[API Blogs] Admin fetch: Blog not found for ID '${id}'`);
       return res.status(404).json({ message: `Blog with ID '${id}' not found for editing.` });
    }

    const row = result.rows[0];
    const responseData = {
        id: row.id,
        slug: row.slug, // Use 'slug' consistent with frontend expectations
        list_date: row.list_date,
        list_image: row.list_image,
        created_at: row.created_at,
        updated_at: row.updated_at,
        translation: row.language_code ? { // Check if default translation exists
            language_code: row.language_code,
            list_title: row.list_title,
            list_description: row.list_description,
            meta_title: row.meta_title,
            meta_description: row.meta_description,
            meta_keywords: row.meta_keywords,
            nav_sections: row.nav_sections || [],
            sidebar_data: row.sidebar_data || [],
        content: row.content,
            list_image_alt: row.list_image_alt
        } : null
      };

    console.log(`[API Blogs] Successfully fetched details for admin edit: ID ${id}`);
    res.status(200).json(responseData);

  } catch (error) {
    console.error(`[API Blogs] Error fetching admin details for ID ${id}:`, error);
    res.status(500).json({ message: 'Internal Server Error fetching blog details for admin.' });
  }
});

// PUT /api/blogs/admin/:id - Update non-translatable blog fields
blogsRouter.put('/admin/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { slug, list_date, list_image } = req.body; // Extract fields from frontend payload
  console.log(`[API Blogs] PUT /admin/:id - Updating non-translatable fields for ID '${id}'`);

  if (isNaN(parseInt(id))) {
    console.warn(`[API Blogs] PUT /admin/:id - Invalid Blog ID: ${id}`);
    return res.status(400).json({ message: 'Invalid Blog ID - Expected numeric ID.' });
  }

  // Basic validation for slug (if provided, as it might not change)
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.warn(`[API Blogs] PUT /admin/:id - Invalid Slug format: ${slug}`);
    return res.status(400).json({ message: 'Invalid Slug format. Use lowercase letters, numbers, and hyphens.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Construct dynamic update query based on provided fields
    const fieldsToUpdate = [];
    const values = [];
    let valueIndex = 1;

    if (slug !== undefined) { // Allow updating slug
      fieldsToUpdate.push(`blog_id = $${valueIndex++}`);
      values.push(slug);
    }
    if (list_date !== undefined) { // Allow updating list_date (can be null)
      fieldsToUpdate.push(`list_date = $${valueIndex++}`);
      values.push(list_date);
    }
    if (list_image !== undefined) { // Allow updating list_image (can be null)
      fieldsToUpdate.push(`list_image = $${valueIndex++}`);
      values.push(list_image);
    }
    
    // Always update the updated_at timestamp
    fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);

    if (values.length === 0) {
        console.log(`[API Blogs] PUT /admin/:id - No fields provided for update for ID ${id}. Only timestamp will be updated.`);
        // If only timestamp update is desired, proceed, otherwise could return early
    }
    
    // Add the ID and project_id for the WHERE clause
    values.push(id); // $${valueIndex++}
    values.push(PROJECT_ID); // $${valueIndex}

    const updateQuery = `
      UPDATE levitrask_blogs
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${valueIndex} AND project_id = $${valueIndex + 1}
      RETURNING id, updated_at;
    `;

    console.log(`[API Blogs] Executing update query for ID ${id}:`, updateQuery);
    console.log(`[API Blogs] Values:`, values);
    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      console.log(`[API Blogs] PUT /admin/:id - Blog not found for ID '${id}' during update.`);
      return res.status(404).json({ message: `Blog with ID '${id}' not found.` });
    }

    await client.query('COMMIT');
    console.log(`[API Blogs] Successfully updated non-translatable fields for blog ID ${id}.`);
    res.status(200).json({ message: 'Blog base details updated successfully.', data: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    // Check for unique constraint violation on slug (blog_id)
    if (error.code === '23505' && error.constraint === 'levitrask_blogs_project_id_blog_id_key') { 
        console.error(`[API Blogs] PUT /admin/:id - Error: Slug '${slug}' already exists for project ${PROJECT_ID}.`, error);
        return res.status(409).json({ message: `错误：Slug '${slug}' 在此项目中已存在。请选择一个唯一的 Slug。` });
    } else {
        console.error(`[API Blogs] Error updating non-translatable fields for ID ${id}:`, error);
        res.status(500).json({ message: 'Internal Server Error updating blog base details.' });
    }
  } finally {
    client.release();
  }
});

// GET /api/blogs/admin/:id/translations/:lang - Get a specific translation
blogsRouter.get('/admin/:id/translations/:lang', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const langCode = sanitizeLangCode(req.params.lang);
    console.log(`[API Blogs] GET /admin/:id/translations/:lang - Fetching translation for blog ID '${id}', lang '${langCode}'`);

    if (isNaN(parseInt(id))) { return res.status(400).json({ message: 'Invalid Blog ID.' }); }
    if (!langCode) { return res.status(400).json({ message: 'Invalid or missing language code.' }); }

    try {
        const query = `
            SELECT
                language_code, list_title, list_description, meta_title, meta_description,
                meta_keywords, nav_sections, sidebar_data, content, list_image_alt
            FROM levitrask_blog_translations
            WHERE blog_id = $1 AND language_code = $2;
        `;
        const result = await pool.query(query, [id, langCode]);

        if (result.rows.length === 0) {
            console.log(`[API Blogs] Translation not found for blog ID ${id}, lang ${langCode}`);
            return res.status(404).json({ message: `Translation not found for language '${langCode}'.` });
        }

        const translationData = result.rows[0];
        translationData.sidebar_data = translationData.sidebar_data || []; // Ensure array
        translationData.nav_sections = translationData.nav_sections || []; // Ensure array

        console.log(`[API Blogs] Successfully fetched translation for blog ID ${id}, lang ${langCode}`);
        res.status(200).json(translationData);
    } catch (error) {
        console.error(`[API Blogs] Error fetching translation for blog ID ${id}, lang ${langCode}:`, error);
        res.status(500).json({ message: 'Internal Server Error fetching translation.' });
  }
});

// PUT /api/blogs/admin/:id/translations/:lang - Create or Update a specific translation
blogsRouter.put('/admin/:id/translations/:lang', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const langCode = sanitizeLangCode(req.params.lang);
    const translatableFields = extractBlogTranslatableFields(req.body);
    console.log(`[API Blogs] PUT /admin/:id/translations/:lang - Upserting translation for blog ID '${id}', lang '${langCode}'`);

    if (isNaN(parseInt(id))) { return res.status(400).json({ message: 'Invalid Blog ID.' }); }
    if (!langCode) { return res.status(400).json({ message: 'Invalid or missing language code.' }); }
    if (!translatableFields.list_title || !translatableFields.content || !translatableFields.meta_title || !translatableFields.meta_description || !translatableFields.list_image_alt) {
        return res.status(400).json({ message: 'Missing required translatable fields (title, content, meta title/desc, image alt).' });
    }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
        const pageCheckQuery = 'SELECT id FROM levitrask_blogs WHERE id = $1 AND project_id = $2';
        const pageCheckResult = await client.query(pageCheckQuery, [id, PROJECT_ID]);
        if (pageCheckResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Blog post with ID ${id} not found.` });
        }

        const upsertQuery = `
            INSERT INTO levitrask_blog_translations (
                blog_id, language_code, list_title, list_description, meta_title, meta_description,
                meta_keywords, nav_sections, sidebar_data, content, list_image_alt, updated_at
      )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            ON CONFLICT (blog_id, language_code)
            DO UPDATE SET
                list_title = EXCLUDED.list_title,
                list_description = EXCLUDED.list_description,
                meta_title = EXCLUDED.meta_title,
                meta_description = EXCLUDED.meta_description,
                meta_keywords = EXCLUDED.meta_keywords,
                nav_sections = EXCLUDED.nav_sections,
                sidebar_data = EXCLUDED.sidebar_data,
                content = EXCLUDED.content,
                list_image_alt = EXCLUDED.list_image_alt,
                updated_at = CURRENT_TIMESTAMP
            RETURNING language_code, updated_at;
        `;
    const values = [
            id,                     // $1 blog_id (FK)
            langCode,               // $2 language_code
            translatableFields.list_title,        // $3
            translatableFields.list_description,  // $4
            translatableFields.meta_title,        // $5
            translatableFields.meta_description,  // $6
            translatableFields.meta_keywords,     // $7
            translatableFields.nav_sections,      // $8
            translatableFields.sidebar_data,      // $9
            translatableFields.content,           // $10
            translatableFields.list_image_alt     // $11
        ];
        const result = await client.query(upsertQuery, values);
    await client.query('COMMIT');
        console.log(`[API Blogs] Successfully upserted translation for blog ID ${id}, lang ${langCode}`);
        res.status(200).json({ message: `Translation for ${langCode} updated successfully.`, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
        console.error(`[API Blogs] Error upserting translation for blog ID ${id}, lang ${langCode}:`, error);
        res.status(500).json({ message: 'Internal Server Error updating translation.', error: error.message });
  } finally {
    client.release();
  }
});

// POST /api/blogs/admin - Create a new blog (main record + potentially multiple translations) - CORRECTED
blogsRouter.post('/admin', authenticateAdmin, async (req, res) => {
  console.log(`[API Blogs] POST /admin - Creating new blog with potentially multiple translations.`);
  // Ensure req.body exists
  if (!req.body) {
      return res.status(400).json({ message: 'Request body is missing.' });
  }
  const { slug, list_date, list_image, translations } = req.body;

  // --- Basic Validation ---
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    return res.status(400).json({ message: 'Blog Slug is required and must be a non-empty string.' });
  }
  const trimmedSlug = slug.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
    return res.status(400).json({ message: 'Invalid Blog Slug format. Use lowercase letters, numbers, and hyphens.' });
  }
  if (!list_image || typeof list_image !== 'string' || !list_image.trim()) {
    return res.status(400).json({ message: 'List Image URL is required and must be a non-empty string.' });
  }
  // Validate translations object structure
  if (!translations || typeof translations !== 'object' || translations === null || Object.keys(translations).length === 0) {
    return res.status(400).json({ message: "At least one language translation must be provided in the 'translations' object." });
  }

  // Validate default language translation presence and required fields
  const defaultTranslation = translations[DEFAULT_LANG];
  if (!defaultTranslation || typeof defaultTranslation !== 'object' || defaultTranslation === null) {
    return res.status(400).json({ message: `Default language ('${DEFAULT_LANG}') translation is required and must be a valid object.` });
  }
  const requiredTranslatableFields = ['list_title', 'content', 'meta_title', 'meta_description', 'list_image_alt'];
  for (const field of requiredTranslatableFields) {
    if (!defaultTranslation[field] || typeof defaultTranslation[field] !== 'string' || !defaultTranslation[field].trim()) {
      return res.status(400).json({ message: `Missing or invalid required field '${field}' in default language ('${DEFAULT_LANG}') translation.` });
    }
  }

  // --- Database Operations ---
  let client; // Define client outside try block for finally
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Check uniqueness for blog_id (slug)
    const checkQuery = 'SELECT id FROM levitrask_blogs WHERE blog_id = $1 AND project_id = $2';
    const checkResult = await client.query(checkQuery, [trimmedSlug, PROJECT_ID]);
    if (checkResult.rowCount > 0) {
      await client.query('ROLLBACK'); // Rollback before sending response
      return res.status(409).json({ message: `Slug '${trimmedSlug}' already exists.` });
    }

    // 2. Insert main blog record
    const insertBlogQuery = `
      INSERT INTO levitrask_blogs (blog_id, project_id, list_image, list_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id;
    `;
    const blogValues = [trimmedSlug, PROJECT_ID, list_image.trim(), list_date];
    const blogResult = await client.query(insertBlogQuery, blogValues);
    const newBlogId = blogResult.rows[0].id;
    console.log(`[API Blogs] Inserted main blog record with ID: ${newBlogId}`);

    // 3. Insert translations
    const translationInsertPromises = [];
    const languageCodes = Object.keys(translations); // This should be line 352 or near it - SYNTAX VALID

    for (const langCode of languageCodes) {
        const sanitizedLang = sanitizeLangCode(langCode);
        const tData = translations[langCode];

        // Check if the translation data is valid and has required fields
        if (sanitizedLang && tData && typeof tData === 'object' && tData !== null && tData.list_title && tData.content) {
              const insertTranslationQuery = `
                  INSERT INTO levitrask_blog_translations (
                      blog_id, language_code, list_title, list_description, meta_title, meta_description,
                      meta_keywords, nav_sections, sidebar_data, content, list_image_alt, updated_at
                  )
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP);
              `;
              const translationValues = [
                  newBlogId,
                  sanitizedLang,
                  tData.list_title || null,
                  tData.list_description || null,
                  tData.meta_title || null,
                  tData.meta_description || null,
                  tData.meta_keywords || null,
                  (tData.nav_sections && Array.isArray(tData.nav_sections)) ? JSON.stringify(tData.nav_sections) : null,
                  (tData.sidebar_data && Array.isArray(tData.sidebar_data)) ? JSON.stringify(tData.sidebar_data) : null,
                  tData.content || null,
                  tData.list_image_alt || null
              ];
               console.log(`[API Blogs] Preparing insert for translation lang: ${sanitizedLang}`);
              translationInsertPromises.push(client.query(insertTranslationQuery, translationValues));
        } else {
           console.warn(`[API Blogs] Skipping translation insert for lang '${langCode}' due to missing title/content or invalid data.`);
        }
    } // End for loop

    // Execute all valid translation inserts
    await Promise.all(translationInsertPromises);

    await client.query('COMMIT');
    console.log(`[API Blogs] Successfully created new blog ID ${newBlogId} (Slug: ${trimmedSlug}) with provided translations.`);
    // Send 201 Created status code
    res.status(201).json({ message: 'Blog created successfully', data: { id: newBlogId, slug: trimmedSlug } });

  } catch (error) {
    // Ensure rollback happens on any error after BEGIN
    if (client) { 
        try { await client.query('ROLLBACK'); } catch (rollbackError) { console.error('Error during rollback:', rollbackError); }
    }
    console.error('[API Blogs - POST /admin] Error creating blog:', error);
    // Avoid sending detailed error messages to client in production
    res.status(500).json({ message: 'Internal Server Error creating blog.' }); // Simplified error message
  } finally {
    // Ensure client is released back to the pool
    if (client) {
      client.release();
    }
  }
}); // End POST /admin route

// DELETE /api/blogs/admin/:id - Delete a blog and ALL its translations
blogsRouter.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`[API Blogs] DELETE /admin/:id - Deleting blog ID '${id}'`);
  if (isNaN(parseInt(id))) { return res.status(400).json({ message: 'Invalid Blog ID.' }); }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
      // Delete translations first (due to FK constraint ON DELETE CASCADE should handle this, but explicit is safer)
      const deleteTranslationsQuery = 'DELETE FROM levitrask_blog_translations WHERE blog_id = $1';
      await client.query(deleteTranslationsQuery, [id]);
      // Delete the main blog record
      const deleteBlogQuery = 'DELETE FROM levitrask_blogs WHERE id = $1 AND project_id = $2 RETURNING blog_id';
      const deleteBlogResult = await client.query(deleteBlogQuery, [id, PROJECT_ID]);
      if (deleteBlogResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: `Blog with ID ${id} not found for deletion.` });
    }
    await client.query('COMMIT');
      console.log(`[API Blogs] Successfully deleted blog ID ${id} (Slug: ${deleteBlogResult.rows[0].blog_id}) and all translations`);
      res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
      console.error(`[API Blogs] Error deleting blog ID ${id}:`, error);
      res.status(500).json({ message: 'Internal Server Error deleting blog.', error: error.message });
  } finally {
    client.release();
  }
});

// --- Public Endpoints ---

// GET /api/blogs/ - Public list of blogs
blogsRouter.get('/', async (req, res) => {
  const lang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG;
  console.log(`[API Blogs] GET / (Public List) - Fetching list for lang '${lang}'`);
  try {
    const query = `
      SELECT
        b.blog_id AS slug,
        b.list_image,
        b.list_date,
        COALESCE(t_lang.list_title, t_default.list_title) AS list_title,
        COALESCE(t_lang.list_description, t_default.list_description) AS list_description,
        COALESCE(t_lang.list_image_alt, t_default.list_image_alt) AS list_image_alt
      FROM levitrask_blogs b
      LEFT JOIN levitrask_blog_translations t_lang ON b.id = t_lang.blog_id AND t_lang.language_code = $1
      LEFT JOIN levitrask_blog_translations t_default ON b.id = t_default.blog_id AND t_default.language_code = $2
      WHERE b.project_id = $3
        AND COALESCE(t_lang.list_title, t_default.list_title) IS NOT NULL
        AND COALESCE(t_lang.list_title, t_default.list_title) <> ''
      ORDER BY b.list_date DESC, b.created_at DESC;
    `;
    const result = await pool.query(query, [lang, DEFAULT_LANG, PROJECT_ID]);
    console.log(`[API Blogs] Fetched ${result.rows.length} blogs for public list (lang: ${lang}).`);
    // Format data for frontend (assuming frontend expects an array)
    const blogsData = result.rows.map(row => ({
        slug: row.slug,
        listTitle: row.list_title,
        listDescription: row.list_description,
        listImageSrc: row.list_image,
        listImageAlt: row.list_image_alt,
        listDate: row.list_date
    }));
    res.status(200).json(blogsData);
  } catch (error) {
    console.error(`[API Blogs] Error fetching public list for lang '${lang}':`, error);
    res.status(500).json({ message: 'Internal Server Error fetching public blog list.' });
  }
});

// GET /api/blogs/:lang/blog/:slug - Get public data for a specific blog post
blogsRouter.get('/:lang/blog/:slug', async (req, res) => {
  const { slug } = req.params;
  const requestedLang = sanitizeLangCode(req.params.lang);
  console.log(`[API Blogs] GET /:lang/blog/:slug (Public Detail) - Fetching lang '${requestedLang || DEFAULT_LANG}', slug '${slug}'`);

  if (!requestedLang) { console.warn(`[API Blogs] Invalid language code requested: ${req.params.lang}. Falling back to default.`); }
  if (!slug) { return res.status(400).json({ message: 'Blog slug parameter is missing.' }); }

  try {
    const query = `
      SELECT
        b.blog_id AS slug,
        b.list_date,
        b.list_image,
        b.created_at,
        b.updated_at,
        COALESCE(t_lang.list_title, t_default.list_title) AS list_title,
        COALESCE(t_lang.list_description, t_default.list_description) AS list_description,
        COALESCE(t_lang.meta_title, t_default.meta_title) AS meta_title,
        COALESCE(t_lang.meta_description, t_default.meta_description) AS meta_description,
        COALESCE(t_lang.meta_keywords, t_default.meta_keywords) AS meta_keywords,
        COALESCE(t_lang.nav_sections, t_default.nav_sections) AS nav_sections,
        COALESCE(t_lang.sidebar_data, t_default.sidebar_data) AS sidebar_data,
        COALESCE(t_lang.content, t_default.content) AS content,
        COALESCE(t_lang.list_image_alt, t_default.list_image_alt) AS list_image_alt
      FROM levitrask_blogs b
      LEFT JOIN levitrask_blog_translations t_lang ON b.id = t_lang.blog_id AND t_lang.language_code = $1
      LEFT JOIN levitrask_blog_translations t_default ON b.id = t_default.blog_id AND t_default.language_code = $2
      WHERE b.blog_id = $3 AND b.project_id = $4;
    `;
    const values = [requestedLang || DEFAULT_LANG, DEFAULT_LANG, slug, PROJECT_ID];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log(`[API Blogs] Public fetch: Blog not found for slug '${slug}'`);
      return res.status(404).json({ message: `Blog with slug '${slug}' not found.` });
    }

    const row = result.rows[0];
    // Check if essential content is missing even in fallback
    if (row.list_title === null && row.content === null) {
         console.warn(`Blog '${slug}' found, but no translation exists for requested language '${requestedLang || DEFAULT_LANG}' or default '${DEFAULT_LANG}'.`);
         return res.status(404).json({ message: `Content not available for blog '${slug}' in the requested language or default.` });
    }

    const blogData = {
        slug: row.slug,
        list_date: row.list_date,
        list_image: row.list_image,
        created_at: row.created_at,
        updated_at: row.updated_at,
        list_title: row.list_title,
        list_description: row.list_description,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        meta_keywords: row.meta_keywords,
        nav_sections: row.nav_sections || [],
        sidebar_data: row.sidebar_data || [],
        content: row.content,
        list_image_alt: row.list_image_alt
    };

    console.log(`[API Blogs] Successfully fetched public blog data for: lang '${requestedLang || DEFAULT_LANG}', slug '${slug}'`);
    res.status(200).json(blogData);

  } catch (error) {
    console.error(`[API Blogs] Error fetching public blog lang '${requestedLang || DEFAULT_LANG}' slug '${slug}':`, error);
    res.status(500).json({ message: 'Internal Server Error fetching blog data.' });
  }
});

export default blogsRouter; 