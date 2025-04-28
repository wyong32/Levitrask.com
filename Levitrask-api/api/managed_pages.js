import { Router } from 'express';
import pool from '../../Levitrask-api/utils/db.js';
import { authenticateAdmin } from '../../Levitrask-api/middleware/authMiddleware.js';

const PROJECT_ID = 'levitrask';
const DEFAULT_LANG = 'en'; // Define default language
const managedPagesRouter = Router();

// Helper to sanitize page type from query/params
const sanitizePageType = (type) => {
  // Basic sanitization: allow only letters, numbers, hyphens
  if (typeof type === 'string' && /^[a-z0-9-]+$/.test(type)) {
    return type;
  }
  return null; // Invalid or missing type
};

const sanitizeLangCode = (lang) => {
    // Allow standard language codes like en, zh-CN, etc.
    if (typeof lang === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return lang;
    }
    return null;
}

// Helper to extract translatable fields from body
const extractTranslatableFields = (body) => ({
    list_title: body.list_title || null,
    list_description: body.list_description || null,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    meta_keywords: body.meta_keywords || null,
    content: body.content || null,
    sidebar_data: body.sidebar_data && Array.isArray(body.sidebar_data) ? JSON.stringify(body.sidebar_data) : null,
    nav_sections: body.nav_sections && Array.isArray(body.nav_sections) ? JSON.stringify(body.nav_sections) : null,
});

// Helper to extract non-translatable fields from body (for create)
const extractNonTranslatableFields = (body) => ({
  page_identifier: body.page_identifier ? body.page_identifier.trim() : null,
  page_type: sanitizePageType(body.page_type)
});

// --- Admin Endpoints (Protected by authenticateAdmin) ---

// GET /api/managed-pages/admin?type=drug - Get list of pages for a specific type
// UPDATED: Join with translations to get default language list_title
managedPagesRouter.get('/admin', authenticateAdmin, async (req, res) => {
  const pageType = sanitizePageType(req.query.type);
  console.log(`[API Managed Pages] GET /admin?type=${pageType} - Fetching list for admin (Project: ${PROJECT_ID})`);

  if (!pageType) {
      return res.status(400).json({ message: 'Missing or invalid \'type\' query parameter.' });
  }

  try {
    // Join with translations to get the English list_title
    const query = `
      SELECT 
        p.id,
        p.page_identifier,
        p.sort_order, -- Include sort_order in selection
        COALESCE(t_en.list_title, '[No Title - ' || p.page_identifier || ']') AS list_title, -- Fallback title
        p.updated_at -- Use main table's updated_at for overall last modified? Or translation's? Main seems better.
      FROM levitrask_managed_pages p
      LEFT JOIN levitrask_managed_page_translations t_en ON p.id = t_en.managed_page_id AND t_en.language_code = $1
      WHERE p.project_id = $2 AND p.page_type = $3
      ORDER BY p.sort_order ASC NULLS LAST, p.page_identifier ASC; -- Order by sort_order first, then identifier as tie-breaker
    `;
    const result = await pool.query(query, [DEFAULT_LANG, PROJECT_ID, pageType]);
    
    console.log(`[API Managed Pages] Fetched ${result.rows.length} pages for type '${pageType}' sorted by sort_order.`);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error(`[API Managed Pages] Error fetching admin list for type '${pageType}':`, error);
    res.status(500).json({ message: 'Internal Server Error fetching admin list.' });
  }
});

// GET /api/managed-pages/admin/:type/:identifier - Get page details (main data + default lang translation) for editing
// UPDATED: Fetches main page data + specific language translation (defaulting to 'en')
managedPagesRouter.get('/admin/:type/:identifier', authenticateAdmin, async (req, res) => {
  const pageType = sanitizePageType(req.params.type);
  const { identifier } = req.params;
  const langToFetch = DEFAULT_LANG; // Always fetch default lang for initial edit form population
  console.log(`[API Managed Pages] GET /admin/:type/:identifier - Fetching details for type '${pageType}', id '${identifier}' (lang: ${langToFetch})`);

   if (!pageType) {
      return res.status(400).json({ message: 'Invalid page type in URL.' });
   }
   if (!identifier) {
    return res.status(400).json({ message: 'Page identifier parameter is missing.' });
  }

  try {
     // Query to get main page data and join with the specified language translation
     const query = `
      SELECT 
        p.id,
        p.page_identifier,
        p.page_type,
        p.created_at,
        p.updated_at,
        t.language_code,
        t.list_title,
        t.list_description,
        t.meta_title,
        t.meta_description,
        t.meta_keywords,
        t.content,
        t.sidebar_data,
        t.nav_sections
      FROM
        levitrask_managed_pages p
      LEFT JOIN
        levitrask_managed_page_translations t ON p.id = t.managed_page_id AND t.language_code = $1
      WHERE
        p.page_identifier = $2 AND p.page_type = $3 AND p.project_id = $4;
    `;
    const result = await pool.query(query, [langToFetch, identifier, pageType, PROJECT_ID]);

    if (result.rows.length === 0) {
       console.log(`[API Managed Pages] Admin fetch: Page not found for type '${pageType}', id '${identifier}'`);
       return res.status(404).json({ message: `Page with identifier '${identifier}' of type '${pageType}' not found for editing.` });
    }
    
    const row = result.rows[0];
    // Structure the response clearly separating main data and translation data (or nulls if no translation)
    const responseData = {
        // Main page data
        id: row.id,
        page_identifier: row.page_identifier,
        page_type: row.page_type,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Translation data for the requested language (or null if not found)
        translation: row.language_code ? { // Check if translation exists
            language_code: row.language_code,
            list_title: row.list_title,
            list_description: row.list_description,
            meta_title: row.meta_title,
            meta_description: row.meta_description,
            meta_keywords: row.meta_keywords,
            content: row.content,
            sidebar_data: row.sidebar_data || [],
            nav_sections: row.nav_sections || []
        } : null
    };

    console.log(`[API Managed Pages] Successfully fetched details for admin edit: ${pageType}/${identifier}`);
    res.status(200).json(responseData);

  } catch (error) {
    console.error(`[API Managed Pages] Error fetching details for ${pageType}/${identifier}:`, error);
    res.status(500).json({ message: 'Internal Server Error fetching page details for admin.' });
  }
});

// ** NEW ** GET /api/managed-pages/admin/:id/translations/:lang - Get a specific translation
managedPagesRouter.get('/admin/:id/translations/:lang', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const langCode = sanitizeLangCode(req.params.lang);

    console.log(`[API Managed Pages] GET /admin/:id/translations/:lang - Fetching translation for page ID '${id}', lang '${langCode}'`);

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid Page ID.' });
    }
    if (!langCode) {
        return res.status(400).json({ message: 'Invalid or missing language code.' });
    }

    try {
        const query = `
            SELECT
                language_code, list_title, list_description, meta_title, meta_description,
                meta_keywords, content, sidebar_data, nav_sections
            FROM levitrask_managed_page_translations
            WHERE managed_page_id = $1 AND language_code = $2;
        `;
        const result = await pool.query(query, [id, langCode]);

        if (result.rows.length === 0) {
            console.log(`[API Managed Pages] Translation not found for page ID ${id}, lang ${langCode}`);
            return res.status(404).json({ message: `Translation not found for language '${langCode}'.` });
        }

        const translationData = result.rows[0];
        translationData.sidebar_data = translationData.sidebar_data || [];
        translationData.nav_sections = translationData.nav_sections || [];

        console.log(`[API Managed Pages] Successfully fetched translation for page ID ${id}, lang ${langCode}`);
        res.status(200).json(translationData);

    } catch (error) {
        console.error(`[API Managed Pages] Error fetching translation for page ID ${id}, lang ${langCode}:`, error);
        res.status(500).json({ message: 'Internal Server Error fetching translation.' });
  }
});

// ** NEW ** PUT /api/managed-pages/admin/:id/translations/:lang - Create or Update a specific translation
managedPagesRouter.put('/admin/:id/translations/:lang', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const langCode = sanitizeLangCode(req.params.lang);
    const translatableFields = extractTranslatableFields(req.body);

    console.log(`[API Managed Pages] PUT /admin/:id/translations/:lang - Upserting translation for page ID '${id}', lang '${langCode}'`);

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid Page ID.' });
    }
    if (!langCode) {
        return res.status(400).json({ message: 'Invalid or missing language code.' });
    }
     // Basic validation for required translatable fields (adjust as needed)
     if (!translatableFields.meta_title || !translatableFields.meta_description || !translatableFields.content) {
        return res.status(400).json({ message: 'Missing required fields: Meta Title, Meta Description, and Content are required for translation.' });
     }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if the main page exists
        const pageCheckQuery = 'SELECT id FROM levitrask_managed_pages WHERE id = $1 AND project_id = $2';
        const pageCheckResult = await client.query(pageCheckQuery, [id, PROJECT_ID]);
        if (pageCheckResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Managed Page with ID ${id} not found.` });
        }

        // UPSERT logic
        const upsertQuery = `
            INSERT INTO levitrask_managed_page_translations (
                managed_page_id, language_code, list_title, list_description,
                meta_title, meta_description, meta_keywords, content,
                sidebar_data, nav_sections, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            ON CONFLICT (managed_page_id, language_code)
            DO UPDATE SET
                list_title = EXCLUDED.list_title,
                list_description = EXCLUDED.list_description,
                meta_title = EXCLUDED.meta_title,
                meta_description = EXCLUDED.meta_description,
                meta_keywords = EXCLUDED.meta_keywords,
                content = EXCLUDED.content,
                sidebar_data = EXCLUDED.sidebar_data,
                nav_sections = EXCLUDED.nav_sections,
        updated_at = CURRENT_TIMESTAMP 
            RETURNING language_code, updated_at;
    `;
    const values = [
            id,                     // $1 managed_page_id
            langCode,               // $2 language_code
            translatableFields.list_title,        // $3
            translatableFields.list_description,  // $4
            translatableFields.meta_title,        // $5
            translatableFields.meta_description,  // $6
            translatableFields.meta_keywords,     // $7
            translatableFields.content,           // $8
            translatableFields.sidebar_data,      // $9
            translatableFields.nav_sections       // $10
        ];

        const result = await client.query(upsertQuery, values);
        await client.query('COMMIT');

        console.log(`[API Managed Pages] Successfully upserted translation for page ID ${id}, lang ${langCode}`);
        res.status(200).json({ message: `Translation for ${langCode} updated successfully.`, data: result.rows[0] });

  } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[API Managed Pages] Error upserting translation for page ID ${id}, lang ${langCode}:`, error);
        res.status(500).json({ message: 'Internal Server Error updating translation.', error: error.message });
    } finally {
        client.release();
  }
});

// *** NEW *** PUT /api/managed-pages/admin/reorder - Update sort order for multiple pages
managedPagesRouter.put('/admin/reorder', authenticateAdmin, async (req, res) => {
    const { pageType, orderedPages } = req.body;
    const sanitizedPageType = sanitizePageType(pageType);

    console.log(`[API Managed Pages] PUT /admin/reorder - Updating order for type '${sanitizedPageType}'`);

    if (!sanitizedPageType) {
        return res.status(400).json({ message: 'Invalid or missing pageType.' });
    }
    if (!Array.isArray(orderedPages) || orderedPages.length === 0) {
        return res.status(400).json({ message: 'Missing or invalid orderedPages array.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log(`[API Managed Pages] Reorder Transaction Started for type ${sanitizedPageType}`);

        const updatePromises = orderedPages.map(page => {
            if (!page.page_identifier || typeof page.sort_order !== 'number') {
                console.error('[API Managed Pages] Invalid item in orderedPages:', page);
                throw new Error('Invalid data format in orderedPages array.'); // Abort transaction
            }
            const query = `
                UPDATE levitrask_managed_pages
                SET sort_order = $1, updated_at = CURRENT_TIMESTAMP
                WHERE page_identifier = $2 AND page_type = $3 AND project_id = $4;
            `;
            // Log the specific update being attempted
            // console.log(`  -> Updating ${page.page_identifier} to sort_order ${page.sort_order}`); 
            return client.query(query, [
                page.sort_order,
                page.page_identifier,
                sanitizedPageType,
                PROJECT_ID
            ]);
        });

        await Promise.all(updatePromises);

        await client.query('COMMIT');
        console.log(`[API Managed Pages] Reorder Transaction Committed for type ${sanitizedPageType}`);
        res.status(200).json({ message: 'Page order updated successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[API Managed Pages] Error updating page order for type '${sanitizedPageType}', transaction rolled back:`, error);
        if (error.message.includes('Invalid data format')) {
             res.status(400).json({ message: error.message });
        } else {
             res.status(500).json({ message: 'Internal Server Error updating page order.' });
        }
    } finally {
        client.release();
    }
});

// PUT /api/managed-pages/admin/:id - Update page and a specific translation
managedPagesRouter.put('/admin/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const translatableFields = extractTranslatableFields(req.body);

    console.log(`[API Managed Pages] PUT /admin/:id - Updating page ID '${id}'`);

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid Page ID.' });
    }
     // Basic validation for required translatable fields (adjust as needed)
     if (!translatableFields.meta_title || !translatableFields.meta_description || !translatableFields.content) {
        return res.status(400).json({ message: 'Missing required fields: Meta Title, Meta Description, and Content are required for translation.' });
     }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if the main page exists
        const pageCheckQuery = 'SELECT id FROM levitrask_managed_pages WHERE id = $1 AND project_id = $2';
        const pageCheckResult = await client.query(pageCheckQuery, [id, PROJECT_ID]);
        if (pageCheckResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Managed Page with ID ${id} not found.` });
        }

        // Update main page record
        const updatePageQuery = `
            UPDATE levitrask_managed_pages
            SET page_type = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND project_id = $3;
        `;
        const updatePageValues = [
            req.body.page_type,
            id,
            PROJECT_ID
        ];
        await client.query(updatePageQuery, updatePageValues);

        // UPSERT logic for the specific language translation (using the dedicated translation endpoint logic)
        const langCodeToUpdate = DEFAULT_LANG; // Update the default language translation with this PUT
        const upsertTranslationQuery = `
            INSERT INTO levitrask_managed_page_translations (
                managed_page_id, language_code, list_title, list_description,
                meta_title, meta_description, meta_keywords, content,
                sidebar_data, nav_sections, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            ON CONFLICT (managed_page_id, language_code)
            DO UPDATE SET
                list_title = EXCLUDED.list_title,
                list_description = EXCLUDED.list_description,
                meta_title = EXCLUDED.meta_title,
                meta_description = EXCLUDED.meta_description,
                meta_keywords = EXCLUDED.meta_keywords,
                content = EXCLUDED.content,
                sidebar_data = EXCLUDED.sidebar_data,
                nav_sections = EXCLUDED.nav_sections,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const translationValues = [
            id,                     // $1 managed_page_id
            langCodeToUpdate,       // $2 language_code
            translatableFields.list_title,        // $3
            translatableFields.list_description,  // $4
            translatableFields.meta_title,        // $5
            translatableFields.meta_description,  // $6
            translatableFields.meta_keywords,     // $7
            translatableFields.content,           // $8
            translatableFields.sidebar_data,      // $9
            translatableFields.nav_sections       // $10
        ];
        await client.query(upsertTranslationQuery, translationValues);

        await client.query('COMMIT');
        console.log(`[API Managed Pages] Successfully updated page ID ${id}`);
        res.status(200).json({ message: 'Page updated successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[API Managed Pages] Error updating page ID ${id}:`, error);
        res.status(500).json({ message: 'Internal Server Error updating page.', error: error.message });
    } finally {
        client.release();
    }
});

// DELETE /api/managed-pages/admin/:id - Delete a page and its translations
managedPagesRouter.delete('/admin/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`[API Managed Pages] DELETE /admin/:id - Deleting page ID '${id}'`);

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid Page ID.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete translations
        const deleteTranslationsQuery = 'DELETE FROM levitrask_managed_page_translations WHERE managed_page_id = $1';
        await client.query(deleteTranslationsQuery, [id]);
        console.log(`[API Managed Pages] Deleted translations for page ID ${id}`);

        // Delete main page record
        const deletePageQuery = 'DELETE FROM levitrask_managed_pages WHERE id = $1';
        const deletePageResult = await client.query(deletePageQuery, [id]);

        if (deletePageResult.rowCount === 0) {
            await client.query('ROLLBACK');
            console.error(`[API Managed Pages] Failed to delete main page record for ID ${id} after deleting translations.`);
            return res.status(500).json({ message: 'Inconsistency during deletion. Page may be partially deleted.' });
        }

        await client.query('COMMIT');
        console.log(`[API Managed Pages] Successfully deleted page ID ${id} and all translations`);
        res.status(204).send(); // No Content on success

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[API Managed Pages] Error deleting page ID ${id}:`, error);
        res.status(500).json({ message: 'Internal Server Error deleting page.', error: error.message });
    } finally {
        client.release();
    }
});

// POST /api/managed-pages/admin - Create a new managed page (main record + first translation)
// UPDATED: Accepts languageCode, creates main record and first translation record
managedPagesRouter.post('/admin', authenticateAdmin, async (req, res) => {
  console.log(`[API Managed Pages] POST /admin - Creating new page`);

  const nonTranslatable = extractNonTranslatableFields(req.body);
  const translatable = extractTranslatableFields(req.body);
  const langCode = sanitizeLangCode(req.body.languageCode) || DEFAULT_LANG; // Default to 'en' if not provided or invalid

  // --- Validation ---
  if (!nonTranslatable.page_type) {
      return res.status(400).json({ message: 'Page Type is required and must be valid.' });
  }
  if (!nonTranslatable.page_identifier) {
    return res.status(400).json({ message: 'Page Identifier (Slug) is required.' });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nonTranslatable.page_identifier)) {
    return res.status(400).json({ message: 'Invalid Page Identifier format.' });
  }
   // Basic check for essential translated content
  if (!translatable.meta_title || !translatable.meta_description || !translatable.content) {
     return res.status(400).json({ message: 'Missing required fields: Meta Title, Meta Description, and Content.' });
  }
  // --- End Validation ---

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check uniqueness for identifier + type + project
    const checkQuery = 'SELECT id FROM levitrask_managed_pages WHERE page_identifier = $1 AND page_type = $2 AND project_id = $3';
    const checkResult = await client.query(checkQuery, [nonTranslatable.page_identifier, nonTranslatable.page_type, PROJECT_ID]);
    if (checkResult.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: `Identifier '${nonTranslatable.page_identifier}' already exists for type '${nonTranslatable.page_type}'.` });
    }

    // Insert new page main record
    const insertPageQuery = `
      INSERT INTO levitrask_managed_pages (page_identifier, page_type, project_id, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id;
    `;
    const pageValues = [nonTranslatable.page_identifier, nonTranslatable.page_type, PROJECT_ID];
    const pageResult = await client.query(insertPageQuery, pageValues);
    const newPageId = pageResult.rows[0].id;

    // Insert the first translation record
    const insertTranslationQuery = `
        INSERT INTO levitrask_managed_page_translations (
            managed_page_id, language_code, list_title, list_description,
            meta_title, meta_description, meta_keywords, content,
            sidebar_data, nav_sections, updated_at
      )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP);
    `;
     const translationValues = [
        newPageId,              // $1 managed_page_id
        langCode,               // $2 language_code
        translatable.list_title,        // $3
        translatable.list_description,  // $4
        translatable.meta_title,        // $5
        translatable.meta_description,  // $6
        translatable.meta_keywords,     // $7
        translatable.content,           // $8
        translatable.sidebar_data,      // $9
        translatable.nav_sections       // $10
    ];
    await client.query(insertTranslationQuery, translationValues);

    await client.query('COMMIT');

    console.log(`[API Managed Pages] Successfully created new page ID ${newPageId} (Identifier: ${nonTranslatable.page_identifier}, Type: ${nonTranslatable.page_type}) with first translation in ${langCode}.`);
    res.status(201).json({
        message: 'Page created successfully',
        data: {
            id: newPageId,
            page_identifier: nonTranslatable.page_identifier,
            page_type: nonTranslatable.page_type,
            languageCode: langCode
        }
     });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[API Managed Pages - POST /admin] Error creating page type '${nonTranslatable.page_type}':`, error);
    res.status(500).json({ message: 'Internal Server Error creating page.', error: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/managed-pages/admin/:type/:identifier - Delete a page and ALL its translations
// UPDATED: Uses transaction to delete from both tables
managedPagesRouter.delete('/admin/:type/:identifier', authenticateAdmin, async (req, res) => {
  const pageType = sanitizePageType(req.params.type);
  const { identifier } = req.params;
  console.log(`[API Managed Pages] DELETE /admin/:type/:identifier - Deleting page type '${pageType}', id '${identifier}'`);

  if (!pageType) {
    return res.status(400).json({ message: 'Invalid page type in URL.' });
  }
  if (!identifier) {
    return res.status(400).json({ message: 'Page identifier parameter is missing.' });
  }

  const client = await pool.connect();
  try {
      await client.query('BEGIN');

      // 1. Find the page ID
      const findIdQuery = 'SELECT id FROM levitrask_managed_pages WHERE page_identifier = $1 AND page_type = $2 AND project_id = $3';
      const findResult = await client.query(findIdQuery, [identifier, pageType, PROJECT_ID]);

      if (findResult.rowCount === 0) {
          await client.query('ROLLBACK');
          console.log(`[API Managed Pages] Page not found for deletion: ${pageType}/${identifier}`);
          return res.status(404).json({ message: `Page not found for deletion: type '${pageType}', id '${identifier}'` });
      }
      const pageIdToDelete = findResult.rows[0].id;

      // 2. Delete all translations for this page ID
      const deleteTranslationsQuery = 'DELETE FROM levitrask_managed_page_translations WHERE managed_page_id = $1';
      await client.query(deleteTranslationsQuery, [pageIdToDelete]);
      console.log(`[API Managed Pages] Deleted translations for page ID ${pageIdToDelete}`);

      // 3. Delete the main page record
      const deletePageQuery = 'DELETE FROM levitrask_managed_pages WHERE id = $1';
      const deletePageResult = await client.query(deletePageQuery, [pageIdToDelete]);

      if (deletePageResult.rowCount === 0) {
           // This shouldn't happen if ID was found, but good to check
           await client.query('ROLLBACK');
           console.error(`[API Managed Pages] Failed to delete main page record for ID ${pageIdToDelete} after deleting translations.`);
           return res.status(500).json({ message: 'Inconsistency during deletion. Page may be partially deleted.' });
      }

      await client.query('COMMIT');

      console.log(`[API Managed Pages] Successfully deleted page: ${pageType}/${identifier} (ID: ${pageIdToDelete}) and all translations`);
      res.status(204).send(); // No Content on success

  } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[API Managed Pages] Error deleting page ${pageType}/${identifier}:`, error);
      res.status(500).json({ message: 'Internal Server Error deleting page.', error: error.message });
  } finally {
      client.release();
  }
});

// --- Public Endpoints ---

// GET /api/managed-pages?type=drug - Get list of pages for a specific type for public dropdown/listing
// UPDATED: Join with translations table for list_title, filter by default lang? Or any available lang? Any seems better.
managedPagesRouter.get('/', async (req, res) => {
  // ***** 新增日志 *****
  console.log(`>>> [PUBLIC MANAGED PAGES / ENTRY] Request received for type: ${req.query.type}, lang: ${req.query.lang}`);
  // ***** 结束新增 *****

  const pageType = sanitizePageType(req.query.type);
  const lang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG; // Allow specifying lang, default to 'en'
  console.log(`[API Managed Pages] GET /?type=${pageType}&lang=${lang} (Public List) - Fetching list (Project: ${PROJECT_ID})`);

  if (!pageType) {
      console.warn('[API Managed Pages] Public list requested without valid type parameter.');
      return res.status(400).json({ message: 'Missing or invalid \'type\' query parameter for public list.'});
  }

  try {
    // Get identifier and title from translation table, fallback to default lang if specific lang has no title
    // Filter by page type and ensure there's at least one translation with a title
    const query = `
        SELECT DISTINCT
            p.page_identifier,
            p.sort_order, -- Add sort_order to SELECT DISTINCT list
            COALESCE(t_lang.list_title, t_default.list_title) AS list_title
        FROM
            levitrask_managed_pages p
        LEFT JOIN
            levitrask_managed_page_translations t_lang ON p.id = t_lang.managed_page_id AND t_lang.language_code = $1
        LEFT JOIN
            levitrask_managed_page_translations t_default ON p.id = t_default.managed_page_id AND t_default.language_code = $2
        WHERE
            p.project_id = $3
            AND p.page_type = $4
            AND COALESCE(t_lang.list_title, t_default.list_title) IS NOT NULL
            AND COALESCE(t_lang.list_title, t_default.list_title) <> ''
        -- CHANGE: Order by sort_order first, then title as fallback
        ORDER BY
            p.sort_order ASC NULLS LAST, 
            list_title ASC;
    `;
    const result = await pool.query(query, [lang, DEFAULT_LANG, PROJECT_ID, pageType]);
    
    console.log(`[API Managed Pages] Fetched ${result.rows.length} pages for public list (type: ${pageType}, lang: ${lang}).`);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error(`[API Managed Pages] Error fetching public list for type '${pageType}':`, error);
    res.status(500).json({ message: 'Internal Server Error fetching public page list.' });
  }
});


// GET /api/managed-pages/:lang/:identifier - Get public data for a specific page (UPDATED ROUTE & LOGIC)
managedPagesRouter.get('/:lang/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const requestedLang = sanitizeLangCode(req.params.lang); // Sanitize requested lang

  console.log(`[API Managed Pages] GET /:lang/:identifier (Public Detail) - Fetching lang '${requestedLang || DEFAULT_LANG}', id '${identifier}'`);

  if (!requestedLang) {
      console.warn(`[API Managed Pages] Invalid language code requested: ${req.params.lang}. Falling back to default.`);
      // Fallback handled in query, no need to return 400
  }
  if (!identifier) {
    return res.status(400).json({ message: 'Page identifier parameter is missing.' });
  }

  try {
    // JOIN query with COALESCE for language fallback remains the same logic
    const query = `
      SELECT 
        p.page_identifier,
        p.page_type,
        p.created_at,
        p.updated_at,
        COALESCE(t_lang.list_title, t_default.list_title) AS list_title,
        COALESCE(t_lang.list_description, t_default.list_description) AS list_description,
        COALESCE(t_lang.meta_title, t_default.meta_title) AS meta_title,
        COALESCE(t_lang.meta_description, t_default.meta_description) AS meta_description,
        COALESCE(t_lang.meta_keywords, t_default.meta_keywords) AS meta_keywords,
        COALESCE(t_lang.content, t_default.content) AS content,
        COALESCE(t_lang.sidebar_data, t_default.sidebar_data) AS sidebar_data,
        COALESCE(t_lang.nav_sections, t_default.nav_sections) AS nav_sections
      FROM
        levitrask_managed_pages p
      LEFT JOIN
        levitrask_managed_page_translations t_lang ON p.id = t_lang.managed_page_id AND t_lang.language_code = $1
      LEFT JOIN
        levitrask_managed_page_translations t_default ON p.id = t_default.managed_page_id AND t_default.language_code = $2
      WHERE
        p.page_identifier = $3 AND p.project_id = $4;
    `;
    const values = [requestedLang || DEFAULT_LANG, DEFAULT_LANG, identifier, PROJECT_ID];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log(`[API Managed Pages] Public fetch: Page not found for identifier '${identifier}'`);
      return res.status(404).json({ message: `Page with identifier '${identifier}' not found.` });
    }

    const row = result.rows[0];
    // Check if essential content is missing even in fallback
    if (row.meta_title === null && row.content === null) {
         console.warn(`Page '${identifier}' found, but no translation exists for requested language '${requestedLang || DEFAULT_LANG}' or default '${DEFAULT_LANG}'.`);
         return res.status(404).json({ message: `Content not available for page '${identifier}' in the requested language or default.` });
    }

    const pageData = {
        page_identifier: row.page_identifier,
        page_type: row.page_type,
        list_title: row.list_title,
        list_description: row.list_description,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        meta_keywords: row.meta_keywords,
        content: row.content,
        sidebar_data: row.sidebar_data || [], // Ensure array format
        nav_sections: row.nav_sections || [], // Ensure array format
    };

    console.log(`[API Managed Pages] Successfully fetched public page data for: lang '${requestedLang || DEFAULT_LANG}', id '${identifier}'`);
    res.status(200).json(pageData);

  } catch (error) {
    console.error(`[API Managed Pages] Error fetching public page lang '${requestedLang || DEFAULT_LANG}' id '${identifier}':`, error);
    res.status(500).json({ message: 'Internal Server Error fetching page data.' });
  }
});


export default managedPagesRouter; 