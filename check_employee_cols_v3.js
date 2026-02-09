const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'employee'
      ORDER BY column_name
    `);
        console.log('COLUMNS_START');
        res.rows.forEach(r => console.log(r.column_name));
        console.log('COLUMNS_END');
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await pool.end();
    }
}

run();
