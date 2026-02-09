import pool from './shared/database/connection.js';

async function checkEmployeeCols() {
    try {
        const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'employee'
      ORDER BY column_name
    `);
        console.log(res.rows.map(r => r.column_name).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkEmployeeCols();
