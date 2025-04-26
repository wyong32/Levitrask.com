import express, { Router } from 'express';
import pool from '../utils/db.js';
// Removed admin auth import - not needed for public routes

// TODO: Import and apply auth middleware later
// import verifyToken from '../middleware/auth.js';

const PROJECT_ID = 'levitrask';
const DEFAULT_LANG = 'en'; // 定义默认语言
const questionsRouter = Router();

// Helper function to sanitize language code
const sanitizeLangCode = (lang) => {
    if (typeof lang === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return lang;
    }
    return null;
}

// --- Public GET routes (REVISED for Multi-language) ---

// GET /api/questions (List for frontend index)
questionsRouter.get('/', async (req, res) => {
  const requestedLang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG;
  console.log(`[API Questions] GET / - Fetching question list for lang '${requestedLang}'`);
  try {
    const query = `
      SELECT 
        q.question_id, 
        COALESCE(qt_lang.list_title, qt_default.list_title) AS list_title
      FROM levitrask_questions q
      LEFT JOIN levitrask_questions_translations qt_lang 
        ON q.id = qt_lang.question_main_id AND qt_lang.language_code = $1
      LEFT JOIN levitrask_questions_translations qt_default 
        ON q.id = qt_default.question_main_id AND qt_default.language_code = $2
      WHERE q.project_id = $3
        AND COALESCE(qt_lang.list_title, qt_default.list_title) IS NOT NULL -- Only show if title exists
      ORDER BY q.created_at DESC;
    `;
    const result = await pool.query(query, [requestedLang, DEFAULT_LANG, PROJECT_ID]);

    // Restructure for frontend (keyed by question_id)
    const questions = result.rows.reduce((acc, row) => {
      acc[row.question_id] = {
        id: row.question_id,
        question_id: row.question_id,
        listTitle: row.list_title,
      };
      return acc;
    }, {});

    console.log(`  Fetched ${Object.keys(questions).length} questions.`);
    res.json(questions);
  } catch (error) {
    console.error(`Error fetching questions list (lang: ${requestedLang}):`, error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// GET /api/questions/sidebar (List for public sidebar)
questionsRouter.get('/sidebar', async (req, res) => {
    const requestedLang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG;
    console.log(`[API Questions] GET /sidebar - Fetching sidebar list for lang '${requestedLang}'`);
  try {
    const query = `
      SELECT 
        q.question_id, 
        COALESCE(qt_lang.list_title, qt_default.list_title) AS list_title
      FROM levitrask_questions q
      LEFT JOIN levitrask_questions_translations qt_lang 
        ON q.id = qt_lang.question_main_id AND qt_lang.language_code = $1
      LEFT JOIN levitrask_questions_translations qt_default 
        ON q.id = qt_default.question_main_id AND qt_default.language_code = $2
      WHERE q.project_id = $3
        AND COALESCE(qt_lang.list_title, qt_default.list_title) IS NOT NULL
      ORDER BY q.created_at DESC;
    `;
     // No LIMIT applied here as per original code comment
    const result = await pool.query(query, [requestedLang, DEFAULT_LANG, PROJECT_ID]);

    const sidebarQuestions = result.rows.map(row => ({
      text: row.list_title,
      to: `/questions/${row.question_id}` // Assuming Vue Router path
    }));

    console.log(`  Fetched ${sidebarQuestions.length} questions for sidebar.`);
    res.json(sidebarQuestions);
  } catch (error) {
    console.error(`Error fetching questions for sidebar (lang: ${requestedLang}):`, error);
    res.status(500).json({ message: 'Error fetching sidebar questions', error: error.message });
  }
});

// GET /api/questions/:id (Get details for a single question)
questionsRouter.get('/:id', async (req, res) => {
  const questionId = req.params.id; // This is the text ID (slug)
  const requestedLang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG;
  console.log(`[API Questions] GET /:id - Fetching question '${questionId}' for lang '${requestedLang}'`);

  if (!questionId) {
      return res.status(400).json({ message: 'Question ID parameter is missing.'});
  }

  try {
     // Join main table with translations table twice (for requested lang and default lang)
     const query = `
        SELECT 
            q.question_id, -- Keep the text ID
            q.project_id, 
            q.created_at,
            q.updated_at, 
            -- Add other non-translatable fields from 'q' if they exist (e.g., category, is_active)
            COALESCE(qt_lang.list_title, qt_default.list_title) AS list_title,
            COALESCE(qt_lang.meta_title, qt_default.meta_title) AS meta_title,
            COALESCE(qt_lang.meta_description, qt_default.meta_description) AS meta_description,
            COALESCE(qt_lang.meta_keywords, qt_default.meta_keywords) AS meta_keywords,
            COALESCE(qt_lang.nav_sections, qt_default.nav_sections) AS nav_sections,
            COALESCE(qt_lang.sidebar_data, qt_default.sidebar_data) AS sidebar_data,
            COALESCE(qt_lang.content, qt_default.content) AS content
        FROM levitrask_questions q
        LEFT JOIN levitrask_questions_translations qt_lang 
            ON q.id = qt_lang.question_main_id AND qt_lang.language_code = $1
        LEFT JOIN levitrask_questions_translations qt_default 
            ON q.id = qt_default.question_main_id AND qt_default.language_code = $2
        WHERE q.project_id = $3 AND q.question_id = $4;
     `;

    const result = await pool.query(query, [requestedLang, DEFAULT_LANG, PROJECT_ID, questionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Question with ID '${questionId}' not found.` });
    }

    // Return the flat structure with translated fields
    const questionData = result.rows[0]; 
    // Frontend expects `id` to be the text slug
    questionData.id = questionData.question_id; 

    // Ensure JSON fields are parsed (though pool might do this automatically for JSONB)
    // Check type before parsing to avoid errors if already object
    if (typeof questionData.nav_sections === 'string') {
        try { questionData.nav_sections = JSON.parse(questionData.nav_sections); } catch (e) { console.error("Error parsing nav_sections:", e); questionData.nav_sections = []; }
    }
    if (typeof questionData.sidebar_data === 'string') {
        try { questionData.sidebar_data = JSON.parse(questionData.sidebar_data); } catch (e) { console.error("Error parsing sidebar_data:", e); questionData.sidebar_data = {}; }
    }

    console.log(`  Successfully fetched question details for ID '${questionId}', lang '${requestedLang}'.`);
    res.status(200).json(questionData);

  } catch (error) {
    console.error(`Error fetching question '${questionId}' (lang: ${requestedLang}):`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// --- Admin Routes are now moved to admin_questions.js ---

// --- Deprecated Admin Routes (Commented out) ---
/*
questionsRouter.post('/', authenticateAdmin, async (req, res) => { ... });
questionsRouter.delete('/:id', authenticateAdmin, async (req, res) => { ... });
questionsRouter.put('/:id', authenticateAdmin, async (req, res) => { ... });
*/

export default questionsRouter; 