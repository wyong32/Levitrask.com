const path = require('path');

// Load .env file from the parent directory (Levitrask-api)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../utils/db'); // Import the database pool utility

// Import the blog data from the frontend project
const allBlogsData = require(path.resolve(__dirname, '../../Levitrask/src/Datas/BlogsData.js')).default;

const PROJECT_ID = 'levitrask'; // Use the same project identifier

async function migrateBlogs() {
  console.log('🚀 Starting blog data migration...');
  const blogs = Object.values(allBlogsData); // Get an array of blog objects
  let insertedCount = 0;
  let skippedCount = 0;

  if (!blogs || blogs.length === 0) {
    console.log('❌ No blog posts found in the data file.');
    return;
  }

  console.log(`📝 Found ${blogs.length} blog posts to potentially migrate.`);

  const client = await pool.connect();
  console.log('🔗 Database client connected.');

  try {
    const insertQuery = `
      INSERT INTO levitrask_blogs (
          blog_id, project_id, list_title, list_description, list_image,
          list_date, meta_title, meta_description, meta_keywords,
          nav_sections, sidebar_data, content
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      ON CONFLICT (blog_id) DO NOTHING;
    `;

    for (const blog of blogs) {
      if (!blog || !blog.id) {
         console.warn('⚠️ Skipping invalid blog data (missing ID):', JSON.stringify(blog).substring(0, 100) + '...');
         skippedCount++;
         continue;
      }

      // Prepare values, stringifying JSONB fields
      const values = [
        blog.id,                       // blog_id ($1)
        PROJECT_ID,                    // project_id ($2)
        blog.listTitle || null,        // list_title ($3)
        blog.listDescription || null,  // list_description ($4)
        blog.listImage || null,        // list_image ($5) - Store image path directly
        blog.listDate || null,         // list_date ($6)
        blog.metaTitle || null,        // meta_title ($7)
        blog.metaDescription || null, // meta_description ($8)
        blog.metaKeywords || null,     // meta_keywords ($9)
        blog.navSections ? JSON.stringify(blog.navSections) : null, // nav_sections ($10)
        blog.sidebarData ? JSON.stringify(blog.sidebarData) : null, // sidebar_data ($11)
        blog.content || null           // content ($12)
      ];

      try {
        const result = await client.query(insertQuery, values);
        if (result.rowCount > 0) {
            insertedCount++;
        } else {
            skippedCount++;
        }
      } catch (insertError) {
        console.error(`❌ Error inserting blog post ${blog.id}:`, insertError.message);
        skippedCount++;
      }
    }

    console.log('\n✅ Migration finished.');
    console.log(`   ${insertedCount} blog posts inserted.`);
    console.log(`   ${skippedCount} blog posts skipped (due to conflict, error, or invalid data).`);

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

migrateBlogs(); 