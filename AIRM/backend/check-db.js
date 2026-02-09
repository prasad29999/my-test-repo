import pool from './shared/database/connection.js';

async function checkData() {
    try {
        const profilesCount = await pool.query('SELECT count(*) FROM profiles');
        const employeeCount = await pool.query('SELECT count(*) FROM employee');
        const usersCount = await pool.query('SELECT count(*) FROM users');

        console.log('Row Counts:');
        console.log(`users: ${usersCount.rows[0].count}`);
        console.log(`profiles: ${profilesCount.rows[0].count}`);
        console.log(`employee: ${employeeCount.rows[0].count}`);

        const lastProfiles = await pool.query('SELECT id, full_name, updated_at FROM profiles ORDER BY updated_at DESC LIMIT 5');
        console.log('\nLast 5 Profiles:');
        console.log(JSON.stringify(lastProfiles.rows, null, 2));

        const lastEmployees = await pool.query('SELECT id, full_name, profile_id FROM employee ORDER BY id DESC LIMIT 5');
        console.log('\nLast 5 Employees:');
        console.log(JSON.stringify(lastEmployees.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
