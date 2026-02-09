import pool from './shared/database/connection.js';

async function listAllData() {
    try {
        const users = await pool.query('SELECT id, email, full_name FROM erp.users ORDER BY created_at DESC');
        console.log(`Total Users: ${users.rowCount}`);

        for (const user of users.rows) {
            const profile = await pool.query('SELECT id, job_title, department FROM erp.profiles WHERE id = $1', [user.id]);
            const employee = await pool.query('SELECT id, full_name, email FROM erp.employee WHERE profile_id = $1', [user.id]);

            console.log(`\nUser: ${user.email} (${user.full_name})`);
            console.log(`  Profile Row: ${profile.rowCount > 0 ? 'exists' : 'MISSING'}`);
            console.log(`  Employee Row: ${employee.rowCount > 0 ? 'exists' : 'MISSING'}`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listAllData();
