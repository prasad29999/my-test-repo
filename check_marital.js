const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'employee' AND column_name = 'marital_status'
    `);
        console.log('marital_status exists:', res.rows.length > 0);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
