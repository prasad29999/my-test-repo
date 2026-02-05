/**
 * Issues Service
 * Business logic for issue management
 */

import * as issueModel from '../models/issues.pg.js';
import * as gitlabService from './gitlab.service.js';

/**
 * Get all issues
 */
export async function getAllIssues(userId, isAdmin, filters) {
  const issues = await issueModel.getAllIssues({
    ...filters,
    userId,
    isAdmin
  });

  return issues.map(issue => ({
    ...issue,
    assignees: issue.assignees || [],
    labels: issue.labels || [],
  }));
}

/**
 * Get issue by ID
 */
export async function getIssueById(issueId) {
  const issue = await issueModel.getIssueById(issueId);

  if (!issue) {
    throw new Error('Issue not found');
  }

  const [assignees, labels, comments, activity] = await Promise.all([
    issueModel.getIssueAssignees(issueId),
    issueModel.getIssueLabels(issueId),
    issueModel.getIssueComments(issueId),
    issueModel.getIssueActivity(issueId)
  ]);

  return {
    ...issue,
    assignees,
    labels,
    comments,
    activity,
  };
}

/**
 * Create issue
 */
export async function createIssue(issueData, userId) {
  const {
    title,
    description,
    status,
    priority,
    project_id,
    project_name,
    assignee_ids,
    label_ids,
    estimate_hours,
    start_date,
    due_date
  } = issueData;

  // 1. Create issue in local database erp.issues (primary source of truth for UI)
  const issue = await issueModel.createIssue({
    title,
    description,
    status: status || 'open',
    priority: priority || 'medium',
    project_name: project_name,
    created_by: userId
  });

  // 2. Handle GitLab integration if project_id is provided
  if (project_id) {
    try {
      // Get project info
      const project = await issueModel.getGitLabProject(project_id);
      if (project) {
        // Get label names for GitLab
        const labelNames = label_ids ? await issueModel.getLabelsByIds(label_ids) : [];

        // Create issue in GitLab
        const gitlabIssue = await gitlabService.createGitLabIssue(project.gitlab_project_id, {
          title,
          description,
          labelNames,
          assigneeIds: assignee_ids,
          estimateHours: estimate_hours,
          dueDate: due_date
        });

        // Link GitLab info back to local issue
        await issueModel.updateIssue(issue.id, {
          gitlab_id: gitlabIssue.id,
          gitlab_iid: gitlabIssue.iid
        });

        // Also create entry in erp.gitlab_issues for backward compatibility/mapping
        try {
          await issueModel.createGitLabIssue({
            gitlab_issue_id: gitlabIssue.id,
            gitlab_iid: gitlabIssue.iid,
            project_id: project.gitlab_project_id,
            title,
            description,
            status: status || 'open',
            priority: priority || 'medium',
            created_by: userId,
            estimate_hours,
            start_date,
            due_date
          });
        } catch (err) {
          console.warn('Failed to insert into erp.gitlab_issues mapping table:', err.message);
        }

        issue.gitlab_url = gitlabIssue.web_url;
      }
    } catch (gitlabError) {
      console.error('GitLab issue creation failed, continuing with local issue:', gitlabError.message);
      // We don't throw here so that the local issue still "exists" even if GitLab is down
    }
  }

  // 3. Add activity
  await issueModel.addIssueActivity(issue.id, userId, 'created', {
    title,
    project_name: project_name
  });

  // 4. Assign users
  if (assignee_ids && Array.isArray(assignee_ids)) {
    await issueModel.assignUsers(issue.id, assignee_ids, userId);
  }

  // 5. Add labels
  if (label_ids && Array.isArray(label_ids)) {
    for (const labelId of label_ids) {
      await issueModel.addLabel(issue.id, labelId, userId);
    }
  }

  return {
    ...issue,
    project_name: project_name || issue.project_name
  };
}

/**
 * Update issue
 */
export async function updateIssue(issueId, updates, userId) {
  // Verify issue exists in main issues table first
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  // Try to get GitLab issue info (optional)
  const gitlabIssue = await issueModel.getGitLabIssue(issueId);

  // Update in GitLab if GitLab integration exists
  if (gitlabIssue) {
    try {
      await gitlabService.updateGitLabIssue(
        gitlabIssue.gitlab_project_id,
        gitlabIssue.gitlab_iid,
        updates
      );
    } catch (gitlabError) {
      console.error('GitLab update failed:', gitlabError.message);
      // Continue with local update even if GitLab fails
    }

    // Update in GitLab issues table if it exists
    try {
      await issueModel.updateGitLabIssue(issueId, updates);
    } catch (error) {
      console.error('Failed to update GitLab issue table:', error.message);
      // Continue with main issues table update
    }
  }

  // Update in main issues table (always)
  const updatedIssue = await issueModel.updateIssue(issueId, updates);

  // Track status change
  if (updates.status && updates.status !== issue.status) {
    await issueModel.addIssueActivity(issueId, userId, 'status_changed', {
      old_status: issue.status,
      new_status: updates.status,
    });
  }

  return updatedIssue;
}

/**
 * Add comment
 */
export async function addComment(issueId, userId, comment) {
  // Verify issue exists first
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  // Try to get GitLab issue info (optional - issue may not have GitLab association)
  const issueInfo = await issueModel.getGitLabIssueInfo(issueId);

  // Post comment to GitLab if issue has GitLab association
  if (issueInfo) {
    try {
      await gitlabService.postCommentToGitLab(
        issueInfo.gitlab_project_id,
        issueInfo.gitlab_iid,
        comment
      );
    } catch (gitlabError) {
      console.error('GitLab comment post failed:', gitlabError.response?.data || gitlabError.message);
      // Continue with local save even if GitLab fails
    }
  }

  // Add comment locally
  const commentRecord = await issueModel.addComment(issueId, userId, comment);

  if (!commentRecord || !commentRecord.id) {
    console.error('Failed to create comment record:', { issueId, userId, commentLength: comment?.length });
    throw new Error('Failed to create comment');
  }

  const commentWithUser = await issueModel.getCommentWithUser(commentRecord.id);

  if (!commentWithUser) {
    console.error('Failed to retrieve comment with user info:', { commentId: commentRecord.id });
    throw new Error('Failed to retrieve comment');
  }

  // Add activity
  await issueModel.addIssueActivity(issueId, userId, 'commented', {
    comment: comment.substring(0, 100)
  });

  return commentWithUser;
}

/**
 * Assign users to issue
 */
export async function assignUsers(issueId, assigneeIds, assignedBy) {
  // Verify issue exists
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  // Verify users exist
  for (const assigneeId of assigneeIds) {
    const assigneeIdStr = String(assigneeId).trim();
    const userExists = await issueModel.checkUserExists(assigneeIdStr);
    if (!userExists) {
      throw new Error(`User ${assigneeIdStr} not found`);
    }
  }

  // Assign users
  const assigned = await issueModel.assignUsersToIssue(issueId, assigneeIds, assignedBy);

  // Add activity for each assigned user
  for (const assigneeId of assigned) {
    await issueModel.addIssueActivity(issueId, assignedBy, 'assigned_user', {
      assigned_user_id: assigneeId
    });
  }

  return assigned;
}

/**
 * Unassign user from issue
 */
export async function unassignUser(issueId, userId, unassignedBy) {
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  const removed = await issueModel.unassignUserFromIssue(issueId, userId);
  if (!removed) {
    throw new Error('User assignment not found');
  }

  await issueModel.addIssueActivity(issueId, unassignedBy, 'unassigned_user', {
    unassigned_user_id: userId
  });

  return true;
}

/**
 * Add label to issue
 */
export async function addLabel(issueId, labelId, userId) {
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  const label = await issueModel.getLabelById(labelId);
  if (!label) {
    throw new Error('Label not found');
  }

  // Check if already assigned
  const existing = await issueModel.getIssueLabels(issueId);
  if (existing.some(l => l.id === labelId)) {
    return { message: 'Label already assigned' };
  }

  await issueModel.addLabelToIssue(issueId, labelId);
  await issueModel.addIssueActivity(issueId, userId, 'added_label', {
    label_id: labelId,
    label_name: label.name
  });

  return { message: 'Label added successfully' };
}

/**
 * Remove label from issue
 */
export async function removeLabel(issueId, labelId, userId) {
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  const label = await issueModel.getLabelById(labelId);
  const removed = await issueModel.removeLabelFromIssue(issueId, labelId);

  if (!removed) {
    throw new Error('Label assignment not found');
  }

  await issueModel.addIssueActivity(issueId, userId, 'removed_label', {
    label_id: labelId,
    label_name: label?.name || 'Unknown'
  });

  return { message: 'Label removed successfully' };
}

/**
 * Delete issue
 */
export async function deleteIssue(issueId, userId) {
  // Verify issue exists
  const issue = await issueModel.getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }

  // Try to get GitLab issue info (optional)
  const gitlabIssue = await issueModel.getGitLabIssue(issueId);

  // Delete from GitLab if integrated
  if (gitlabIssue) {
    try {
      await gitlabService.deleteGitLabIssue(
        gitlabIssue.gitlab_project_id,
        gitlabIssue.gitlab_iid
      );
    } catch (gitlabError) {
      console.error('GitLab issue deletion failed:', gitlabError.message);
    }
  }

  // Add activity before deleting (optional - might not persist if parent is deleted)
  // Actually, delete from local DB
  const deletedIssue = await issueModel.deleteIssue(issueId);

  return deletedIssue;
}

