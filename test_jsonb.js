const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function test() {
    try {
        console.log('Testing array to jsonb...');
        // Drop test table if exists
        await pool.query('DROP TABLE IF EXISTS erp.test_jsonb');
        await pool.query('CREATE TABLE erp.test_jsonb (data jsonb)');

        // Test 1: Passing JS array directly
        try {
            await pool.query('INSERT INTO erp.test_jsonb (data) VALUES ($1)', [['English', 'Hindi']]);
            console.log('✅ JS array directly works');
        } catch (e) {
            console.log('❌ JS array directly fails:', e.message);
        }

        // Test 2: Passing stringified array
        try {
            await pool.query('INSERT INTO erp.test_jsonb (data) VALUES ($1)', [JSON.stringify(['English', 'Hindi'])]);
            console.log('✅ Stringified array works');
        } catch (e) {
            console.log('❌ Stringified array fails:', e.message);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

test();
