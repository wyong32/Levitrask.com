import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../utils/db.js'; // 假设数据库连接池在此处

const router = express.Router();
const PROJECT_ID = 'levitrask'; // 或者从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_LANG = 'en'; // 定义默认语言

// Helper function to sanitize language code
const sanitizeLangCode = (lang) => {
    if (typeof lang === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return lang;
    }
    return null;
}

// Helper function to get translated value with fallback
const getTranslatedField = (fieldObject, lang, defaultLang) => {
    if (!fieldObject || typeof fieldObject !== 'object') {
        return null; // Or return empty string ''?
    }
    return fieldObject[lang] || fieldObject[defaultLang] || null; // Return requested lang, fallback to default, or null
};

// --- 中间件：验证 JWT ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        console.log('[API Sidebars Auth] Failed: No token provided.');
        return res.sendStatus(401); // if there isn't any token
    }

    if (!JWT_SECRET) {
        console.error('[API Sidebars Auth] Failed: JWT_SECRET not configured on server.');
        return res.sendStatus(500); // Internal Server Error if secret is missing
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('[API Sidebars Auth] Failed: Token verification failed.', err.message);
            return res.sendStatus(403); // Forbidden if token is invalid or expired
        }
        // 将解码后的用户信息附加到请求对象上，方便后续路由使用
        req.user = user;
        console.log(`[API Sidebars Auth] Success: Token verified for user ${user.username}, project ${user.projectId}`);
        // 确保请求的用户属于当前项目 (如果需要)
        if (user.projectId !== PROJECT_ID) {
             console.log(`[API Sidebars Auth] Forbidden: User project (${user.projectId}) does not match API project (${PROJECT_ID})`);
             return res.sendStatus(403);
        }
        next(); // pass the execution off to whatever request the client intended
    });
};


// --- 公开路由 (REVISED for Multi-language) ---

// GET /api/sidebars?page={page_identifier}&lang={language_code}
// 获取指定页面的侧边栏内容 (已翻译)
router.get('/', async (req, res) => {
    const pageIdentifier = req.query.page;
    const requestedLang = sanitizeLangCode(req.query.lang) || DEFAULT_LANG;

    if (!pageIdentifier) {
        return res.status(400).json({ message: 'Query parameter "page" (page_identifier) is required.' });
    }

    console.log(`[API Sidebars] GET request for project ${PROJECT_ID}, page: ${pageIdentifier}, lang: ${requestedLang}`);
    let client;
    try {
        client = await pool.connect();
        const query = `
            SELECT sidebar_content
            FROM levitrask_page_sidebars
            WHERE project_id = $1 AND page_identifier = $2;
        `;
        const result = await client.query(query, [PROJECT_ID, pageIdentifier]);

        if (result.rows.length > 0) {
            const sidebarContentRaw = result.rows[0].sidebar_content;

            // Process the raw content to get translated version
            let translatedContent = [];
            if (Array.isArray(sidebarContentRaw)) {
                translatedContent = sidebarContentRaw.map(block => {
                    // Ensure block is an object before accessing properties
                    if (block && typeof block === 'object') {
                        return {
                            // Get translated title with fallback
                            title: getTranslatedField(block.title, requestedLang, DEFAULT_LANG),
                            // Get translated html_content with fallback
                            html_content: getTranslatedField(block.html_content, requestedLang, DEFAULT_LANG)
                        };
                    } else {
                        console.warn(`[API Sidebars] Skipping invalid block in sidebar content for page ${pageIdentifier}:`, block);
                        return null; // Skip invalid blocks
                    }
                }).filter(block => block !== null); // Remove skipped blocks
            } else {
                 console.warn(`[API Sidebars] sidebar_content for page ${pageIdentifier} is not an array:`, sidebarContentRaw);
                 // Return empty array if content is not in expected array format
            }

            console.log(`[API Sidebars] Found and translated sidebar content for page: ${pageIdentifier}, lang: ${requestedLang}`);
            res.status(200).json(translatedContent); // Return the processed array

        } else {
            console.log(`[API Sidebars] No sidebar content found for page: ${pageIdentifier}. Returning empty array.`);
            res.status(200).json([]); // Return empty array if not found
        }
    } catch (error) {
        console.error('[API Sidebars] Error fetching sidebar content:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
});


// --- 管理路由 (需要认证) ---

// GET /api/admin/sidebars
// 获取所有侧边栏配置列表 (用于后台管理)
router.get('/admin', authenticateToken, async (req, res) => {
    console.log(`[API Sidebars Admin] GET request for all sidebars, project ${PROJECT_ID}. User: ${req.user.username}`);
    let client;
    try {
        client = await pool.connect();
        // 按更新时间倒序或按页面标识符排序
        const query = `
            SELECT id, page_identifier, sidebar_content, updated_at
            FROM levitrask_page_sidebars
            WHERE project_id = $1
            ORDER BY updated_at DESC;
        `;
        const result = await client.query(query, [PROJECT_ID]);
        console.log(`[API Sidebars Admin] Found ${result.rows.length} sidebar entries.`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('[API Sidebars Admin] Error fetching sidebar list:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
});

// POST /api/admin/sidebars (REVISED for Multi-language JSON structure)
// 创建新的侧边栏配置
router.post('/admin', authenticateToken, async (req, res) => {
    const { page_identifier, sidebar_content } = req.body;

    // --- Validation for page_identifier ---
    if (!page_identifier || typeof page_identifier !== 'string' || page_identifier.trim() === '') {
        return res.status(400).json({ message: 'page_identifier is required and must be a non-empty string.' });
    }

    // --- Validation for sidebar_content (New Multi-language Structure) ---
    if (!Array.isArray(sidebar_content)) {
         return res.status(400).json({ message: 'sidebar_content must be an array.' });
    }
    // Validate each block within the array
    for (const block of sidebar_content) {
        if (!block || typeof block !== 'object') {
             return res.status(400).json({ message: 'Each item in sidebar_content must be an object.' });
        }
        // Validate title object (must exist, be an object, and have at least 'en' key?)
        if (!block.title || typeof block.title !== 'object' || Object.keys(block.title).length === 0 ) { // || !block.title[DEFAULT_LANG]
             return res.status(400).json({ message: 'Each block must have a title object with at least one language key.' }); // Adjust validation as needed
        }
        // Validate html_content object (must exist, be an object, and have at least 'en' key?)
        if (!block.html_content || typeof block.html_content !== 'object' || Object.keys(block.html_content).length === 0) { // || !block.html_content[DEFAULT_LANG]
             return res.status(400).json({ message: 'Each block must have an html_content object with at least one language key.' }); // Adjust validation as needed
        }
        // Optional: Further validation for specific language keys or content format within title/html_content objects
    }

    console.log(`[API Sidebars Admin] POST request to create sidebar for page: ${page_identifier}. User: ${req.user.username}`);
    let client;
    try {
        client = await pool.connect();
        const query = `
            INSERT INTO levitrask_page_sidebars (project_id, page_identifier, sidebar_content)
            VALUES ($1, $2, $3::jsonb) -- Ensure data is treated as JSONB
            RETURNING id, page_identifier, sidebar_content, updated_at;
        `;
        // No need to stringify if the DB column is JSONB and pool handles it correctly
        // Pass the sidebar_content object directly
        console.log('[API Sidebars Admin] Storing sidebar_content:', sidebar_content);
        const result = await client.query(query, [PROJECT_ID, page_identifier.trim(), sidebar_content]);
        const newSidebar = result.rows[0];
        console.log(`[API Sidebars Admin] Successfully created sidebar with ID: ${newSidebar.id}`);
        res.status(201).json(newSidebar);
    } catch (error) {
        if (error.code === '23505') {
             console.warn(`[API Sidebars Admin] Failed to create sidebar: Unique constraint violation for page_identifier \"${page_identifier}\".`);
             return res.status(409).json({ message: `Sidebar configuration for page \"${page_identifier}\" already exists.` });
        }
        console.error('[API Sidebars Admin] Error creating sidebar:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
});

// PUT /api/admin/sidebars/:id (REVISED for Multi-language JSON structure)
// 更新指定 ID 的侧边栏配置
router.put('/admin/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { page_identifier, sidebar_content } = req.body;
    const sidebarDbId = parseInt(id, 10);

    // --- Validation for ID and page_identifier ---
     if (isNaN(sidebarDbId)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }
    if (!page_identifier || typeof page_identifier !== 'string' || page_identifier.trim() === '') {
        return res.status(400).json({ message: 'page_identifier is required and must be a non-empty string.' });
    }

    // --- Validation for sidebar_content (New Multi-language Structure) ---
    if (!Array.isArray(sidebar_content)) {
         return res.status(400).json({ message: 'sidebar_content must be an array.' });
    }
    for (const block of sidebar_content) {
        if (!block || typeof block !== 'object') {
             return res.status(400).json({ message: 'Each item in sidebar_content must be an object.' });
        }
        if (!block.title || typeof block.title !== 'object' || Object.keys(block.title).length === 0) {
             return res.status(400).json({ message: 'Each block must have a title object with at least one language key.' });
    }
        if (!block.html_content || typeof block.html_content !== 'object' || Object.keys(block.html_content).length === 0) {
             return res.status(400).json({ message: 'Each block must have an html_content object with at least one language key.' });
        }
    }

    console.log(`[API Sidebars Admin] PUT request to update sidebar ID: ${sidebarDbId}. User: ${req.user.username}`);
    let client;
    try {
        client = await pool.connect();
        const query = `
            UPDATE levitrask_page_sidebars
            SET page_identifier = $1, sidebar_content = $2::jsonb, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND project_id = $4
            RETURNING id, page_identifier, sidebar_content, updated_at;
        `;
        // Correct the order of parameters in the values array
        // AND explicitly stringify the sidebar_content for JSONB insertion
        const values = [
            page_identifier.trim(),         // Corresponds to $1
            JSON.stringify(sidebar_content), // Corresponds to $2 - Explicitly stringified
            sidebarDbId,                    // Corresponds to $3
            PROJECT_ID                      // Corresponds to $4
        ];
        console.log(`[API Sidebars Admin] Updating sidebar ID ${sidebarDbId} with stringified values:`, values);
        const result = await client.query(query, values); // Use the correctly ordered values array

        if (result.rowCount === 0) {
            console.warn(`[API Sidebars Admin] Update failed: Sidebar ID ${sidebarDbId} not found for project ${PROJECT_ID}.`);
            return res.status(404).json({ message: `Sidebar configuration with ID ${sidebarDbId} not found.` });
        }

        const updatedSidebar = result.rows[0];
        console.log(`[API Sidebars Admin] Successfully updated sidebar ID: ${updatedSidebar.id}`);
        res.status(200).json(updatedSidebar);
    } catch (error) {
        if (error.code === '23505') {
             console.warn(`[API Sidebars Admin] Failed to update sidebar ID ${sidebarDbId}: Unique constraint violation for page_identifier \"${page_identifier}\".`);
             return res.status(409).json({ message: `Another sidebar configuration already uses the page identifier \"${page_identifier}\".` });
        }
        console.error(`[API Sidebars Admin] Error updating sidebar ID ${sidebarDbId}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
});

// DELETE /api/admin/sidebars/:id
// 删除指定 ID 的侧边栏配置
router.delete('/admin/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }

    console.log(`[API Sidebars Admin] DELETE request for sidebar ID: ${id}. User: ${req.user.username}`);
    let client;
    try {
        client = await pool.connect();
        const query = `
            DELETE FROM levitrask_page_sidebars
            WHERE id = $1 AND project_id = $2;
        `;
        // .rowCount 包含受影响的行数
        const result = await client.query(query, [parseInt(id, 10), PROJECT_ID]);

        if (result.rowCount > 0) {
            console.log(`[API Sidebars Admin] Successfully deleted sidebar ID: ${id}`);
            res.status(204).send(); // No Content
        } else {
            console.log(`[API Sidebars Admin] Sidebar not found or project mismatch for ID: ${id}`);
            res.status(404).json({ message: `Sidebar with ID ${id} not found for this project.` });
        }
    } catch (error) {
        console.error(`[API Sidebars Admin] Error deleting sidebar ID ${id}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
});


export default router; 