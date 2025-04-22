const path = require('path');

// Load .env file from the parent directory (Levitrask-api)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../utils/db'); // Import the database pool utility

// Import the question data from the frontend project
const allQuestionData = require(path.resolve(__dirname, '../../Levitrask/src/Datas/questionData.js')).default;

const PROJECT_ID = 'levitrask'; // Use the same project identifier

async function migrateQuestions() {
  console.log('🚀 Starting question data migration...');
  const questions = Object.values(allQuestionData); // Get an array of question objects
  let insertedCount = 0;
  let skippedCount = 0;

  if (!questions || questions.length === 0) {
    console.log('❌ No questions found in the data file.');
    return;
  }

  console.log(`❓ Found ${questions.length} questions to potentially migrate.`);

  const client = await pool.connect();
  console.log('🔗 Database client connected.');

  try {
    const insertQuery = `
      INSERT INTO levitrask_questions (
          question_id, project_id, list_title, meta_title, meta_description,
          meta_keywords, nav_sections, sidebar_data, content
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      ON CONFLICT (question_id) DO NOTHING;
    `;

    for (const question of questions) {
      if (!question || !question.id) {
         console.warn('⚠️ Skipping invalid question data (missing ID):', JSON.stringify(question).substring(0, 100) + '...');
         skippedCount++;
         continue;
      }

      // Prepare values, ensuring JSONB fields are properly stringified
      // Use null for missing fields
      const values = [
        question.id,                      // question_id ($1)
        PROJECT_ID,                    // project_id ($2)
        question.listTitle || null,       // list_title ($3)
        question.metaTitle || null,       // meta_title ($4)
        question.metaDescription || null, // meta_description ($5)
        question.metaKeywords || null,    // meta_keywords ($6)
        // Stringify the object/array for JSONB columns before inserting
        question.navSections ? JSON.stringify(question.navSections) : null, // nav_sections ($7)
        question.sidebarData ? JSON.stringify(question.sidebarData) : null, // sidebar_data ($8)
        question.content || null          // content ($9)
      ];

      try {
        const result = await client.query(insertQuery, values);
        if (result.rowCount > 0) {
            insertedCount++;
        } else {
            skippedCount++;
        }
      } catch (insertError) {
        console.error(`❌ Error inserting question ${question.id}:`, insertError.message);
        // Log the problematic values for debugging
        // console.error('Values:', values);
        skippedCount++;
      }
    }

    console.log('\n✅ Migration finished.');
    console.log(`   ${insertedCount} questions inserted.`);
    console.log(`   ${skippedCount} questions skipped (due to conflict, error, or invalid data).`);

  } catch (error) {
    console.error('Migration script failed:', error);
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