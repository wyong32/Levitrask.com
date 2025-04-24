// REMOVED: dotenv/config import is not needed in Vercel environment
// import 'dotenv/config'; 
import pg from 'pg'; // Import the pg package
const { Pool } = pg; // Destructure Pool from the imported object

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for Vercel Postgres
  }
});

export default pool; // Use ES Module default export 