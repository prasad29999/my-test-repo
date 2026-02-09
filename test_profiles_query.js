const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function test() {
    try {
        console.log('Testing getAllProfiles query...');
        const result = await pool.query(
            `SELECT 
        u.id,
        u.email,
        COALESCE(e.full_name, p.full_name, u.full_name) as full_name,
        u.created_at,
        ur.role,
        COALESCE(e.mobile_no, p.phone) as phone,
        p.skills,
        p.employee_id,
        p.join_date,
        p.updated_at
      FROM erp.users u
      LEFT JOIN erp.user_roles ur ON u.id = ur.user_id
      LEFT JOIN erp.profiles p ON u.id = p.id
      LEFT JOIN erp.employee e ON p.id = e.profile_id
      LIMIT 5`
        );
        console.log('✅ Success! Rows fetched:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('Sample row:', result.rows[0]);
        }
    } catch (err) {
        console.error('❌ FAIL:', err.message);
    } finally {
        await pool.end();
    }
}

test();
