import pool from './shared/database/connection.js';

async function fixSchema() {
    const columnsToAdd = [
        ['job_title', 'VARCHAR(255)'],
        ['gender', 'VARCHAR(50)'],
        ['emergency_contact', 'TEXT'],
        ['permanent_address', 'TEXT'],
        ['pf_number', 'VARCHAR(100)'],
        ['uan_number', 'VARCHAR(100)']
    ];

    try {
        for (const [col, type] of columnsToAdd) {
            console.log(`Adding column ${col}...`);
            await pool.query(`ALTER TABLE erp.profiles ADD COLUMN IF NOT EXISTS ${col} ${type}`);
        }
        console.log('✅ All missing columns added to erp.profiles');
        process.exit(0);
    } catch (e) {
        console.error('❌ Schema fix failed:');
        console.error(e);
        process.exit(1);
    }
}

fixSchema();
