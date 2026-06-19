require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("DELETE FROM \"User\" WHERE username = $1", ['testuser99']);
    console.log(`Deleted ${res.rowCount} users.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
