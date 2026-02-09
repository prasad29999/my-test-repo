
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: '143.110.249.144',
    database: 'salesmaya_agent',
    password: 'techiemaya',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addColumns() {
    try {
        console.log('Adding lapse columns to erp.leave_balances...');

        await pool.query(`
      ALTER TABLE erp.leave_balances 
      ADD COLUMN IF NOT EXISTS lapse NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lapse_date DATE;
    `);

        console.log('Successfully added lapse and lapse_date columns.');
    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await pool.end();
    }
}

addColumns();
