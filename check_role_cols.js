const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function run() {
    try {
        const res = await pool.query("SELECT * FROM erp.user_roles LIMIT 1");
        if (res.rows.length === 0) {
            console.log('No roles found');
        } else {
            console.log('Columns:', Object.keys(res.rows[0]));
            console.log('Sample row:', res.rows[0]);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
