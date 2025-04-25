// api/news.js (Simplified for Vercel Debugging)

import express from 'express';
import pool from '../utils/db.js'; // 假设 db.js 也使用 export
// Assuming you have an auth middleware utility
// import verifyToken from '../middleware/auth.js'; // TODO: Implement and uncomment later

const PROJECT_ID = 'levitrask';
const DEFAULT_LANG = 'en'; // Define default language
const router = express.Router();

// --- GET / --- (Handles request for all news with language support)
router.get('/', async (req, res) => {
  // Get language from query param, default to DEFAULT_LANG
  const requestedLang = req.query.lang || DEFAULT_LANG;
  console.log(`[API Router - news.js] GET / (Fetching all news for lang: ${requestedLang})`);

  try {
    // SQL query joining news and translations, using COALESCE for fallback
    const query = `
        SELECT
            n.news_id,
            n.project_id,
            n.list_date,
            n.list_source,
            n.list_image_src,
            n.created_at,
            n.updated_at,
            COALESCE(t_lang.list_title, t_default.list_title) AS list_title,
            COALESCE(t_lang.list_image_alt, t_default.list_image_alt) AS list_image_alt,
            COALESCE(t_lang.list_description, t_default.list_description) AS list_description,
            COALESCE(t_lang.meta_title, t_default.meta_title) AS meta_title,
            COALESCE(t_lang.meta_description, t_default.meta_description) AS meta_description,
            COALESCE(t_lang.meta_keywords, t_default.meta_keywords) AS meta_keywords,
            COALESCE(t_lang.content, t_default.content) AS content
        FROM
            levitrask_news n
        LEFT JOIN
            levitrask_news_translations t_lang ON n.id = t_lang.news_entry_id AND t_lang.language_code = $1
        LEFT JOIN
            levitrask_news_translations t_default ON n.id = t_default.news_entry_id AND t_default.language_code = $2
        WHERE
            n.project_id = $3
        ORDER BY
            n.list_date DESC, n.created_at DESC; -- Optional: Add sorting
    `;

    // Parameters for the query: requested language, default language, project ID
    const values = [requestedLang, DEFAULT_LANG, PROJECT_ID];
    const result = await pool.query(query, values);

    // Process results: Convert rows to the nested structure expected by frontend
    const newsData = result.rows.reduce((acc, row) => {
      const newsIdKey = row.news_id; // Use news_id (slug) as the key
      if (newsIdKey) {
          acc[newsIdKey] = {
              id: newsIdKey, // Frontend uses news_id as id
              listTitle: row.list_title,
              listDate: row.list_date,
              listSource: row.list_source,
              listImage: { src: row.list_image_src, alt: row.list_image_alt }, // Combine image fields
              listDescription: row.list_description,
              metaTitle: row.meta_title,
              metaDescription: row.meta_description,
              metaKeywords: row.meta_keywords,
              content: row.content,
              // Keep created_at, updated_at if needed by frontend, otherwise remove
              // createdAt: row.created_at,
              // updatedAt: row.updated_at,
          };
      }
      return acc;
    }, {});

    res.status(200).json(newsData);
  } catch (error) {
    console.error('Error fetching all news:', error);
    // Check for specific DB errors if needed (e.g., table not found)
    if (error.code === '42P01') { // Example: PostgreSQL table does not exist
        res.status(500).json({ message: 'Internal Server Error: Database table not found.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error fetching news list' });
    }
  }
});

// --- GET /:id --- (Handles request for a single news item with language support)
router.get('/:id', async (req, res) => {
  const newsId = req.params.id; // This is the news_id (slug)
  const requestedLang = req.query.lang || DEFAULT_LANG; // Get language, default to 'en'
  console.log(`[API Router - news.js] GET /:id (Fetching news with ID: ${newsId} for lang: ${requestedLang})`);

  if (!newsId) {
      return res.status(400).json({ message: 'News ID (slug) parameter is missing.'});
  }

  try {
     // Query to fetch specific news item with translation fallback
     const query = `
        SELECT
            n.news_id,
            n.project_id,
            n.list_date,
            n.list_source,
            n.list_image_src,
            n.created_at,
            n.updated_at,
            COALESCE(t_lang.list_title, t_default.list_title) AS list_title,
            COALESCE(t_lang.list_image_alt, t_default.list_image_alt) AS list_image_alt,
            COALESCE(t_lang.list_description, t_default.list_description) AS list_description,
            COALESCE(t_lang.meta_title, t_default.meta_title) AS meta_title,
            COALESCE(t_lang.meta_description, t_default.meta_description) AS meta_description,
            COALESCE(t_lang.meta_keywords, t_default.meta_keywords) AS meta_keywords,
            COALESCE(t_lang.content, t_default.content) AS content
        FROM
            levitrask_news n
        LEFT JOIN
            levitrask_news_translations t_lang ON n.id = t_lang.news_entry_id AND t_lang.language_code = $1
        LEFT JOIN
            levitrask_news_translations t_default ON n.id = t_default.news_entry_id AND t_default.language_code = $2
        WHERE
            n.project_id = $3 AND n.news_id = $4; -- Filter by project_id and news_id (slug)
    `;
    // Parameters: requested language, default language, project ID, news ID (slug)
    const values = [requestedLang, DEFAULT_LANG, PROJECT_ID, newsId];
    const result = await pool.query(query, values);

    // Check if the news item itself was found (even without translation)
    if (result.rows.length === 0) {
      // This means no news item with the given news_id/slug exists for this project
      return res.status(404).json({ message: `News with ID (slug) '${newsId}' not found.` });
    }

    // Check if at least the default translation was found
    const row = result.rows[0];
    if (row.list_title === null && row.content === null) { // Check a couple of key translated fields
         console.warn(`News item '${newsId}' found, but no translation exists for requested language '${requestedLang}' or default language '${DEFAULT_LANG}'.`);
         // Decide how to handle this: return 404 for translation missing, or return partial data?
         // Let's return 404 for now if essential content is missing even in default lang.
          return res.status(404).json({ message: `Translation not available for news ID '${newsId}' in requested or default language.` });
    }


    // Map the row to the expected frontend structure
    const newsData = {
      id: row.news_id, // Use news_id as id
      listTitle: row.list_title,
      listDate: row.list_date,
      listSource: row.list_source,
      listImage: { src: row.list_image_src, alt: row.list_image_alt }, // Combine image fields
      listDescription: row.list_description,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      metaKeywords: row.meta_keywords,
      content: row.content,
      // createdAt: row.created_at, // Optional
      // updatedAt: row.updated_at, // Optional
    };

    res.status(200).json(newsData);
  } catch (error) {
    console.error(`Error fetching news with ID ${newsId}:`, error);
    res.status(500).json({ message: 'Internal Server Error fetching news detail' });
  }
});

// --- POST create a new news item (Updated for multi-language) ---
router.post('/', /* verifyToken, */ async (req, res) => {
    console.log('[API /api/news] POST request received for multi-language');
    // TODO: Add authentication middleware

    const { 
        slug,           // Non-translatable (news_id)
        listDate,       // Non-translatable (Optional: YYYY-MM-DD)
        listSource,     // Non-translatable
        listImageSrc,   // Non-translatable (Image URL)
        languageCode,   // REQUIRED: Language of the translation (e.g., 'en', 'zh-CN')
        listTitle,      // Translatable
        listImageAlt,   // Translatable
        listDescription,// Translatable
        metaTitle,      // Translatable
        metaDescription,// Translatable
        metaKeywords,   // Translatable
        content         // Translatable
    } = req.body;

    const projectId = 'levitrask'; // Hardcode or get from env/config

    console.log('Received data for new news item:', { slug, languageCode, listTitle });

    // --- Basic Validation --- 
    if (!slug || !languageCode || !listTitle || !listImageSrc || !listImageAlt || !listDescription || !metaTitle || !metaDescription || !metaKeywords || !content) {
        console.warn('[API /api/news] POST Validation failed: Missing required fields.');
        // Provide more specific feedback if possible
        const missingFields = Object.entries({ slug, languageCode, listTitle, listImageSrc, listImageAlt, listDescription, metaTitle, metaDescription, metaKeywords, content })
            .filter(([, value]) => !value)
            .map(([key]) => key);
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }
    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        console.warn(`[API /api/news] POST Validation failed: Invalid slug format for slug: ${slug}`);
        return res.status(400).json({ message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens.'});
    }
    // TODO: Add validation for languageCode format if needed

    // --- Database Transaction --- 
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transaction
        console.log('Transaction started for creating news item.');

        // 1. Insert into levitrask_news (non-translatable fields)
        console.log('Executing INSERT into levitrask_news...');
        const newsInsertQuery = `
            INSERT INTO levitrask_news (news_id, project_id, list_date, list_source, list_image_src, created_at, updated_at)
            VALUES ($1, $2, COALESCE($3, TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD')), $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id; -- Return the generated primary key (id)
        `;
        const newsInsertValues = [slug, projectId, listDate, listSource, listImageSrc];
        const newsInsertResult = await client.query(newsInsertQuery, newsInsertValues);
        
        // Check if the first insert was successful and get the ID
        if (newsInsertResult.rowCount !== 1 || !newsInsertResult.rows[0].id) {
            throw new Error('Failed to insert into levitrask_news or retrieve ID.');
        }
        const newsEntryId = newsInsertResult.rows[0].id;
        console.log(`Inserted into levitrask_news with ID: ${newsEntryId}`);

        // 2. Insert into levitrask_news_translations (translatable fields)
        console.log(`Executing INSERT into levitrask_news_translations for lang: ${languageCode}...`);
        const translationInsertQuery = `
            INSERT INTO levitrask_news_translations (
                news_entry_id, language_code, list_title, list_image_alt, 
                list_description, meta_title, meta_description, meta_keywords, content
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        const translationInsertValues = [
            newsEntryId, languageCode, listTitle, listImageAlt, listDescription,
            metaTitle, metaDescription, metaKeywords, content
        ];
        const translationInsertResult = await client.query(translationInsertQuery, translationInsertValues);

        if (translationInsertResult.rowCount !== 1) {
             throw new Error('Failed to insert into levitrask_news_translations.');
        }
        console.log('Inserted into levitrask_news_translations successfully.');

        // If both inserts succeed, commit the transaction
        await client.query('COMMIT');
        console.log('Transaction committed successfully.');

        res.status(201).json({ 
            message: `News item '${slug}' created successfully with ${languageCode} translation.`, 
            newsItem: { news_id: slug, id: newsEntryId, language: languageCode }
        });

    } catch (err) {
        // If any error occurs, rollback the transaction
        console.error('[API /api/news] Error during transaction, rolling back...', err);
        await client.query('ROLLBACK');
        console.log('Transaction rolled back.');

        // Handle specific errors (like duplicate slug)
        if (err.code === '23505') { // Unique violation (e.g., duplicate news_id or translation)
            if (err.constraint === 'levitrask_news_news_id_key') {
                 console.warn(`Error: Duplicate news_id (slug) '${slug}'.`);
                 res.status(409).json({ message: `Error: News slug '${slug}' already exists.` });
            } else if (err.constraint === 'levitrask_news_translations_news_entry_id_language_code_key') {
                 console.warn(`Error: Translation for language '${languageCode}' already exists for slug '${slug}'.`);
                 res.status(409).json({ message: `Error: Translation for language '${languageCode}' already exists for this news item.` });
            } else {
                 res.status(409).json({ message: 'Conflict: Duplicate data error.', error: err.message });
            }
        } else {
            res.status(500).json({ message: 'Error creating news item', error: err.message });
        }
    } finally {
        client.release();
        console.log('[API /api/news] Database client released after POST request.');
    }
});


// --- DELETE a news item by news_id (slug) (Should still work due to CASCADE) ---
router.delete('/:id', /* verifyToken, */ async (req, res) => {
    const newsId = req.params.id; // Get news_id (slug) from URL parameter
    const projectId = 'levitrask'; // Filter by project

    console.log(`[API /api/news/:id] DELETE request received for news_id: ${newsId}`);
    // TODO: Add authentication middleware here later

    if (!newsId) {
        return res.status(400).json({ message: 'Missing news ID (slug) in URL parameter' });
    }

    // No change needed to the logic itself, as deleting from levitrask_news
    // should trigger the ON DELETE CASCADE for levitrask_news_translations.
    const client = await pool.connect();
    try {
        console.log(`Executing DELETE query for news_id: ${newsId}, project_id: ${projectId}...`);
        // Query targets the main table using the slug (news_id)
        const query = `
            DELETE FROM levitrask_news
            WHERE news_id = $1 AND project_id = $2
            RETURNING id; -- Optional: return id to confirm deletion
        `;
        const values = [newsId, projectId];

        const result = await client.query(query, values);

        if (result.rowCount === 1) {
            console.log(`[API /api/news/:id] Successfully deleted news item with news_id: ${newsId} and its translations.`);
            res.status(200).json({ message: 'News item deleted successfully' });
        } else {
            console.warn(`[API /api/news/:id] News item with news_id: ${newsId} and project_id: ${projectId} not found for deletion.`);
            res.status(404).json({ message: 'News item not found' });
        }

    } catch (err) {
        console.error(`[API /api/news/:id] Error deleting news item with news_id: ${newsId}:`, err.stack);
        res.status(500).json({ message: 'Error deleting news item', error: err.message });
    } finally {
        client.release();
        console.log(`[API /api/news/:id] Database client released after DELETE request.`);
    }
});


// --- PUT update an existing news item by news_id (slug) (Updated for multi-language) ---
router.put('/:id', /* verifyToken, */ async (req, res) => {
    const newsIdSlug = req.params.id; // Get news_id (slug) from URL
    const projectId = 'levitrask'; // Filter by project
    console.log(`[API /api/news/:id] PUT request received for news_id: ${newsIdSlug}`);
    // TODO: Add authentication middleware

    const {
        // Non-translatable fields (Optional in PUT, only update if provided)
        listDate, 
        listSource, 
        listImageSrc, 
        // Translatable fields (REQUIRED for the specified language)
        languageCode,   // REQUIRED: Language of the translation being updated/added
        listTitle, 
        listImageAlt, 
        listDescription,
        metaTitle, 
        metaDescription, 
        metaKeywords, 
        content
    } = req.body;

    // --- Basic Validation ---
    // Language code is always required for PUT
    if (!languageCode) {
        return res.status(400).json({ message: 'Missing required field: languageCode' });
    }
    // Translatable fields are required if updating/adding a translation
    if (!listTitle || !listImageAlt || !listDescription || !metaTitle || !metaDescription || !metaKeywords || !content) {
         // Check if only non-translatable fields are being updated
         if (listDate === undefined && listSource === undefined && listImageSrc === undefined) {
             const missingFields = Object.entries({ listTitle, listImageAlt, listDescription, metaTitle, metaDescription, metaKeywords, content })
                .filter(([, value]) => !value)
                .map(([key]) => key);
             return res.status(400).json({ message: `Missing required translatable fields for language '${languageCode}': ${missingFields.join(', ')}` });
         }
         // Allow request if only non-translatable fields are present (translation part will be skipped later)
    }
     // TODO: Validate languageCode format

    // --- Database Transaction ---
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log(`Transaction started for updating news item: ${newsIdSlug}`);

        // 1. Get the primary key (id) from levitrask_news using the slug
        console.log(`Fetching primary ID for news_id: ${newsIdSlug}`);
        const getIdQuery = 'SELECT id FROM levitrask_news WHERE news_id = $1 AND project_id = $2';
        const getIdResult = await client.query(getIdQuery, [newsIdSlug, projectId]);

        if (getIdResult.rowCount === 0) {
            console.warn(`News item with slug '${newsIdSlug}' not found.`);
            await client.query('ROLLBACK'); // Rollback before returning
            return res.status(404).json({ message: `News item with slug '${newsIdSlug}' not found.` });
        }
        const newsEntryId = getIdResult.rows[0].id;
        console.log(`Found primary ID (news_entry_id): ${newsEntryId}`);

        // 2. Update levitrask_news (non-translatable fields) if they are provided
        const nonTranslatableUpdates = {};
        if (listDate !== undefined) nonTranslatableUpdates.list_date = listDate; 
        if (listSource !== undefined) nonTranslatableUpdates.list_source = listSource;
        if (listImageSrc !== undefined) nonTranslatableUpdates.list_image_src = listImageSrc;

        if (Object.keys(nonTranslatableUpdates).length > 0) {
            // Construct SET clauses dynamically from provided fields
            let paramIndex = 1;
            const setClausesArr = Object.keys(nonTranslatableUpdates)
                .map(key => `${key} = $${paramIndex++}`)
            
            // Always add updated_at = CURRENT_TIMESTAMP directly to the query string
            setClausesArr.push('updated_at = CURRENT_TIMESTAMP'); 
            
            const setClauses = setClausesArr.join(', ');
            
            // Values array only contains values for the parameterized fields
            const updateValues = Object.values(nonTranslatableUpdates);
            
            // Add newsEntryId and projectId for the WHERE clause
            updateValues.push(newsEntryId);
            updateValues.push(projectId);
            const whereClauseParamStartIndex = paramIndex; // Index for id in WHERE clause

            const updateNewsQuery = `
                UPDATE levitrask_news 
                SET ${setClauses} 
                WHERE id = $${whereClauseParamStartIndex} AND project_id = $${whereClauseParamStartIndex + 1}
            `;
            
            console.log('Executing UPDATE on levitrask_news...', { query: updateNewsQuery, values: updateValues });
            const updateNewsResult = await client.query(updateNewsQuery, updateValues);
            if (updateNewsResult.rowCount !== 1) {
                 throw new Error ('Failed to update non-translatable fields in levitrask_news.');
            }
            console.log('Updated levitrask_news successfully.');
        } else {
             console.log('No non-translatable fields provided for update.');
        }

        // 3. UPSERT into levitrask_news_translations (translatable fields)
        // Only proceed if translatable fields were actually provided
        if (listTitle && listImageAlt && listDescription && metaTitle && metaDescription && metaKeywords && content) {
             console.log(`Executing UPSERT on levitrask_news_translations for lang: ${languageCode}...`);
            const upsertQuery = `
                INSERT INTO levitrask_news_translations (
                    news_entry_id, language_code, list_title, list_image_alt, 
                    list_description, meta_title, meta_description, meta_keywords, content
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (news_entry_id, language_code) 
                DO UPDATE SET 
                    list_title = EXCLUDED.list_title,
                    list_image_alt = EXCLUDED.list_image_alt,
                    list_description = EXCLUDED.list_description,
                    meta_title = EXCLUDED.meta_title,
                    meta_description = EXCLUDED.meta_description,
                    meta_keywords = EXCLUDED.meta_keywords,
                    content = EXCLUDED.content
                RETURNING id; -- Optional: return id to know if inserted or updated
            `;
            const upsertValues = [
                newsEntryId, languageCode, listTitle, listImageAlt, listDescription,
                metaTitle, metaDescription, metaKeywords, content
            ];
            const upsertResult = await client.query(upsertQuery, upsertValues);
             if (upsertResult.rowCount !== 1) {
                 throw new Error('Failed to UPSERT into levitrask_news_translations.');
             }
            console.log('UPSERT into levitrask_news_translations successful.');
        } else {
             console.log('No translatable fields provided, skipping translation UPSERT.');
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log('Transaction committed successfully.');

        res.status(200).json({ 
            message: `News item '${newsIdSlug}' updated successfully for language '${languageCode}'.`, 
            updatedItem: { news_id: newsIdSlug, language: languageCode }
        });

    } catch (err) {
        // Rollback on error
        console.error('[API /api/news/:id] Error during PUT transaction, rolling back...', err);
        await client.query('ROLLBACK');
         console.log('Transaction rolled back.');
        
        // Handle specific errors (e.g., unique constraints shouldn't normally happen on UPSERT target)
         res.status(500).json({ message: 'Error updating news item', error: err.message });

    } finally {
        client.release();
        console.log('[API /api/news/:id] Database client released after PUT request.');
    }
});


export default router; // Ensure router is exported correctly 