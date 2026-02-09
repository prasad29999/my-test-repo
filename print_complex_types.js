const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'profiles'
      AND (data_type = 'jsonb' OR data_type = 'ARRAY')
    `);
        res.rows.forEach(r => {
            console.log(`${r.column_name}: ${r.data_type}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
