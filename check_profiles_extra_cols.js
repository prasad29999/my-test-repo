const pool = require('./AIRM/backend/shared/database/connection.js').default;

async function check() {
    try {
        const cols = ['date_of_birth', 'marital_status', 'bank_name', 'bank_ifsc', 'bank_branch',
            'bank_account_number', 'uan_number', 'current_address', 'permanent_address',
            'languages_known', 'blood_group', 'emergency_contact', 'gender'];
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'profiles' AND column_name = ANY($1)
    `, [cols]);
        const existing = res.rows.map(r => r.column_name);
        console.log('Existing columns:', existing);
        console.log('Missing columns:', cols.filter(c => !existing.includes(c)));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
