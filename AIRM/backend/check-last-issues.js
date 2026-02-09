
import pool from './shared/database/connection.js';

async function checkIssues() {
    try {
        const res = await pool.query('SELECT id, title, status, project_name, created_at FROM issues ORDER BY id DESC LIMIT 5');
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkIssues();
