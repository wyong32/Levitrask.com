import 'dotenv/config'; // Use import for side effects
import pg from 'pg'; // Import the pg package
const { Pool } = pg; // Destructure Pool from the imported object

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for Vercel Postgres
  }
});

export default pool; // Use ES Module default export 