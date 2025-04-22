const path = require('path');

// Load .env file from the parent directory (Levitrask-api)
// This ensures POSTGRES_URL is loaded for the pool
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../utils/db'); // Import the database pool utility

// Import the news data from the frontend project
// We need .default because newsData.js uses ES module `export default`
const allNewsData = require(path.resolve(__dirname, '../../Levitrask/src/Datas/newsData.js')).default;

const PROJECT_ID = 'levitrask'; // Use the same project identifier

async function migrateNews() {
  console.log('🚀 Starting news data migration...');
  const articles = Object.values(allNewsData); // Get an array of article objects
  let insertedCount = 0;
  let skippedCount = 0;

  if (!articles || articles.length === 0) {
    console.log('❌ No news articles found in the data file.');
    return;
  }

  console.log(`📰 Found ${articles.length} articles to potentially migrate.`);

  // Get a client from the pool for the migration operations
  const client = await pool.connect();
  console.log('🔗 Database client connected.');

  try {
    // SQL query to insert data into the levitrask_news table
    // ON CONFLICT (news_id) DO NOTHING makes the script safe to re-run.
    // If an article with the same news_id already exists, it will be skipped.
    const insertQuery = `
      INSERT INTO levitrask_news (
          news_id, project_id, list_title, list_date, list_source,
          list_image_src, list_image_alt, list_description,
          meta_title, meta_description, meta_keywords, content
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      ON CONFLICT (news_id) DO NOTHING;
    `;

    // Loop through each article in the imported data
    for (const article of articles) {
      // Basic validation: ensure article has an ID
      if (!article || !article.id) {
         console.warn('⚠️ Skipping invalid article data (missing ID):', JSON.stringify(article).substring(0, 100) + '...');
         skippedCount++;
         continue;
      }

      // Prepare the values array for the parameterized query
      // Use null for potentially missing fields to avoid SQL errors
      const values = [
        article.id,                       // news_id ($1)
        PROJECT_ID,                     // project_id ($2)
        article.listTitle || null,        // list_title ($3)
        article.listDate || null,         // list_date ($4)
        article.listSource || null,       // list_source ($5)
        article.listImage?.src || null,   // list_image_src ($6) - Safely access nested property
        article.listImage?.alt || null,   // list_image_alt ($7) - Safely access nested property
        article.listDescription || null,  // list_description ($8)
        article.metaTitle || null,        // meta_title ($9)
        article.metaDescription || null, // meta_description ($10)
        article.metaKeywords || null,     // meta_keywords ($11)
        article.content || null           // content ($12)
      ];

      try {
        // Execute the insert query
        const result = await client.query(insertQuery, values);
        // Check if a row was actually inserted (vs. skipped due to conflict)
        if (result.rowCount > 0) {
            insertedCount++;
            // console.log(`  -> Inserted: ${article.id}`); // Optional: more verbose logging
        } else {
            skippedCount++;
            // console.log(`  -> Skipped (already exists?): ${article.id}`); // Optional: more verbose logging
        }
      } catch (insertError) {
        // Log errors during insertion but continue with other articles
        console.error(`❌ Error inserting article ${article.id}:`, insertError.message);
        skippedCount++; // Count as skipped if an error occurs for this article
      }
    }

    console.log('\n✅ Migration finished.');
    console.log(`   ${insertedCount} articles inserted.`);
    console.log(`   ${skippedCount} articles skipped (due to conflict, error, or invalid data).`);

  } catch (error) {
    // Catch potential errors during connection or general script execution
    console.error('Migration script failed:', error);
  } finally {
    // VERY IMPORTANT: Release the client back to the pool
    if (client) {
      client.release();
      console.log('🔗 Database client released.');
    }
    // Close the entire pool after the script is done
    await pool.end();
    console.log('🚪 Database pool closed.');
  }
}

// Run the migration function
migrateNews(); 