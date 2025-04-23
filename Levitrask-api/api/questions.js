import express from 'express';
import pool from '../utils/db.js';

const PROJECT_ID = 'levitrask';
const router = express.Router();

// --- GET /api/questions/ --- (Handles request for all questions)
router.get('/', async (req, res) => {
  console.log('[API Router - questions.js] GET / (Fetching all questions)');
  try {
    const result = await pool.query('SELECT * FROM levitrask_questions WHERE project_id = $1', [PROJECT_ID]);

    // Transform into object keyed by question_id
    const questionsData = result.rows.reduce((acc, row) => {
      const questionIdKey = row.question_id;
      if (questionIdKey) {
        acc[questionIdKey] = {
            id: questionIdKey,
            listTitle: row.list_title,
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

    res.status(200).json(questionsData);

  } catch (error) {
    console.error('Error fetching all questions:', error);
    if (error.code === '42P01') {
        res.status(500).json({ message: 'Internal Server Error: Table "levitrask_questions" does not exist.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

// --- GET /api/questions/:id --- (Handles request for a single question item)
router.get('/:id', async (req, res) => {
  const questionId = req.params.id;
  console.log(`[API Router - questions.js] GET /:id (Fetching question with ID: ${questionId})`);

  if (!questionId) {
      return res.status(400).json({ message: 'Question ID parameter is missing.'});
  }

  try {
    const result = await pool.query('SELECT * FROM levitrask_questions WHERE project_id = $1 AND question_id = $2', [PROJECT_ID, questionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Question with ID '${questionId}' not found.` });
    }

    const row = result.rows[0];
    const questionsData = {
        id: row.question_id,
        listTitle: row.list_title,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaKeywords: row.meta_keywords,
        navSections: row.nav_sections || [],
        sidebarData: row.sidebar_data || {},
        content: row.content,
      };

    res.status(200).json(questionsData);

  } catch (error) {
    console.error(`Error fetching question with ID ${questionId}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router; 