// REMOVED: dotenv/config import is not needed in Vercel environment
// import 'dotenv/config'; 
import pg from 'pg'; // Import the pg package
const { Pool } = pg; // Destructure Pool from the imported object

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for Vercel Postgres
  },
  // Add explicit timeouts (adjust values as needed)
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 5000 // 5 seconds connection timeout (0 means disabled)
});

export default pool; // Use ES Module default export 