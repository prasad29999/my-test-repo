const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'profiles'
    `);
        const types = {};
        res.rows.forEach(r => types[r.column_name] = r.data_type);
        console.log(JSON.stringify(types, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
