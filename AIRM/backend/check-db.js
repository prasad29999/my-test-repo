import pool from './shared/database/connection.js';

async function checkData() {
    try {
        const profilesCount = await pool.query('SELECT count(*) FROM erp.profiles');
        const employeeCount = await pool.query('SELECT count(*) FROM erp.employee');
        const usersCount = await pool.query('SELECT count(*) FROM erp.users');

        console.log('Row Counts:');
        console.log(`erp.users: ${usersCount.rows[0].count}`);
        console.log(`erp.profiles: ${profilesCount.rows[0].count}`);
        console.log(`erp.employee: ${employeeCount.rows[0].count}`);

        const lastProfiles = await pool.query('SELECT id, full_name, updated_at FROM erp.profiles ORDER BY updated_at DESC LIMIT 5');
        console.log('\nLast 5 Profiles:');
        console.log(JSON.stringify(lastProfiles.rows, null, 2));

        const lastEmployees = await pool.query('SELECT id, full_name, profile_id FROM erp.employee ORDER BY id DESC LIMIT 5');
        console.log('\nLast 5 Employees:');
        console.log(JSON.stringify(lastEmployees.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
