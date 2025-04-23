import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Import helpers
import dotenv from 'dotenv';
import pool from '../utils/db.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Path to the news data file
const newsDataPath = path.resolve(__dirname, '../../Levitrask/src/Datas/newsData.js');
let allNewsData = {};

const PROJECT_ID = 'levitrask';

// Async function to load data using dynamic import
async function loadNewsData() {
    try {
        const newsDataUrl = pathToFileURL(newsDataPath).href;
        console.log(`Attempting to dynamically import news data from: ${newsDataUrl}`);
        const newsModule = await import(newsDataUrl);
        allNewsData = newsModule.default; // Assuming default export
        console.log('📰 News data loaded successfully.');
    } catch (err) {
        console.error(`❌ Failed to load news data from ${newsDataPath}:`, err);
        allNewsData = {};
    }
}

async function migrateNews() {
    console.log('🚀 Starting news data migration...');
    await loadNewsData(); // Ensure data is loaded first

    const articles = Object.values(allNewsData);
    let insertedCount = 0;
    let skippedCount = 0;
    let deletedCount = 0;

    if (!articles || articles.length === 0) {
        console.log('❌ No news articles found in the data file.');
        return;
    }

    console.log(`📰 Found ${articles.length} articles to potentially migrate.`);

    const client = await pool.connect();
    console.log('🔗 Database client connected.');

    try {
        // --- Delete existing news for this project --- 
        console.log(`🗑️ Deleting existing news for project '${PROJECT_ID}'...`);
        const deleteResult = await client.query(
            'DELETE FROM levitrask_news WHERE project_id = $1',
            [PROJECT_ID]
        );
        deletedCount = deleteResult.rowCount;
        console.log(`   -> ${deletedCount} existing news posts deleted.`);
        // --- Deletion finished --- 

        // Use a transaction for the inserts
        await client.query('BEGIN');

        const insertQuery = `
          INSERT INTO levitrask_news (
              news_id, project_id, list_title, list_date, list_source,
              list_image_src, list_image_alt, list_description,
              meta_title, meta_description, meta_keywords, content,
              created_at, updated_at
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          -- Keep ON CONFLICT just in case, though unlikely after DELETE
          ON CONFLICT (news_id) DO NOTHING; 
        `;

        for (const article of articles) {
            if (!article || !article.id) {
                console.warn('⚠️ Skipping invalid article data (missing ID):');
                skippedCount++;
                continue;
            }

            const values = [
                article.id,                       
                PROJECT_ID,                     
                article.listTitle || null,        
                article.listDate || null,         
                article.listSource || null,       
                article.listImage?.src || null,   
                article.listImage?.alt || null,   
                article.listDescription || null,  
                article.metaTitle || null,        
                article.metaDescription || null, 
                article.metaKeywords || null,     
                article.content || null           
            ];

            try {
                const result = await client.query(insertQuery, values);
                if (result.rowCount > 0) {
                    insertedCount++;
                } else {
                    // This case should be rare now after deleting old data
                    skippedCount++; 
                    console.warn(`  -> Skipped ${article.id} (unexpectedly found conflict after delete?)`);
                }
            } catch (insertError) {
                console.error(`❌ Error inserting article ${article.id}:`, insertError.message);
                skippedCount++; 
                // Rollback the transaction on error
                await client.query('ROLLBACK');
                console.error('Transaction rolled back due to insertion error.');
                // Optionally re-throw or handle differently
                throw insertError; // Stop the whole migration on first error
            }
        }

        // If loop completes without error, commit the transaction
        await client.query('COMMIT');
        console.log('\n✅ Migration finished successfully.');
        console.log(`   ${deletedCount} posts deleted.`);
        console.log(`   ${insertedCount} articles inserted.`);
        console.log(`   ${skippedCount} articles skipped.`);

    } catch (error) {
        // Catch errors from DELETE or general execution
        console.error('Migration script failed:', error);
        // Ensure rollback if transaction was started but failed before commit/rollback
        try { await client.query('ROLLBACK'); } catch (rbErr) { /* ignore rollback error */ }
    } finally {
        if (client) {
            client.release();
            console.log('🔗 Database client released.');
        }
        await pool.end();
        console.log('🚪 Database pool closed.');
    }
}

migrateNews(); 