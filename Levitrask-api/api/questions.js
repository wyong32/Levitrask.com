const pool = require('../utils/db');
const PROJECT_ID = 'levitrask'; // Define project identifier

// --- CORS Helper Function (same as in news.js) ---
const allowCors = (handler) => async (req, res) => {
  const allowedOrigin = process.env.FRONTEND_URL || '*'; // Use env var or '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return handler(req, res);
};
// --- End CORS Helper ---

// Modified handler logic
const questionsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const relativePath = req.url;
    const pathSegments = relativePath.split('/').filter(Boolean);

    let result;
    let questionsData;

    // Check if request is for a specific question ID
    if (pathSegments.length === 1) {
      const questionId = pathSegments[0];
      console.log(`[API Handler - questions.js] Fetching question with ID: ${questionId}`);
      result = await pool.query('SELECT * FROM levitrask_questions WHERE project_id = $1 AND question_id = $2', [PROJECT_ID, questionId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: `Question with ID '${questionId}' not found.` });
      }

      const row = result.rows[0];
      questionsData = {
        id: row.question_id,
        listTitle: row.list_title,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaKeywords: row.meta_keywords,
        navSections: row.nav_sections || [],
        sidebarData: row.sidebar_data || {},
        content: row.content,
      };

    } else if (pathSegments.length === 0) {
      // Request for all questions
      console.log('[API Handler - questions.js] Fetching all questions');
      result = await pool.query('SELECT * FROM levitrask_questions WHERE project_id = $1', [PROJECT_ID]);

      // Transform into object keyed by question_id
      questionsData = result.rows.reduce((acc, row) => {
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
    } else {
      console.warn(`[API Handler - questions.js] Invalid relative path: ${relativePath}`);
      return res.status(404).json({ message: 'Not Found' });
    }

    res.status(200).json(questionsData);

  } catch (error) {
    console.error('Error fetching questions:', error);
    if (error.code === '42P01') {
        res.status(500).json({ message: 'Internal Server Error: Table "levitrask_questions" does not exist.' });
    } else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

// Export the wrapped handler
module.exports = allowCors(questionsHandler); 