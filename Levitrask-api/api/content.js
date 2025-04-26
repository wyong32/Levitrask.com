import { Router } from 'express';
import pool from '../utils/db.js';

const PROJECT_ID = 'levitrask'; // Ensure this matches your project ID
const DEFAULT_LANG = 'en'; // Define default language here as well
const contentRouter = Router();

// Helper function to sanitize language code
const sanitizeLangCode = (lang) => {
    if (typeof lang === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return lang;
    }
    return null;
}

// --- GET /api/homepage-blocks --- (REVISED for Multi-language)
contentRouter.get('/homepage-blocks', async (req, res) => {
  const requestedLang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG;
  console.log(`[API Router - content.js] GET /homepage-blocks - Fetching public blocks for lang '${requestedLang}', project '${PROJECT_ID}'`);

  try {
    const query = `
      SELECT
        hb.block_id,
        hb.display_order, -- Keep non-translatable fields from the main table
        COALESCE(t_lang.nav_title, t_default.nav_title) AS nav_title,       -- Get translated or default title
        COALESCE(t_lang.html_content, t_default.html_content) AS html_content -- Get translated or default content
      FROM levitrask_admin_homepage_blocks hb
      LEFT JOIN levitrask_admin_homepage_blocks_translations t_lang 
        ON hb.id = t_lang.block_id AND t_lang.language_code = $1
      LEFT JOIN levitrask_admin_homepage_blocks_translations t_default 
        ON hb.id = t_default.block_id AND t_default.language_code = $2
      WHERE hb.project_id = $3
        -- Ensure we only get blocks that have at least a default translation title/content (or requested lang)
        AND COALESCE(t_lang.nav_title, t_default.nav_title) IS NOT NULL 
        AND COALESCE(t_lang.html_content, t_default.html_content) IS NOT NULL 
      ORDER BY hb.display_order ASC;
    `;
    const result = await pool.query(query, [requestedLang, DEFAULT_LANG, PROJECT_ID]);
    console.log(`[API Router - content.js] Fetched ${result.rows.length} homepage blocks for lang '${requestedLang}'.`);
    
    // Return data in the format frontend expects (check IndexView.vue later)
    // Assuming frontend expects block_id, nav_title, html_content
    res.status(200).json(result.rows); 

  } catch (error) {
    console.error(`Error fetching public homepage blocks for project ${PROJECT_ID}, lang ${requestedLang}:`, error);
    res.status(500).json({ message: 'Failed to load homepage content.' }); 
  }
});

// Add other public content routes here if needed in the future

export default contentRouter; 