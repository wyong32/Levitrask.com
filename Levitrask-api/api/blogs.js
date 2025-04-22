const pool = require('../utils/db');
const PROJECT_ID = 'levitrask'; // Define project identifier

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // TODO: Adjust the table and column names based on your actual schema
    const result = await pool.query('SELECT * FROM blogs WHERE project_id = $1', [PROJECT_ID]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}; 