const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'erp' AND tablename = 'employee'
    `);
        console.log('Indexes:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
