import { Router } from 'express'; // Restore Router import
// import jwt from 'jsonwebtoken'; // Remove jwt import
import pool from '../utils/db.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js'; // Restore import

// +++ Add log to confirm file load +++
console.log(">>>> admin_homepage.js ROUTER FILE LOADED <<<<"); 

const PROJECT_ID = 'levitrask';
const DEFAULT_LANG = 'en'; // Define default language, ensure consistency
// const JWT_SECRET = process.env.JWT_SECRET; // Remove JWT_SECRET

// // --- Copied authenticateToken logic from sidebars.js ---
// const authenticateToken = (req, res, next) => { ... }; // Remove copied function
// // --- End of copied authenticateToken logic ---

const homepageRouter = Router(); // Restore Router instance creation
console.log(">>>> homepageRouter INSTANCE CREATED <<<<"); // Restore log

// Remove the exported function structure
// export function registerHomepageRoutes(app) { ... }

// --- GET /homepage-blocks --- 
// Use homepageRouter and relative path
homepageRouter.get('/homepage-blocks', authenticateAdmin, async (req, res) => { 
    console.log(`[API Admin Homepage] GET /homepage-blocks ...`); 
    // ... handler logic ...
    try {
        const query = `
          SELECT hb.id, hb.project_id, hb.block_id, hb.display_order, hb.created_at, hb.updated_at,
                 COALESCE((SELECT jsonb_agg(jsonb_build_object('language_code', t.language_code, 'nav_title', t.nav_title, 'html_content', t.html_content, 'updated_at', t.updated_at) ORDER BY t.language_code) 
                           FROM levitrask_admin_homepage_blocks_translations t WHERE t.block_id = hb.id), '[]'::jsonb) AS translations
          FROM levitrask_admin_homepage_blocks hb
          WHERE hb.project_id = $1
          ORDER BY hb.display_order ASC;
        `;
        const result = await pool.query(query, [PROJECT_ID]);
        console.log(`  Fetched ${result.rows.length} blocks.`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`Error fetching homepage blocks with translations for project ${PROJECT_ID}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- POST /homepage-blocks --- 
// Use homepageRouter and relative path
homepageRouter.post('/homepage-blocks', authenticateAdmin, async (req, res) => { 
    console.log('!!!!!! POST /homepage-blocks HANDLER REACHED !!!!!!'); // Keep test log
    // ... handler logic ...
    const { block_id, translations } = req.body;
    console.log(`[API Admin Homepage] POST /homepage-blocks (Project: ${PROJECT_ID}) Data:`, { block_id, translations });
    if (!block_id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(block_id)) { return res.status(400).json({ message: 'Valid Block ID is required (lowercase, numbers, hyphens).' }); }
    if (!Array.isArray(translations) || translations.length === 0) { return res.status(400).json({ message: 'At least one translation is required.' }); }
    for (const t of translations) { if (!t.language_code || typeof t.language_code !== 'string' || !t.nav_title || typeof t.nav_title !== 'string') { return res.status(400).json({ message: 'Each translation must have a valid language_code and nav_title.' }); } }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orderResult = await client.query('SELECT MAX(display_order) as max_order FROM levitrask_admin_homepage_blocks WHERE project_id = $1', [PROJECT_ID]);
        const nextOrder = (orderResult.rows[0].max_order === null ? -1 : orderResult.rows[0].max_order) + 1;
        const insertBlockQuery = `INSERT INTO levitrask_admin_homepage_blocks (project_id, block_id, display_order, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id;`;
        const blockValues = [PROJECT_ID, block_id.trim(), nextOrder];
        const insertBlockResult = await client.query(insertBlockQuery, blockValues);
        const newBlockDbId = insertBlockResult.rows[0].id;
        const insertTranslationQuery = `INSERT INTO levitrask_admin_homepage_blocks_translations (block_id, language_code, nav_title, html_content, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
        for (const t of translations) { const translationValues = [newBlockDbId, t.language_code.trim(), t.nav_title.trim(), t.html_content || null]; await client.query(insertTranslationQuery, translationValues); }
        await client.query('COMMIT');
        const fetchNewBlockQuery = `SELECT hb.id, hb.project_id, hb.block_id, hb.display_order, hb.created_at, hb.updated_at, COALESCE((SELECT jsonb_agg(jsonb_build_object('language_code', t.language_code, 'nav_title', t.nav_title, 'html_content', t.html_content, 'updated_at', t.updated_at) ORDER BY t.language_code) FROM levitrask_admin_homepage_blocks_translations t WHERE t.block_id = hb.id), '[]'::jsonb) AS translations FROM levitrask_admin_homepage_blocks hb WHERE hb.id = $1;`;
        const newBlockResult = await client.query(fetchNewBlockQuery, [newBlockDbId]);
        res.status(201).json(newBlockResult.rows[0] || null);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { console.error(`Error creating homepage block: Unique constraint violation.`, error.detail); if (error.constraint === 'unique_project_block_id' || error.message.includes('levitrask_admin_homepage_blocks_pkey') || error.message.includes('block_id')) { return res.status(409).json({ message: `Block ID "${block_id}" already exists for this project.` }); } else if (error.constraint === 'unique_block_language') { return res.status(409).json({ message: `Duplicate language code provided in translations.` }); } else { return res.status(409).json({ message: `A unique constraint was violated.` }); } }
        console.error('Error creating homepage block:', error);
        res.status(500).json({ message: 'Internal Server Error while creating block.', error: error.message });
    } finally { client.release(); }
});

// --- PUT /homepage-blocks/:id --- 
// Use homepageRouter and relative path
homepageRouter.put('/homepage-blocks/:id(\d+)', authenticateAdmin, async (req, res) => { 
    console.log('!!!!!! PUT /homepage-blocks/:id HANDLER REACHED !!!!!!'); // Keep test log
    // ... handler logic ...
    const { id } = req.params;
    const { block_id } = req.body;
    console.log(`[API Admin Homepage] PUT /homepage-blocks/${id} (Project: ${PROJECT_ID}) Data:`, { block_id });
    if (!block_id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(block_id)) { return res.status(400).json({ message: 'Valid Block ID is required.' }); }
    try {
        const updateQuery = `UPDATE levitrask_admin_homepage_blocks SET block_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND project_id = $3 RETURNING id, block_id, display_order, updated_at;`;
        const values = [block_id.trim(), parseInt(id, 10), PROJECT_ID];
        const result = await pool.query(updateQuery, values);
        if (result.rowCount === 0) { console.log(`  Homepage block with DB ID ${id} not found for project ${PROJECT_ID}.`); return res.status(404).json({ message: `Block with ID ${id} not found.` }); }
        const fetchUpdatedBlockQuery = `SELECT hb.id, hb.project_id, hb.block_id, hb.display_order, hb.created_at, hb.updated_at, COALESCE((SELECT jsonb_agg(jsonb_build_object('language_code', t.language_code, 'nav_title', t.nav_title, 'html_content', t.html_content, 'updated_at', t.updated_at) ORDER BY t.language_code) FROM levitrask_admin_homepage_blocks_translations t WHERE t.block_id = hb.id), '[]'::jsonb) AS translations FROM levitrask_admin_homepage_blocks hb WHERE hb.id = $1;`;
        const updatedBlockResult = await pool.query(fetchUpdatedBlockQuery, [id]);
        console.log('  Homepage block main fields updated successfully.');
        res.status(200).json(updatedBlockResult.rows[0] || null);
    } catch (error) { if (error.code === '23505') { console.error(`Error updating homepage block ${id}: Duplicate block_id "${block_id}".`); return res.status(409).json({ message: `Another block already uses the Block ID "${block_id}".` }); } console.error(`Error updating homepage block ${id}:`, error); res.status(500).json({ message: 'Internal Server Error while updating block.', error: error.message }); }
});

// --- PUT /homepage-blocks/:id/translations/:lang --- 
// Use homepageRouter and relative path
homepageRouter.put('/homepage-blocks/:id/translations/:lang', authenticateAdmin, async (req, res) => { 
    console.log('!!!!!! PUT /homepage-blocks/:id/translations/:lang HANDLER REACHED !!!!!!'); // Keep test log
    // ... handler logic ...
    const { id } = req.params;
    const lang = req.params.lang.trim();
    const { nav_title, html_content } = req.body;
    const blockDbId = parseInt(id, 10);
    if (isNaN(blockDbId)) { return res.status(400).json({ message: 'Invalid Block ID provided in URL.' }); }
    console.log(`[API Admin Homepage] PUT /homepage-blocks/${blockDbId}/translations/${lang} (Project: ${PROJECT_ID}) Data:`, { nav_title, html_content });
    if (!lang || !nav_title) { return res.status(400).json({ message: 'Language code and Nav Title are required.' }); }
    try {
        const upsertQuery = `INSERT INTO levitrask_admin_homepage_blocks_translations (block_id, language_code, nav_title, html_content, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (block_id, language_code) DO UPDATE SET nav_title = EXCLUDED.nav_title, html_content = EXCLUDED.html_content, updated_at = CURRENT_TIMESTAMP RETURNING block_id, language_code, nav_title, html_content, updated_at;`;
        const values = [blockDbId, lang, nav_title.trim(), html_content || null];
        const result = await pool.query(upsertQuery, values);
        const checkBlockExists = await pool.query('SELECT 1 FROM levitrask_admin_homepage_blocks WHERE id = $1 AND project_id = $2', [blockDbId, PROJECT_ID]);
        if (checkBlockExists.rowCount === 0) { console.log(`  Attempted to update translation for non-existent or wrong project block DB ID ${blockDbId}.`); return res.status(404).json({ message: `Block with ID ${blockDbId} not found.` }); }
        console.log(`  Translation for block ${blockDbId}, lang ${lang} upserted successfully.`);
        res.status(200).json(result.rows[0]);
    } catch (error) { if (error.code === '23503') { console.error(`Error upserting translation: Block ID ${blockDbId} does not exist.`); return res.status(404).json({ message: `Block with ID ${blockDbId} not found.` }); } console.error(`Error upserting translation for block ${blockDbId}, lang ${lang}:`, error); res.status(500).json({ message: 'Internal Server Error while updating translation.', error: error.message }); }
});

// --- PUT /homepage-blocks/reorder --- 
// Use homepageRouter and relative path
homepageRouter.put('/homepage-blocks/reorder', authenticateAdmin, async (req, res) => { 
    console.log('!!!!!! PUT /homepage-blocks/reorder HANDLER REACHED !!!!!!'); // Keep test log
    // ... handler logic ...
    const { orderedIds } = req.body;
    console.log(`[API Admin Homepage] PUT /homepage-blocks/reorder (Project: ${PROJECT_ID}) Data:`, { orderedIds });
    if (!Array.isArray(orderedIds)) { return res.status(400).json({ message: 'orderedIds must be an array.' }); }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateQuery = `UPDATE levitrask_admin_homepage_blocks SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND project_id = $3;`;
        for (let i = 0; i < orderedIds.length; i++) { const blockId = parseInt(orderedIds[i], 10); if (isNaN(blockId)) { throw new Error(`Invalid non-numeric ID found in orderedIds: ${orderedIds[i]}`); } const displayOrder = i; await client.query(updateQuery, [displayOrder, blockId, PROJECT_ID]); console.log(`  Updated display_order for block ID ${blockId} to ${displayOrder}.`); }
        await client.query('COMMIT');
        console.log('  Homepage block order updated successfully.');
        res.status(200).json({ message: 'Block order updated successfully.' });
    } catch (error) { await client.query('ROLLBACK'); console.error('Error reordering homepage blocks:', error); res.status(500).json({ message: 'Internal Server Error while reordering blocks.', error: error.message }); } finally { client.release(); }
});

// --- DELETE /homepage-blocks/:id --- 
// Use homepageRouter and relative path
homepageRouter.delete('/homepage-blocks/:id(\d+)', authenticateAdmin, async (req, res) => { 
    console.log('!!!!!! DELETE /homepage-blocks/:id HANDLER REACHED !!!!!!'); // Keep test log
    // ... handler logic ...
    const { id } = req.params;
    const blockDbId = parseInt(id, 10);
    console.log(`[API Admin Homepage] DELETE /homepage-blocks/${blockDbId} (Project: ${PROJECT_ID})`);
    const client = await pool.connect();
    try {
        const deleteQuery = `DELETE FROM levitrask_admin_homepage_blocks WHERE id = $1 AND project_id = $2;`;
        const result = await client.query(deleteQuery, [blockDbId, PROJECT_ID]);
        if (result.rowCount === 0) { console.log(`  Homepage block with ID ${blockDbId} not found for project ${PROJECT_ID}.`); return res.status(404).json({ message: `Block with ID ${blockDbId} not found.` }); }
        console.log(`  Successfully deleted homepage block with ID ${blockDbId}.`);
        res.status(204).send();
    } catch (error) {
        console.error(`Error deleting homepage block ${blockDbId}:`, error);
        res.status(500).json({ message: 'Internal Server Error while deleting block.', error: error.message });
    } finally {
        client.release();
    }
});

console.log(">>>> DELETE /homepage-blocks/:id ROUTE DEFINED <<<<"); // Restore log

export default homepageRouter; // Restore default export 