const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const res = await pool.query(`SELECT uuid_generate_v4()`);
        console.log('uuid_generate_v4 works:', res.rows[0].uuid_generate_v4);
    } catch (err) {
        console.error('uuid_generate_v4 fails:', err.message);
    } finally {
        await pool.end();
    }
}

check();
