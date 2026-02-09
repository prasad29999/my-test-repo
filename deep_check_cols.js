const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const tables = ['profiles', 'employee'];
        for (const table of tables) {
            const res = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'erp' AND table_name = $1
      `, [table]);
            const columns = res.rows.map(r => r.column_name);
            console.log(`Table: erp.${table}`);
            console.log('Columns:', columns.join(', '));
            console.log('Contains employee_id:', columns.includes('employee_id'));
            console.log('---');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
