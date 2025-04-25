import { Router } from 'express';
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const PROJECT_ID = 'levitrask'; // Make sure this matches your project identifier
const homepageRouter = Router();

// --- GET /api/admin/homepage-blocks --- (Get all blocks for the project, ordered)
// Protected by authenticateAdmin middleware
homepageRouter.get('/homepage-blocks', authenticateAdmin, async (req, res) => {
  console.log(`[API Router - admin_homepage.js] GET /homepage-blocks (Fetching blocks for project: ${PROJECT_ID})`);
  try {
    const result = await pool.query(
      'SELECT id, block_id, nav_title, html_content, display_order FROM levitrask_admin_homepage_blocks WHERE project_id = $1 ORDER BY display_order ASC', 
      [PROJECT_ID]
    );
    res.status(200).json(result.rows); // Return the array of blocks
  } catch (error) {
    console.error(`Error fetching homepage blocks for project ${PROJECT_ID}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- PUT /api/admin/homepage-blocks --- (Replace all blocks for the project)
// Protected by authenticateAdmin middleware
homepageRouter.put('/homepage-blocks', authenticateAdmin, async (req, res) => {
  console.log(`[API Router - admin_homepage.js] PUT /homepage-blocks (Replacing blocks for project: ${PROJECT_ID})`);
  const blocks = req.body; // Expecting an array of block objects

  // --- Basic Validation ---
  if (!Array.isArray(blocks)) {
    return res.status(400).json({ message: 'Request body must be an array of blocks.' });
  }

  // Validate each block structure (add more checks as needed)
  const isValid = blocks.every((block, index) => 
    typeof block === 'object' &&
    block !== null &&
    typeof block.block_id === 'string' && block.block_id.trim() !== '' &&
    typeof block.nav_title === 'string' && block.nav_title.trim() !== '' &&
    // html_content can be null or string
    (block.html_content === null || typeof block.html_content === 'string') 
    // Assign display_order based on array index for simplicity when replacing all
  );

  if (!isValid) {
    console.warn('[Validation Failed - PUT /homepage-blocks] Invalid block structure received.', blocks);
    return res.status(400).json({ message: 'One or more blocks have invalid structure (missing or incorrect block_id, nav_title, or html_content type).' });
  }

  // --- Database Transaction --- 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete all existing blocks for this project
    console.log(`  Deleting existing blocks for project: ${PROJECT_ID}`);
    await client.query('DELETE FROM levitrask_admin_homepage_blocks WHERE project_id = $1', [PROJECT_ID]);

    // 2. Insert the new blocks sequentially
    console.log(`  Inserting ${blocks.length} new blocks...`);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      // Assign display_order based on array index
      const displayOrder = i;
      const insertQuery = `
        INSERT INTO levitrask_admin_homepage_blocks 
          (project_id, block_id, nav_title, html_content, display_order, created_at, updated_at)
        VALUES 
          ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `;
      const values = [
        PROJECT_ID,
        block.block_id,
        block.nav_title,
        block.html_content, // Can be null
        displayOrder
      ];
      await client.query(insertQuery, values);
    }

    // 3. Commit the transaction
    await client.query('COMMIT');
    console.log('  Homepage blocks replaced successfully.');
    res.status(200).json({ message: 'Homepage layout updated successfully.' });

  } catch (error) {
    await client.query('ROLLBACK');
    // Handle potential errors (e.g., unique constraint violation on block_id if validation missed it)
    if (error.code === '23505' && error.constraint === 'unique_project_block_id') {
         console.error('Error replacing homepage blocks: Duplicate block_id detected.', error);
         // We need to figure out *which* block_id was duplicated from the input array
         // For now, send a generic message
         return res.status(409).json({ message: 'Error updating layout: Duplicate Block ID found in the submitted data.' });
    }
    console.error('Error replacing homepage blocks:', error);
    res.status(500).json({ message: 'Internal Server Error while updating homepage layout.', error: error.message });
  } finally {
    client.release();
  }
});

export default homepageRouter; 