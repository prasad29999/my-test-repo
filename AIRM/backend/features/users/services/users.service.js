/**
 * Users Service
 * Business logic for user management
 */

import pool from '../../../shared/database/connection.js';

/**
 * Get all users
 */
export async function getAllUsers() {
  const result = await pool.query(
    `SELECT 
      u.id,
      u.email,
      u.full_name,
      u.created_at,
      ur.role,
      p.full_name as profile_name
    FROM erp.users u
    LEFT JOIN erp.user_roles ur ON u.id = ur.user_id
    LEFT JOIN erp.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC`
  );

  return result.rows.map(user => ({
    id: user.id,
    email: user.email,
    full_name: user.profile_name || user.full_name,
    role: user.role || 'user',
    created_at: user.created_at,
  }));
}

/**
 * Get all users with roles (using function)
 */
export async function getAllUsersWithRoles() {
  const result = await pool.query('SELECT * FROM erp.get_all_users_with_roles()');
  return result.rows;
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const result = await pool.query(
    `SELECT 
      u.id,
      u.email,
      u.full_name,
      u.created_at,
      ur.role
    FROM erp.users u
    LEFT JOIN erp.user_roles ur ON u.id = ur.user_id
    WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
}

/**
 * Update user role
 */
export async function updateUserRole(userId, role) {
  if (!role || !['admin', 'user'].includes(role)) {
    throw new Error('Invalid role');
  }

  // Check if user exists
  const userCheck = await pool.query(
    'SELECT id FROM erp.users WHERE id = $1',
    [userId]
  );

  if (userCheck.rows.length === 0) {
    throw new Error('User not found');
  }

  // Update or insert role
  await pool.query(
    `INSERT INTO erp.user_roles (user_id, role)
     VALUES ($1, $2)
     ON CONFLICT (user_id, role) DO UPDATE SET role = $2`,
    [userId, role]
  );

  return { user_id: userId, role };
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(email, fullName, role = 'user') {
  // Validate email
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }

  // Validate role
  if (role && !['admin', 'user'].includes(role)) {
    throw new Error('Invalid role');
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM erp.users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  // Create user
  const userResult = await pool.query(
    `INSERT INTO erp.users (id, email, full_name, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
     RETURNING id, email, full_name, created_at`,
    [email.toLowerCase(), fullName || '']
  );

  const newUser = userResult.rows[0];

  // Create user role
  await pool.query(
    `INSERT INTO erp.user_roles (id, user_id, role, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
    [newUser.id, role]
  );

  return {
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    role: role,
    created_at: newUser.created_at
  };
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUser(userId) {
  // Check if user exists
  const userCheck = await pool.query(
    'SELECT id FROM erp.users WHERE id = $1',
    [userId]
  );

  if (userCheck.rows.length === 0) {
    throw new Error('User not found');
  }

  // Delete user roles first
  await pool.query('DELETE FROM erp.user_roles WHERE user_id = $1', [userId]);

  // Delete user
  await pool.query('DELETE FROM erp.users WHERE id = $1', [userId]);

  return { deleted: true };
}

