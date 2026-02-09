const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'employee'
      ORDER BY column_name
    `);
        console.log('DATA_START');
        console.log(JSON.stringify(res.rows));
        console.log('DATA_END');
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await pool.end();
    }
}

run();
