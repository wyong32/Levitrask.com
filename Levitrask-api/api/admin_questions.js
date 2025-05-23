import express, { Router } from 'express';
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const PROJECT_ID = 'levitrask'; // Assuming the same project ID
const adminQuestionsRouter = Router();

// GET / (List all questions with all translations for Admin UI)
// Mounted at /api/admin/questions
adminQuestionsRouter.get('/', authenticateAdmin, async (req, res) => {
  console.log(`[API Admin Questions] GET / - Fetching all questions with translations`);
  try {
    const query = `
        SELECT
            q.id, -- Main DB ID
            q.question_id, -- Text ID (slug)
            q.project_id,
            q.created_at,
            q.updated_at,
            -- Add other non-translatable fields from q here
            COALESCE(translations_agg.translations, '[]'::jsonb) AS translations
        FROM levitrask_questions q
        LEFT JOIN (
            SELECT
                qt.question_main_id,
                jsonb_agg(jsonb_build_object(
                    'language_code', qt.language_code,
                    'list_title', qt.list_title,
                    'meta_title', qt.meta_title,
                    'meta_description', qt.meta_description,
                    'meta_keywords', qt.meta_keywords,
                    'nav_sections', qt.nav_sections,
                    'sidebar_data', qt.sidebar_data,
                    'content', qt.content,
                    'updated_at', qt.updated_at
                ) ORDER BY qt.language_code) AS translations
            FROM levitrask_questions_translations qt
            GROUP BY qt.question_main_id
        ) translations_agg ON q.id = translations_agg.question_main_id
        WHERE q.project_id = $1
        ORDER BY q.created_at DESC;
    `;
    const result = await pool.query(query, [PROJECT_ID]);
    console.log(`  Fetched ${result.rows.length} questions for admin.`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching questions for admin:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /:id (Fetch single question details with all translations)
// Mounted at /api/admin/questions/:id
adminQuestionsRouter.get('/:id(\\d+)', authenticateAdmin, async (req, res) => {
    const mainDbId = parseInt(req.params.id, 10);
    console.log(`[API Admin Questions] GET /:id - Fetching details for DB ID: ${mainDbId}`);

    if (isNaN(mainDbId)) {
        return res.status(400).json({ message: 'Invalid DB ID format.' });
    }

    try {
        // This query should fetch the question's main data and aggregate its translations
        const fetchQuery = `
            SELECT
                q.*, -- Select all columns from the main question table (or specify needed ones)
                COALESCE(t_agg.translations, '[]'::jsonb) AS translations
            FROM levitrask_questions q
            LEFT JOIN (
                SELECT
                    qt.question_main_id,
                    -- Aggregate all necessary translation fields into a JSON array
                    jsonb_agg(jsonb_build_object(
                        'language_code', qt.language_code,
                        'list_title', qt.list_title,
                        'meta_title', qt.meta_title,
                        'meta_description', qt.meta_description,
                        'meta_keywords', qt.meta_keywords,
                        'nav_sections', qt.nav_sections,
                        'sidebar_data', qt.sidebar_data,
                        'content', qt.content,
                        'updated_at', qt.updated_at
                        -- Add other translation fields if needed
                    ) ORDER BY qt.language_code) AS translations
                FROM levitrask_questions_translations qt
                GROUP BY qt.question_main_id
            ) t_agg ON q.id = t_agg.question_main_id
            WHERE q.id = $1 AND q.project_id = $2; -- Assuming PROJECT_ID is defined in the file scope
        `;
        // Make sure PROJECT_ID is defined similar to how it's used in other routes
        const result = await pool.query(fetchQuery, [mainDbId, PROJECT_ID]);

        if (result.rows.length === 0) {
            console.log(`  Question not found for DB ID: ${mainDbId}`);
            return res.status(404).json({ message: `Question with DB ID ${mainDbId} not found.` });
        }

        console.log(`  Successfully fetched details for DB ID: ${mainDbId}`);
        res.status(200).json(result.rows[0]); // Return the single question object

    } catch (error) {
        console.error(`Error fetching question details for DB ID ${mainDbId}:`, error);
        res.status(500).json({ message: 'Internal Server Error fetching question details.' });
    }
});

// POST / (Create new question with translations)
// Mounted at /api/admin/questions
adminQuestionsRouter.post('/', authenticateAdmin, async (req, res) => {
    const { question_id, translations, ...otherNonTranslatableFields } = req.body;
    // Example: const { question_id, category, is_active, translations } = req.body;
    console.log(`[API Admin Questions] POST / - Creating new question. ID: ${question_id}`);

    // --- 1. Validate Input --- 
    // Validate question_id format (ALLOWS UPPERCASE)
    if (!question_id || !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(question_id.trim())) {
      return res.status(400).json({ message: 'Valid Question ID (slug) format required (letters, numbers, hyphens).' });
    }
    if (!Array.isArray(translations) || translations.length === 0) {
        return res.status(400).json({ message: 'At least one translation is required.' });
    }
    // Validate each translation (at least language_code and list_title/content?)
    for (const t of translations) {
        if (!t.language_code || typeof t.language_code !== 'string') {
             return res.status(400).json({ message: 'Each translation must have a valid language_code.' });
        }
        // Add checks for required translated fields like list_title or content if necessary
        // if (!t.list_title) { return res.status(400).json({ message: `Translation for ${t.language_code} requires list_title.` }); }
    }
    // Validate otherNonTranslatableFields if needed

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert into main table (non-translatable fields)
        // Adjust fields based on your actual main table structure
        const mainTableFields = ['project_id', 'question_id']; // Start with required
        const mainTableValues = [PROJECT_ID, question_id.trim()];
        const mainTablePlaceholders = ['$1', '$2'];
        let placeholderIndex = 3;
        // Add other non-translatable fields dynamically
        for (const key in otherNonTranslatableFields) {
            if (Object.hasOwnProperty.call(otherNonTranslatableFields, key)) {
                // TODO: Validate if 'key' is a valid column in levitrask_questions
                mainTableFields.push(key);
                mainTableValues.push(otherNonTranslatableFields[key]);
                mainTablePlaceholders.push(`$${placeholderIndex++}`);
            }
        }

        const insertMainQuery = `
            INSERT INTO levitrask_questions (${mainTableFields.join(', ')}, created_at, updated_at)
            VALUES (${mainTablePlaceholders.join(', ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id; -- Return the main DB ID
        `;
        console.log('Executing Main Insert:', insertMainQuery, mainTableValues);
        const mainResult = await client.query(insertMainQuery, mainTableValues);
        const newQuestionMainId = mainResult.rows[0].id;
        console.log(`  Inserted into main table, new DB ID: ${newQuestionMainId}`);

        // 2. Insert translations
        const insertTranslationQuery = `
            INSERT INTO levitrask_questions_translations (
                question_main_id, language_code, list_title, meta_title, meta_description,
                meta_keywords, nav_sections, sidebar_data, content, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `;
        for (const t of translations) {
            // CHANGE: Use camelCase to access properties from frontend payload
            const navSections = t.navSections || [];
            const sidebarData = t.sidebarData || []; // Default to empty array now

            const translationValues = [
                newQuestionMainId,
                t.language_code.trim(),
                t.list_title || null,
                t.meta_title || null,
                t.meta_description || null,
                t.meta_keywords || null,
                // CHANGE: Stringify JSON fields before sending
                JSON.stringify(navSections),
                JSON.stringify(sidebarData),
                t.content || null
            ];
             console.log(`  Inserting translation for lang: ${t.language_code}`);
            await client.query(insertTranslationQuery, translationValues);
        }

        await client.query('COMMIT');
        console.log('  New question and translations created successfully.');

        // Fetch and return the newly created question with translations
         const fetchNewQuery = ` SELECT q.*, COALESCE(t_agg.translations, '[]'::jsonb) AS translations
                             FROM levitrask_questions q
                             LEFT JOIN (SELECT qt.question_main_id, jsonb_agg(qt ORDER BY qt.language_code) AS translations
                                        FROM levitrask_questions_translations qt GROUP BY qt.question_main_id) t_agg
                             ON q.id = t_agg.question_main_id
                             WHERE q.id = $1;`;
        const newQuestionResult = await client.query(fetchNewQuery, [newQuestionMainId]);
        res.status(201).json(newQuestionResult.rows[0] || null);

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Handle unique constraint on question_id
            console.error(`Error creating question: Unique constraint violation for ID ${question_id}.`, error.detail);
            return res.status(409).json({ message: `Question ID (Slug) "${question_id}" already exists.` });
        }
        console.error('Error creating question:', error);
        res.status(500).json({ message: 'Internal Server Error while creating question.', error: error.message });
    } finally {
        client.release();
    }
});

// PUT /:id (Update non-translatable fields)
// Mounted at /api/admin/questions/:id
adminQuestionsRouter.put('/:id(\\d+)', authenticateAdmin, async (req, res) => {
    const mainDbId = parseInt(req.params.id, 10);
    // Extract only non-translatable fields expected in the main table
    const { question_id, ...otherNonTranslatableFields } = req.body;
    // Example: const { question_id, category, is_active } = req.body;
    console.log(`[API Admin Questions] PUT /:id - Updating non-translatable fields for DB ID: ${mainDbId}`);

    // --- Validation ---
    if (isNaN(mainDbId)) {
        return res.status(400).json({ message: 'Invalid DB ID format.' });
    }
    // Validate incoming data
    // Validate question_id format if it's being updated (ALLOWS UPPERCASE)
    // Note: Usually, slugs are not updated after creation. Consider if this validation is needed.
    if (question_id !== undefined && question_id !== null && !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(question_id.trim())) {
        return res.status(400).json({ message: 'Valid Question ID (slug) format required if provided.' });
    }
    // Validate other fields if necessary

    const updateFields = [];
    const updateValues = [];
    let placeholderIndex = 1;

    if (question_id) {
        updateFields.push(`question_id = $${placeholderIndex++}`);
        updateValues.push(question_id.trim());
    }
    for (const key in otherNonTranslatableFields) {
         if (Object.hasOwnProperty.call(otherNonTranslatableFields, key)) {
            // TODO: Validate key is a valid column
             updateFields.push(`${key} = $${placeholderIndex++}`);
             updateValues.push(otherNonTranslatableFields[key]);
         }
    }

    if (updateFields.length === 0) {
        // If only translation updates are expected via the other endpoint, this might be ok.
        // However, the frontend might send an empty PUT here if slug isn't changed.
        // For now, let's assume *something* should be updated if this endpoint is hit.
        // Alternatively, just return 200 OK if no fields changed.
        console.log(`  No non-translatable fields to update for DB ID: ${mainDbId}. Skipping main table update.`);
        // Optionally fetch and return the current state if frontend expects it
         const fetchCurrentQuery = ` SELECT q.*, COALESCE(t_agg.translations, '[]'::jsonb) AS translations
                                FROM levitrask_questions q
                                LEFT JOIN (SELECT qt.question_main_id, jsonb_agg(qt ORDER BY qt.language_code) AS translations
                                           FROM levitrask_questions_translations qt GROUP BY qt.question_main_id) t_agg
                                ON q.id = t_agg.question_main_id
                                WHERE q.id = $1;`;
        try {
             const currentQuestionResult = await pool.query(fetchCurrentQuery, [mainDbId]);
             if (currentQuestionResult.rowCount === 0) {
                return res.status(404).json({ message: `Question with DB ID ${mainDbId} not found.` });
             }
             return res.status(200).json(currentQuestionResult.rows[0]);
        } catch (fetchError) {
             console.error(`Error fetching current question data for DB ID ${mainDbId} after no-op update:`, fetchError);
             return res.status(500).json({ message: 'Internal Server Error' });
        }
        // return res.status(400).json({ message: 'No valid non-translatable fields provided for update.' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(mainDbId, PROJECT_ID); // Add ID and project_id for WHERE clause

    const updateQuery = `
        UPDATE levitrask_questions
        SET ${updateFields.join(', ')}
        WHERE id = $${placeholderIndex++} AND project_id = $${placeholderIndex++}
        RETURNING id; -- Return ID to confirm update
    `;
    console.log('Executing Main Update:', updateQuery, updateValues);

    try {
        const result = await pool.query(updateQuery, updateValues);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: `Question with DB ID ${mainDbId} not found.` });
        }
        console.log(`  Main question fields updated for DB ID: ${mainDbId}`);
        // Fetch and return updated question with translations
        const fetchUpdatedQuery = ` SELECT q.*, COALESCE(t_agg.translations, '[]'::jsonb) AS translations
                                FROM levitrask_questions q
                                LEFT JOIN (SELECT qt.question_main_id, jsonb_agg(qt ORDER BY qt.language_code) AS translations
                                           FROM levitrask_questions_translations qt GROUP BY qt.question_main_id) t_agg
                                ON q.id = t_agg.question_main_id
                                WHERE q.id = $1;`;
        const updatedQuestionResult = await pool.query(fetchUpdatedQuery, [mainDbId]);
        res.status(200).json(updatedQuestionResult.rows[0] || null);

    } catch (error) {
        if (error.code === '23505') { // Handle unique constraint violation (e.g., on question_id)
             console.error(`Error updating question ${mainDbId}: Unique constraint violation.`, error.detail);
             return res.status(409).json({ message: `Slug \"${question_id}\" already exists.` }); // Use question_id in message
        }
        console.error(`Error updating non-translatable fields for DB ID ${mainDbId}:`, error);
        res.status(500).json({ message: 'Internal Server Error updating question.' });
    }
});

// PUT /:id/translations/:lang (UPSERT: Update or Insert Translation)
// Mounted at /api/admin/questions/:id/translations/:lang
adminQuestionsRouter.put('/:id(\\d+)/translations/:lang', authenticateAdmin, async (req, res) => {
    const mainDbId = parseInt(req.params.id, 10);
    const langCode = req.params.lang;
    const { list_title, meta_title, meta_description, meta_keywords, navSections, sidebarData, content } = req.body;

    console.log(`[API Admin Questions] PUT /:id/translations/:lang - UPSERTing translation for DB ID: ${mainDbId}, Lang: ${langCode}`);

    // --- Validation ---
    if (isNaN(mainDbId)) {
        return res.status(400).json({ message: 'Invalid DB ID format.' });
    }
    // Basic lang code validation (can be enhanced)
    if (!langCode || typeof langCode !== 'string' || langCode.length > 10) {
        return res.status(400).json({ message: 'Invalid or missing language code.' });
    }
    // Add validation for required fields if necessary (e.g., list_title for default lang?)
    // if (langCode === 'en' && !list_title) { return res.status(400).json({ message: 'Default language requires a list title.'}); }

    try {
        const upsertQuery = `
            INSERT INTO levitrask_questions_translations (
                question_main_id, language_code, list_title, meta_title, meta_description,
                meta_keywords, nav_sections, sidebar_data, content, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (question_main_id, language_code) DO UPDATE SET
                list_title = EXCLUDED.list_title,
                meta_title = EXCLUDED.meta_title,
                meta_description = EXCLUDED.meta_description,
                meta_keywords = EXCLUDED.meta_keywords,
                nav_sections = EXCLUDED.nav_sections, 
                sidebar_data = EXCLUDED.sidebar_data, 
                content = EXCLUDED.content,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *; -- Return the inserted or updated row
        `;

        // Prepare values - use the camelCase variables destructured above
        const values = [
            mainDbId,
            langCode.trim(),
            list_title || null,
            meta_title || null,
            meta_description || null,
            meta_keywords || null,
            JSON.stringify(navSections || []),
            JSON.stringify(sidebarData || []),
            content || null
        ];

        console.log('Executing UPSERT query for translation:', upsertQuery, values);
        const result = await pool.query(upsertQuery, values);

        console.log(`  Successfully UPSERTed translation for DB ID: ${mainDbId}, Lang: ${langCode}`);
        res.status(200).json(result.rows[0]); // Return the created/updated translation

    } catch (error) {
        console.error(`Error UPSERTing translation for DB ID ${mainDbId}, Lang ${langCode}:`, error);
        // Check for foreign key violation (if question with mainDbId doesn't exist)
        if (error.code === '23503') { // Foreign key violation
             return res.status(404).json({ message: `Question with DB ID ${mainDbId} not found.` });
        }
        res.status(500).json({ message: 'Internal Server Error updating translation.' });
    }
});

// DELETE /:id (Delete question and translations via CASCADE)
// Mounted at /api/admin/questions/:id
adminQuestionsRouter.delete('/:id(\\d+)', authenticateAdmin, async (req, res) => {
    const mainDbId = parseInt(req.params.id, 10);
    console.log(`[API Admin Questions] DELETE /:id - Deleting question with DB ID: ${mainDbId}`);
     if (isNaN(mainDbId)) {
        return res.status(400).json({ message: 'Invalid DB ID format.' });
    }

    try {
        // Assumes ON DELETE CASCADE is set for question_main_id in translations table
        const deleteQuery = 'DELETE FROM levitrask_questions WHERE id = $1 AND project_id = $2';
        const result = await pool.query(deleteQuery, [mainDbId, PROJECT_ID]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: `Question with DB ID ${mainDbId} not found.` });
        }
        console.log(`  Question deleted successfully (DB ID: ${mainDbId}).`);
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        console.error(`Error deleting question DB ID ${mainDbId}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default adminQuestionsRouter; 