import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Import helpers
import dotenv from 'dotenv';
import pool from '../utils/db.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Path to the question data file
const questionDataPath = path.resolve(__dirname, '../../Levitrask/src/Datas/questionData.js');
let allQuestionData = {};

const PROJECT_ID = 'levitrask';

// Async function to load data using dynamic import
async function loadQuestionData() {
    try {
        const questionDataUrl = pathToFileURL(questionDataPath).href;
        console.log(`Attempting to dynamically import question data from: ${questionDataUrl}`);
        const questionModule = await import(questionDataUrl);
        allQuestionData = questionModule.default; // Assuming default export
        console.log('❓ Question data loaded successfully.');
    } catch (err) {
        console.error(`❌ Failed to load question data from ${questionDataPath}:`, err);
        allQuestionData = {};
    }
}

async function migrateQuestions() {
    console.log('🚀 Starting question data migration...');
    await loadQuestionData(); // Ensure data is loaded first

    const questions = Object.values(allQuestionData);
    let insertedCount = 0;
    let skippedCount = 0;
    let deletedCount = 0;

    if (!questions || questions.length === 0) {
        console.log('❌ No questions found in the data file.');
        return;
    }

    console.log(`❓ Found ${questions.length} questions to potentially migrate.`);

    const client = await pool.connect();
    console.log('🔗 Database client connected.');

    try {
        // --- Delete existing questions for this project --- 
        console.log(`🗑️ Deleting existing questions for project '${PROJECT_ID}'...`);
        const deleteResult = await client.query(
            'DELETE FROM levitrask_questions WHERE project_id = $1',
            [PROJECT_ID]
        );
        deletedCount = deleteResult.rowCount;
        console.log(`   -> ${deletedCount} existing questions deleted.`);
        // --- Deletion finished --- 

        // Use a transaction for the inserts
        await client.query('BEGIN');

        const insertQuery = `
          INSERT INTO levitrask_questions (
              question_id, project_id, list_title, meta_title, meta_description,
              meta_keywords, nav_sections, sidebar_data, content,
              created_at, updated_at
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9,
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          -- Keep ON CONFLICT just in case, though unlikely after DELETE
          ON CONFLICT (question_id) DO NOTHING; 
        `;

        for (const question of questions) {
            if (!question || !question.id) {
                console.warn('⚠️ Skipping invalid question data (missing ID):');
                skippedCount++;
                continue;
            }

            // Ensure navSections and sidebarData are stringified, default to null if not present
            const navSectionsJson = question.navSections ? JSON.stringify(question.navSections) : null;
            const sidebarDataJson = question.sidebarData ? JSON.stringify(question.sidebarData) : null;

            const values = [
                question.id,                      // question_id ($1)
                PROJECT_ID,                    // project_id ($2)
                question.listTitle || null,       // list_title ($3)
                question.metaTitle || null,       // meta_title ($4)
                question.metaDescription || null, // meta_description ($5)
                question.metaKeywords || null,    // meta_keywords ($6)
                navSectionsJson,               // nav_sections ($7)
                sidebarDataJson,               // sidebar_data ($8)
                question.content || null          // content ($9)
            ];

            try {
                const result = await client.query(insertQuery, values);
                if (result.rowCount > 0) {
                    insertedCount++;
                } else {
                    skippedCount++; 
                    console.warn(`  -> Skipped ${question.id} (unexpectedly found conflict after delete?)`);
                }
            } catch (insertError) {
                console.error(`❌ Error inserting question ${question.id}:`, insertError.message);
                skippedCount++; 
                await client.query('ROLLBACK');
                console.error('Transaction rolled back due to insertion error.');
                throw insertError; 
            }
        }

        await client.query('COMMIT');
        console.log('\n✅ Migration finished successfully.');
        console.log(`   ${deletedCount} questions deleted.`);
        console.log(`   ${insertedCount} questions inserted.`);
        console.log(`   ${skippedCount} questions skipped.`);

    } catch (error) {
        console.error('Migration script failed:', error);
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

migrateQuestions(); 