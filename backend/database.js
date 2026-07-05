import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Connection Pool
// ---------------------------------------------------------------------------
// Reads DB credentials from environment variables.
// Add these to your .env file:
//   DB_HOST=localhost
//   DB_PORT=5432
//   DB_NAME=your_db
//   DB_USER=your_user
//   DB_PASSWORD=your_password
// ---------------------------------------------------------------------------

const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    ssl: {
        rejectUnauthorized: false
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

async function testDB() {
    try {
        const client = await pool.connect();

        const result = await client.query("SELECT NOW()");

        console.log("[DB] Connected successfully:", result.rows[0]);

        client.release();
    } catch (err) {
        console.error("[DB] Connection failed:", err.message);
    }
}

testDB();

export default pool