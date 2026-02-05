/**
 * Projects Service
 * Business logic for project management
 */

import * as projectModel from '../models/projects.pg.js';
import * as gitlabService from './gitlab.service.js';

/**
 * Get all projects
 */
export async function getAllProjects() {
  return await projectModel.getAllProjects();
}

/**
 * Get project by ID
 */
export async function getProjectById(id) {
  const project = await projectModel.getProjectById(id);

  if (!project) {
    throw new Error('Project not found');
  }

  return {
    id: !isNaN(parseInt(id)) && String(id).match(/^\d+$/) ? parseInt(id) : id,
    name: project.name,
    description: project.description,
    visibility: 'private',
    issue_count: parseInt(project.issue_count),
    open_issues: parseInt(project.open_issues),
    closed_issues: parseInt(project.closed_issues),
    created_at: project.created_at
  };
}

/**
 * Create project
 */
export async function createProject(name, description, userId) {
  const issue = await projectModel.createProject(name, description, userId);

  return {
    id: issue.id,
    name: name,
    description: description,
    visibility: 'private',
    issue_count: 1,
    open_issues: 1,
    closed_issues: 0,
    created_at: issue.created_at
  };
}

/**
 * Update project
 */
export async function updateProject(id, updates) {
  const project = await projectModel.getGitLabProject(id);

  if (!project) {
    throw new Error('Project not found');
  }

  // Update in GitLab
  if (Object.keys(updates).length > 0) {
    try {
      await gitlabService.updateGitLabProject(project.gitlab_project_id, updates);
    } catch (gitlabError) {
      throw new Error(`Failed to update project in GitLab: ${gitlabError.response?.data?.message || gitlabError.message}`);
    }
  }

  // Update in local database
  const updatedProject = await projectModel.updateGitLabProject(id, updates);

  return updatedProject || project;
}

/**
 * Delete project
 */
export async function deleteProject(id) {
  // 1. Try numeric ID (GitLab project) first
  if (!isNaN(parseInt(id)) && String(id).match(/^\d+$/)) {
    const gitlabProject = await projectModel.getGitLabProject(id);

    if (gitlabProject) {
      const projectName = gitlabProject.name;

      // Delete from GitLab (optional but recommended)
      try {
        await gitlabService.deleteGitLabProject(gitlabProject.gitlab_project_id);
      } catch (gitlabError) {
        console.warn('Could not delete from GitLab:', gitlabError.response?.data?.message || gitlabError.message);
      }

      // Also delete local mirrored issues by name to be sure
      await projectModel.deleteProjectByName(projectName);

      // Delete local database gitlab_projects record (this handles gitlab_issues in pg model)
      await projectModel.deleteGitLabProject(id);

      return { name: projectName };
    }
  }

  // 2. If not a GitLab project, it could be a local project name or issue ID
  // Use getProjectById to resolve the project name regardless of ID type
  const project = await projectModel.getProjectById(id);

  if (!project) {
    throw new Error('Project not found');
  }

  // Delete all issues associated with this project name
  await projectModel.deleteProjectByName(project.name);

  return { name: project.name };
}

/**
 * Get project members
 */
export async function getProjectMembers(id) {
  const project = await projectModel.getGitLabProject(id);

  if (!project) {
    throw new Error('Project not found');
  }

  try {
    return await gitlabService.getProjectMembers(project.gitlab_project_id);
  } catch (gitlabError) {
    throw new Error(`Failed to get project members: ${gitlabError.response?.data?.message || gitlabError.message}`);
  }
}

/**
 * Add project member
 */
export async function addProjectMember(id, userId, accessLevel) {
  const project = await projectModel.getGitLabProject(id);

  if (!project) {
    throw new Error('Project not found');
  }

  try {
    return await gitlabService.addProjectMember(project.gitlab_project_id, userId, accessLevel);
  } catch (gitlabError) {
    throw new Error(`Failed to add member: ${gitlabError.response?.data?.message || gitlabError.message}`);
  }
}

