import pool from './AIRM/backend/shared/database/connection.js';

async function migrate() {
    try {
        await pool.query('ALTER TABLE erp.employee ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES erp.profiles(id)');
        console.log('Added profile_id to erp.employee');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
