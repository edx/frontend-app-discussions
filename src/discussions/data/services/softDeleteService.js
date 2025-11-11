/**
 * API service for soft delete operations on threads
 */
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

// Use the LMS API base URL from the platform configuration
const getDiscussionApiBaseUrl = () => `${getConfig().LMS_BASE_URL}/api/discussion/v1`;

/**
 * Soft delete a single thread by calling the DELETE endpoint
 * @param {string} threadId - The ID of the thread to soft delete
 * @returns {Promise} API response
 */
export async function softDeleteThread(threadId) {
  const url = `${getDiscussionApiBaseUrl()}/threads/${threadId}/`;
  return getAuthenticatedHttpClient().delete(url);
}

/**
 * Restore a soft deleted thread
 * @param {string} threadId - The ID of the thread to restore
 * @returns {Promise} API response
 */
export async function restoreThread(threadId) {
  const url = `${getDiscussionApiBaseUrl()}/threads/${threadId}/restore/`;
  return getAuthenticatedHttpClient().post(url, {});
}

/**
 * Bulk soft delete multiple threads
 * NOTE: Currently implemented as sequential deletes.
 * TODO: Implement true bulk endpoint for better performance
 * @param {string[]} threadIds - Array of thread IDs to soft delete
 * @returns {Promise} API response
 */
export async function bulkSoftDeleteThreads(threadIds) {
  const results = await Promise.allSettled(
    threadIds.map(threadId => softDeleteThread(threadId)),
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  };
}

/**
 * Bulk restore multiple soft deleted threads
 * NOTE: Currently implemented as sequential restores.
 * TODO: Implement true bulk endpoint for better performance
 * @param {string[]} threadIds - Array of thread IDs to restore
 * @returns {Promise} API response
 */
export async function bulkRestoreThreads(threadIds) {
  const results = await Promise.allSettled(
    threadIds.map(threadId => restoreThread(threadId)),
  );

  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  };
}

/**
 * Get soft deleted threads for a course using the learner API
 * @param {string} courseId - The course ID
 * @param {Object} options - Additional query options
 * @param {string} options.userId - Optional user ID to filter by author
 * @param {string} options.username - Username to filter by (required)
 * @param {number} options.page - Page number for pagination
 * @param {number} options.pageSize - Number of threads per page
 * @param {string} options.sortKey - Sort key for ordering results (last_activity_at, comment_count, vote_count)
 * @returns {Promise} API response
 */
export async function getDeletedThreads(courseId, options = {}) {
  const url = `${getDiscussionApiBaseUrl()}/courses/${courseId}/learner/`;

  const params = {
    username: options.username,
    page: options.page || 1,
    page_size: options.pageSize || 20,
    show_deleted: true, // This is the key parameter to get deleted threads
    ...options.sortKey && { order_by: options.sortKey },
  };

  return getAuthenticatedHttpClient().get(url, { params });
}

/**
 * Search threads with optional deleted filter
 * @param {Object} searchParams - Search parameters including courseId
 * @returns {Promise} API response
 */
export async function searchThreadsWithDeletedFilter(searchParams) {
  const url = `${getDiscussionApiBaseUrl()}/threads/`;

  const params = {
    ...searchParams,
  };

  return getAuthenticatedHttpClient().get(url, { params });
}

/**
 * Soft delete a single comment by calling the DELETE endpoint
 * @param {string} commentId - The ID of the comment to soft delete
 * @returns {Promise} API response
 */
export async function softDeleteComment(commentId) {
  const url = `${getDiscussionApiBaseUrl()}/comments/${commentId}/`;
  return getAuthenticatedHttpClient().delete(url);
}

/**
 * Restore a soft deleted comment
 * @param {string} commentId - The ID of the comment to restore
 * @returns {Promise} API response
 */
export async function restoreComment(commentId) {
  const url = `${getDiscussionApiBaseUrl()}/comments/${commentId}/restore/`;
  return getAuthenticatedHttpClient().post(url, {});
}
