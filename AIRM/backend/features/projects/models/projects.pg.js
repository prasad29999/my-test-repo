/**
 * Projects Model
 * PostgreSQL queries for project operations
 */

import pool from '../../../shared/database/connection.js';

/**
 * Get all project names from issues
 */
export async function getAllProjectNames() {
  const result = await pool.query(
    'SELECT DISTINCT project_name FROM issues WHERE project_name IS NOT NULL AND project_name != \'\''
  );
  return result.rows.map(r => r.project_name);
}

/**
 * Get all unified projects (Local + GitLab)
 */
export async function getAllProjects() {
  // Get local project stats
  const localStats = await pool.query(
    `SELECT 
      project_name as name,
      COUNT(*) as issue_count,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_issues,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_issues,
      MIN(created_at) as created_at
    FROM issues 
    WHERE project_name IS NOT NULL AND project_name != ''
    GROUP BY project_name`
  );

  // Get gitlab projects if table exists
  let gitlabProjects = { rows: [] };
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'erp' 
        AND table_name = 'gitlab_projects'
      );
    `);

    if (tableCheck.rows[0]?.exists) {
      gitlabProjects = await pool.query(
        'SELECT * FROM gitlab_projects ORDER BY created_at DESC'
      );
    }
  } catch (err) {
    console.warn('GitLab projects table not available:', err.message);
  }

  // Map to unified format
  const unified = [];
  const processedNames = new Set();

  // Add gitlab projects first
  for (const gp of gitlabProjects.rows) {
    const stats = localStats.rows.find(s => s.name === gp.name);
    unified.push({
      id: gp.id,
      gitlab_project_id: gp.gitlab_project_id,
      name: gp.name,
      description: gp.description,
      visibility: gp.visibility,
      issue_count: stats ? parseInt(stats.issue_count) : 0,
      open_issues: stats ? parseInt(stats.open_issues) : 0,
      closed_issues: stats ? parseInt(stats.closed_issues) : 0,
      created_at: gp.created_at,
      source: 'gitlab'
    });
    processedNames.add(gp.name);
  }

  // Add remaining local projects
  for (const ls of localStats.rows) {
    if (!processedNames.has(ls.name)) {
      unified.push({
        id: ls.name, // Use name as ID for local
        name: ls.name,
        description: `Local project ${ls.name}`,
        visibility: 'private',
        issue_count: parseInt(ls.issue_count),
        open_issues: parseInt(ls.open_issues),
        closed_issues: parseInt(ls.closed_issues),
        created_at: ls.created_at,
        source: 'local'
      });
    }
  }

  return unified;
}

/**
 * Get project by ID or name
 */
export async function getProjectById(id) {
  const isNumeric = !isNaN(parseInt(id)) && String(id).match(/^\d+$/);

  const query = `
    SELECT 
      project_name as name,
      description,
      COUNT(*) as issue_count,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_issues,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_issues,
      MIN(created_at) as created_at
    FROM issues 
    WHERE ${isNumeric ? 'id = $1 OR project_name = (SELECT project_name FROM issues WHERE id = $1)' : 'project_name = $1'}
    GROUP BY project_name, description`;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Create project (creates an issue entry)
 */
export async function createProject(name, description, userId) {
  const result = await pool.query(
    `INSERT INTO issues (title, description, status, priority, project_name, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      `${name} - Project`,
      description || `Project: ${name}`,
      'open',
      'medium',
      name,
      userId
    ]
  );
  return result.rows[0];
}

/**
 * Get GitLab project
 */
export async function getGitLabProject(id) {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'erp' 
        AND table_name = 'gitlab_projects'
      );
    `);

    if (!tableCheck.rows[0]?.exists) {
      return null;
    }

    const result = await pool.query(
      'SELECT * FROM gitlab_projects WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.warn('GitLab projects table not available:', err.message);
    return null;
  }
}

/**
 * Update GitLab project
 */
export async function updateGitLabProject(id, updates) {
  const updateFields = [];
  const updateValues = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    updateFields.push(`${key} = $${paramCount}`);
    updateValues.push(value);
    paramCount++;
  });

  if (updateFields.length === 0) {
    return null;
  }

  updateValues.push(id);
  const updateQuery = `
    UPDATE gitlab_projects 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);
  return result.rows[0];
}

/**
 * Delete GitLab project
 */
export async function deleteGitLabProject(id) {
  // First, check for gitlab_issues table and delete related issues to avoid FK constraints
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'erp' 
        AND table_name = 'gitlab_issues'
      );
    `);

    if (tableCheck.rows[0]?.exists) {
      // Get the gitlab_project_id first
      const project = await getGitLabProject(id);
      if (project) {
        await pool.query('DELETE FROM gitlab_issues WHERE project_id = $1', [project.gitlab_project_id]);
      }
    }
  } catch (err) {
    console.warn('Error cleaning up gitlab_issues:', err.message);
  }

  const result = await pool.query(
    'DELETE FROM gitlab_projects WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get project by name
 */
export async function getProjectByName(name) {
  const result = await pool.query(
    `SELECT 
      project_name as name,
      MIN(created_at) as created_at
    FROM issues 
    WHERE project_name = $1
    GROUP BY project_name`,
    [name]
  );
  return result.rows[0] || null;
}

/**
 * Delete project by name (removes all issues)
 */
export async function deleteProjectByName(name) {
  const result = await pool.query(
    'DELETE FROM issues WHERE project_name = $1 RETURNING *',
    [name]
  );
  return result.rows;
}

