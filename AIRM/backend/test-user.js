import pool from './shared/database/connection.js';

async function testUserCreation() {
    try {
        console.log('Testing user creation...');
        const res = await pool.query(
            'INSERT INTO erp.users (id, email, full_name, created_at, updated_at) VALUES (uuid_generate_v4(), $1, $2, now(), now()) RETURNING id',
            ['temptest@example.com', 'Temp Test User']
        );
        console.log('✅ User created successfully, ID:', res.rows[0].id);

        // Cleanup
        await pool.query('DELETE FROM erp.users WHERE id = $1', [res.rows[0].id]);
        console.log('✅ Cleanup successful');

        process.exit(0);
    } catch (e) {
        console.error('❌ User creation failed:');
        console.error(e);
        process.exit(1);
    }
}

testUserCreation();
