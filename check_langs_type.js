const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'profiles' AND column_name = 'languages_known'
    `);
        console.log('Languages info:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
