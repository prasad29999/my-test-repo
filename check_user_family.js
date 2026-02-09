const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    const userId = '67380655-9dd7-4bf6-8a5a-accb426d032c';
    try {
        const profileRes = await pool.query('SELECT family_details FROM erp.profiles WHERE id = $1', [userId]);
        console.log('Profile Family Details:', JSON.stringify(profileRes.rows[0]?.family_details, null, 2));

        const familyRes = await pool.query('SELECT * FROM erp.employee_family_members WHERE profile_id = $1', [userId]);
        console.log('Employee Family Members Table:', JSON.stringify(familyRes.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
