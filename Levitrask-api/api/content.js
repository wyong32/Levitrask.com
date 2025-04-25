import { Router } from 'express';
import pool from '../utils/db.js';

const PROJECT_ID = 'levitrask'; // Ensure this matches your project ID
const contentRouter = Router();

// --- GET /api/homepage-blocks --- (PUBLIC: Get all blocks for the project homepage, ordered)
contentRouter.get('/homepage-blocks', async (req, res) => {
  console.log(`[API Router - content.js] GET /homepage-blocks (Fetching public blocks for project: ${PROJECT_ID})`);
  try {
    const result = await pool.query(
      'SELECT block_id, nav_title, html_content FROM levitrask_admin_homepage_blocks WHERE project_id = $1 ORDER BY display_order ASC', 
      [PROJECT_ID]
    );
    // Return only necessary fields for the public frontend
    res.status(200).json(result.rows); 
  } catch (error) {
    console.error(`Error fetching public homepage blocks for project ${PROJECT_ID}:`, error);
    // Avoid exposing detailed errors to the public
    res.status(500).json({ message: 'Failed to load homepage content.' }); 
  }
});

// Add other public content routes here if needed in the future

export default contentRouter; 