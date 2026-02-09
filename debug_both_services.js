const pool = require('./AIRM/backend/shared/database/connection.js').default;
// Test BOTH services to see which one might be failing and why
const service1 = require('./AIRM/backend/features/users/services/users.service.js');
const service2 = require('./AIRM/backend/core/users/usersService.js');

async function test() {
    const userId = 'c8b6811c-3f65-4a5a-ac69-3bf4c4bd4d07';
    const role = 'admin';

    console.log('--- Testing Feature Service ---');
    try {
        const res = await service1.updateUserRole(userId, role);
        console.log('Feature Service Success:', res);
    } catch (e) {
        console.error('Feature Service FAIL:', e.message);
        if (e.detail) console.error('Detail:', e.detail);
    }

    console.log('\n--- Testing Core Service ---');
    try {
        const res = await service2.updateUserRole(userId, role);
        console.log('Core Service Success:', res);
    } catch (e) {
        console.error('Core Service FAIL:', e.message);
        if (e.detail) console.error('Detail:', e.detail);
    }

    await pool.end();
}

test();
