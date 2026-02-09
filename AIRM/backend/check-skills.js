import pool from './shared/database/connection.js';

async function checkSkillsType() {
    try {
        const res = await pool.query(`
      SELECT column_name, udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'profiles' AND column_name = 'skills'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSkillsType();
