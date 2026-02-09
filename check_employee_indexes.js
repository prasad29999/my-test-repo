const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`
      SELECT 
          a.attname AS column_name,
          format_type(a.atttypid, a.atttypmod) AS data_type,
          i.indisprimary AS is_primary
      FROM 
          pg_index i 
      JOIN 
          pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE 
          i.indrelid = 'erp.employee'::regclass
    `);
        console.log('Indexes:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
