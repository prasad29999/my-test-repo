const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function run() {
    try {
        const res = await pool.query("SELECT gen_random_uuid() as uuid");
        console.log('gen_random_uuid works:', res.rows[0].uuid);
    } catch (e1) {
        console.log('gen_random_uuid fails');
        try {
            const res2 = await pool.query("SELECT uuid_generate_v4() as uuid");
            console.log('uuid_generate_v4 works:', res2.rows[0].uuid);
        } catch (e2) {
            console.log('Both fail');
        }
    } finally {
        await pool.end();
    }
}

run();
