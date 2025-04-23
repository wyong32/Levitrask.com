import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Import pathToFileURL
import dotenv from 'dotenv'; // Use import for dotenv
import fs from 'fs'; // Needed for reading data file potentially, or use dynamic import
import pool from '../utils/db.js'; // Use import for the db pool

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the parent directory (Levitrask-api)
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the blog data from the frontend project using dynamic import
// const allBlogsData = require(path.resolve(__dirname, '../../Levitrask/src/Datas/BlogsData.js')).default;
let allBlogsData = {};
const blogsDataPath = path.resolve(__dirname, '../../Levitrask/src/Datas/BlogsData.js');

const PROJECT_ID = 'levitrask'; // Use the same project identifier

async function loadBlogData() {
    try {
        // Convert the absolute path to a file URL before importing
        const blogsDataUrl = pathToFileURL(blogsDataPath).href;
        console.log(`Attempting to dynamically import from: ${blogsDataUrl}`);
        const blogsModule = await import(blogsDataUrl);
        allBlogsData = blogsModule.default; // Assuming it exports default
        console.log('📚 Blog data loaded successfully.');
    } catch (err) {
        console.error(`❌ Failed to load blog data from ${blogsDataPath} (URL: ${pathToFileURL(blogsDataPath).href}):`, err);
        // Optionally, try fs.readFileSync if dynamic import fails for some reason (less common for .js)
        /*
        try {
            const rawData = fs.readFileSync(blogsDataPath, 'utf8');
            // This assumes the file exports a simple object, might need evaluation
            // This is generally NOT recommended for JS files, dynamic import is better
            console.warn('Falling back to reading file content directly, might not parse correctly.');
            // Attempt to evaluate (use with caution!)
            // allBlogsData = eval(rawData); // Security risks with eval!
        } catch (fsErr) {
            console.error(`❌ Failed to read blog data file using fs:`, fsErr);
        }
        */
       allBlogsData = {}; // Ensure it's empty if loading fails
    }
}

async function migrateBlogs() {
  console.log('🚀 Starting blog data migration...');
  await loadBlogData(); // Load data first

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