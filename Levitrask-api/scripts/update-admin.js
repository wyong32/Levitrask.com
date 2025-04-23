import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../utils/db.js'; // Adjust path if your db utility is elsewhere

// --- Configuration: Specify the user to update and the new credentials ---
const TARGET_PROJECT_ID = 'levitrask'; // The project ID of the user
const TARGET_USERNAME = 'admin';    // The current username of the user to update

// Set new credentials (leave newUsername null or undefined if not changing username)
const NEW_USERNAME = null; // Or specify a new username like 'newadmin'
const NEW_PASSWORD = 'your_new_secure_password_here'; // <<<--- REPLACE WITH THE ACTUAL NEW PASSWORD

const SALT_ROUNDS = 10; // Must match the salt rounds used during seeding/login
// --------------------------------------------------------------------------

async function updateAdminUser() {
  console.log(`Starting admin user update process for user: ${TARGET_USERNAME} in project: ${TARGET_PROJECT_ID}...`);

  if (!NEW_PASSWORD) {
    console.error('Error: NEW_PASSWORD cannot be empty. Please set a new password in the script.');
    return;
  }

  let client;
  try {
    // 1. Hash the new password
    console.log(`Hashing new password...`);
    const newPasswordHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    console.log('  ✓ New password hashed successfully.');

    // 2. Connect to the database
    console.log('Connecting to the database...');
    client = await pool.connect();
    console.log('  ✓ Database client connected successfully.');

    // 3. Build and Execute the UPDATE query
    let queryText;
    let queryParams;

    if (NEW_USERNAME && NEW_USERNAME !== TARGET_USERNAME) {
      // Update both username and password hash
      console.log(`Preparing to update username to '${NEW_USERNAME}' and password hash...`);
      queryText = `
        UPDATE admin_users
        SET password_hash = $1, username = $2
        WHERE project_id = $3 AND username = $4
        RETURNING id; -- Optional: return id to confirm update
      `;
      queryParams = [newPasswordHash, NEW_USERNAME, TARGET_PROJECT_ID, TARGET_USERNAME];
    } else {
      // Update only the password hash
      console.log('Preparing to update password hash only...');
      queryText = `
        UPDATE admin_users
        SET password_hash = $1
        WHERE project_id = $2 AND username = $3
        RETURNING id; -- Optional: return id to confirm update
      `;
      queryParams = [newPasswordHash, TARGET_PROJECT_ID, TARGET_USERNAME];
    }

    console.log('Executing database update...');
    const res = await client.query(queryText, queryParams);

    if (res.rowCount > 0) {
        const finalUsername = NEW_USERNAME || TARGET_USERNAME;
        console.log(`  ✓ Successfully updated user '${finalUsername}' (ID: ${res.rows[0].id}) in project '${TARGET_PROJECT_ID}'.`);
    } else {
        console.warn(`  ! Warning: No user found with username '${TARGET_USERNAME}' in project '${TARGET_PROJECT_ID}'. No changes made.`);
    }

  } catch (err) {
    console.error('Error during admin user update process:', err.stack);
  } finally {
    // 4. Release the client and close the pool
    if (client) {
      client.release();
      console.log('Database client released.');
    }
    // It's generally better practice to not end the pool in scripts that might be run repeatedly
    // await pool.end();
    // console.log('Database pool closed.');
     console.log('Admin user update process finished.');
  }
}

updateAdminUser(); 