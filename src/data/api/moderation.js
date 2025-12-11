/**
 * Shared moderation API functions for ban, unban, and bulk operations
 * Consolidates duplicate API calls from learners/data/api.js and posts/data/api.js
 */

import { ensureConfig, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

ensureConfig([
  'LMS_BASE_URL',
], 'Moderation API service');

/**
 * Bans a user from discussions in a course or organization (standalone - no deletion)
 * @param {string} courseId Course ID
 * @param {string} username Username of the user to ban
 * @param {string} banScope 'course' or 'organization'
 * @param {string} reason Optional reason for banning
 * @returns {Promise<{ban_id: number, user_id: number, username: string, scope: string}>}
 */
export const banUser = async (courseId, username, banScope, reason = '') => {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/ban-user/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    course_id: courseId,
    scope: banScope,
    reason,
  });
  return data;
};

/**
 * Unban a user from discussions.
 * @param {string} courseId
 * @param {string} username Username of the user to unban
 * @param {string} banScope Scope of the ban ('course' or 'organization')
 * @param {string} reason Optional reason for unbanning
 * @returns {Promise<{ban_id: number, user_id: number, username: string, scope: string}>}
 */
export const unbanUser = async (courseId, username, banScope, reason = '') => {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/unban-user/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    course_id: courseId,
    scope: banScope,
    reason,
  });
  return data;
};

/**
 * Deletes all posts/comments by a user in a course or organization
 * @param {string} courseId Course ID
 * @param {string} username Username of the user
 * @param {string} banScope 'course' or 'organization'
 * @param {boolean} shouldBanUser Whether to ban the user after deletion
 * @returns {Promise<{thread_count: number, comment_count: number}>}
 */
export const bulkDeleteUserPosts = async (courseId, username, banScope, shouldBanUser = false) => {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/bulk-delete-ban/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    course_id: courseId,
    ban_user: shouldBanUser,
    ban_scope: banScope,
    reason: shouldBanUser ? 'Content removed by moderator' : '',
  });
  return data;
};

/**
 * Undeletes all posts/comments by a user in a course or organization
 * @param {string} courseId Course ID
 * @param {string} username Username of the user
 * @param {string} banScope 'course' or 'organization'
 * @returns {Promise<{thread_count: number, comment_count: number}>}
 */
export const bulkUndeleteUserPosts = async (courseId, username, banScope) => {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/bulk-undelete/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    course_id: courseId,
    ban_scope: banScope,
  });
  return data;
};
