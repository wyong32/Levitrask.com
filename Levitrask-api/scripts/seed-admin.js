import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../utils/db.js'; // Use ES Module import

// --- Configuration ---
const DEFAULT_USERNAME = 'admin'; // 您希望的默认用户名
const DEFAULT_PASSWORD = 'admin123'; // 您的默认密码 (!!! 仅用于首次设置，建议更改)
const PROJECT_ID = 'levitrask';      // 您的项目 ID
const SALT_ROUNDS = 10;             // bcrypt 哈希轮数 (推荐 >= 10)

async function seedAdminUser() {
  console.log('🚀 Starting admin user seeding...');

  if (!DEFAULT_PASSWORD) {
    console.error('❌ Error: DEFAULT_PASSWORD is not set in the script.');
    return;
  }

  let client;
  try {
    // Hash the default password
    console.log(`🔒 Hashing password for user '${DEFAULT_USERNAME}'...`);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    console.log('   Password hashed successfully.');

    // Connect to the database
    client = await pool.connect();
    console.log('🔗 Database client connected.');

    // Prepare the SQL query with ON CONFLICT
    const insertQuery = `
      INSERT INTO admin_users (project_id, username, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, username) DO NOTHING;
    `;

    const values = [PROJECT_ID, DEFAULT_USERNAME, hashedPassword];

    // Execute the query
    console.log(`💼 Attempting to insert/update admin user '${DEFAULT_USERNAME}' for project '${PROJECT_ID}'...`);
    const result = await client.query(insertQuery, values);

    if (result.rowCount > 0) {
      console.log(`✅ Successfully inserted default admin user '${DEFAULT_USERNAME}'.`);
    } else {
      console.log(`⏭️ Default admin user '${DEFAULT_USERNAME}' already exists for project '${PROJECT_ID}', skipped insertion.`);
    }

  } catch (error) {
    console.error('❌ Error during admin user seeding:', error);
  } finally {
    // Release the client and close the pool
    if (client) {
      client.release();
      console.log('🔗 Database client released.');
    }
    await pool.end();
    console.log('🚪 Database pool closed.');
  }
}

// Run the seeding function
seedAdminUser(); 