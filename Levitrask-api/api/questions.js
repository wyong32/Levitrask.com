import express, { Router } from 'express';
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

// TODO: Import and apply auth middleware later
// import verifyToken from '../middleware/auth.js';

const PROJECT_ID = 'levitrask';
const questionsRouter = Router();

// --- GET all question list items ---
questionsRouter.get('/', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/questions request received`);
  try {
    // Corrected Query: Select only question_id (text) and list_title, as 'slug' column was removed.
    const result = await pool.query(
      'SELECT question_id, list_title FROM levitrask_questions WHERE project_id = $1 ORDER BY created_at DESC', 
      [PROJECT_ID]
    );

    // Restructure the result into an object keyed by question_id (text)
    const questions = result.rows.reduce((acc, row) => {
      acc[row.question_id] = {
        id: row.question_id, // Use text question_id as the main identifier for frontend
        question_id: row.question_id,
        listTitle: row.list_title,
      };
      return acc;
    }, {});

    console.log(`[${new Date().toISOString()}] Successfully fetched ${Object.keys(questions).length} questions for project ${PROJECT_ID}`);
    res.json(questions);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching questions for project ${PROJECT_ID}:`, error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// --- GET /api/questions/:id --- (Handles request for a single question item)
questionsRouter.get('/:id', async (req, res) => {
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

// POST /api/questions - Create a new question
questionsRouter.post('/', authenticateAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/questions request received`);
  const { 
    slug, // This is the user-provided text ID, will be inserted into question_id
    listTitle, 
    metaTitle, 
    metaDescription, 
    metaKeywords, 
    navSections, 
    sidebarData, 
    content 
  } = req.body;

  const questionId = slug;

  // Basic Validation - Add logging before returning 400
  if (!questionId || !listTitle || !metaTitle || !metaDescription || !content) {
      console.warn('[Validation Failed] Missing required fields. Received:', { questionId, listTitle, metaTitle, metaDescription, content: content ? '[content provided]' : '[content missing]' });
      return res.status(400).json({ message: 'Missing required fields (slug/ID, listTitle, metaTitle, metaDescription, content)' });
  }
  // Validate questionId format - Add logging before returning 400
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(questionId)) {
      console.warn(`[Validation Failed] Invalid ID/Slug format. Received ID: '${questionId}'`);
      return res.status(400).json({ message: 'Invalid ID/Slug format. Can only contain lowercase letters, numbers, and hyphens.' });
  }

  // Log received structured data before stringifying
  console.log('[Received Data] navSections:', navSections);
  console.log('[Received Data] sidebarData:', sidebarData);

  const navSectionsJson = JSON.stringify(Array.isArray(navSections) ? navSections : []);
  const sidebarDataJson = JSON.stringify(typeof sidebarData === 'object' && sidebarData !== null ? sidebarData : {});

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Insert the user-provided text ID into the question_id column
    // Ignore the auto-incrementing 'id' column
    const insertQuery = `
      INSERT INTO levitrask_questions (
        project_id, question_id, list_title, meta_title, meta_description, meta_keywords, 
        nav_sections, sidebar_data, content, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING question_id;
    `;
    const values = [
      PROJECT_ID,
      questionId, // Use the user-provided text ID here
      listTitle,
      metaTitle,
      metaDescription,
      metaKeywords,
      navSectionsJson,
      sidebarDataJson,
      content
    ];

    const result = await client.query(insertQuery, values);
    const newQuestionTextId = result.rows[0].question_id;
    await client.query('COMMIT');

    console.log(`[${new Date().toISOString()}] Successfully created question with text ID: ${newQuestionTextId} for project ${PROJECT_ID}`);
    res.status(201).json({ 
        message: 'Question created successfully', 
        questionId: newQuestionTextId, 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[${new Date().toISOString()}] Error creating question for project ${PROJECT_ID}:`, error);
    // Handle potential unique constraint violation for (project_id, question_id)
    if (error.code === '23505') { 
        return res.status(409).json({ message: `Error creating question: ID (Slug) '${questionId}' already exists.`, error: error.message });
    }
    res.status(500).json({ message: 'Error creating question', error: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/questions/:id - Delete a question
questionsRouter.delete('/:id', authenticateAdmin, async (req, res) => {
  const questionId = req.params.id; // Get the text ID from URL parameter
  console.log(`[${new Date().toISOString()}] DELETE /api/questions/${questionId} request received`);

  if (!questionId) {
    return res.status(400).json({ message: 'Missing question ID in URL parameter' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleteQuery = `
      DELETE FROM levitrask_questions 
      WHERE project_id = $1 AND question_id = $2
      RETURNING question_id;
    `;
    const values = [PROJECT_ID, questionId];
    const result = await client.query(deleteQuery, values);

    if (result.rowCount === 0) {
      // If no rows affected, the question ID wasn't found for this project
      await client.query('ROLLBACK');
      console.warn(`[${new Date().toISOString()}] Delete failed: Question with ID '${questionId}' not found for project ${PROJECT_ID}.`);
      return res.status(404).json({ message: 'Question not found' });
    }

    await client.query('COMMIT');
    console.log(`[${new Date().toISOString()}] Successfully deleted question with ID: ${questionId} for project ${PROJECT_ID}`);
    // Send 200 OK or 204 No Content
    res.status(200).json({ message: 'Question deleted successfully' }); 

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[${new Date().toISOString()}] Error deleting question with ID ${questionId}:`, error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/questions/:id - Update a question
questionsRouter.put('/:id', authenticateAdmin, async (req, res) => {
  const questionId = req.params.id; // Get the text ID from URL parameter
  console.log(`[${new Date().toISOString()}] PUT /api/questions/${questionId} request received`);

  if (!questionId) {
    return res.status(400).json({ message: 'Missing question ID in URL parameter' });
  }

  // Get updated data from request body
  const { 
    // Note: We don't allow changing the question_id (slug) itself via PUT typically
    listTitle, 
    metaTitle, 
    metaDescription, 
    metaKeywords, 
    navSections, // Expecting an array
    sidebarData, // Expecting an object
    content 
  } = req.body;

  // Basic Validation (ensure required fields for update are present)
  // Adjust validation rules based on whether partial updates are allowed
  if (!listTitle || !metaTitle || !metaDescription || !content) {
      return res.status(400).json({ message: 'Missing required fields for update (listTitle, metaTitle, metaDescription, content)' });
  }

  // Convert arrays/objects to JSON strings for DB storage
  const navSectionsJson = JSON.stringify(Array.isArray(navSections) ? navSections : []);
  const sidebarDataJson = JSON.stringify(typeof sidebarData === 'object' && sidebarData !== null ? sidebarData : {});

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateQuery = `
      UPDATE levitrask_questions 
      SET 
        list_title = $1, 
        meta_title = $2, 
        meta_description = $3, 
        meta_keywords = $4, 
        nav_sections = $5, 
        sidebar_data = $6, 
        content = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = $8 AND question_id = $9
      RETURNING question_id; -- Return ID to confirm update
    `;
    const values = [
      listTitle,
      metaTitle,
      metaDescription,
      metaKeywords,
      navSectionsJson,
      sidebarDataJson,
      content,
      PROJECT_ID,
      questionId // ID from URL parameter for WHERE clause
    ];

    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      // If no rows affected, the question ID wasn't found for this project
      await client.query('ROLLBACK');
      console.warn(`[${new Date().toISOString()}] Update failed: Question with ID '${questionId}' not found for project ${PROJECT_ID}.`);
      return res.status(404).json({ message: 'Question not found' });
    }

    await client.query('COMMIT');
    console.log(`[${new Date().toISOString()}] Successfully updated question with ID: ${questionId} for project ${PROJECT_ID}`);
    res.status(200).json({ message: 'Question updated successfully', questionId: result.rows[0].question_id }); 

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[${new Date().toISOString()}] Error updating question with ID ${questionId}:`, error);
    // Note: Unique constraint errors are unlikely during UPDATE unless you try to change a unique field
    res.status(500).json({ message: 'Error updating question', error: error.message });
  } finally {
    client.release();
  }
});

// --- TODO: Implement other CRUD routes later --- 
// POST /api/questions (Create)
// PUT /api/questions/:id (Update)
// GET /api/questions/:id (Get single item details - might be needed for edit)

export default questionsRouter; 