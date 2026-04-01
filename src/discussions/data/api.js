import { ensureConfig, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

ensureConfig([
  'LMS_BASE_URL',
], 'Posts API service');

export const getCourseConfigApiUrl = () => `${getConfig().LMS_BASE_URL}/api/discussion/v2/courses/`;
export const getCourseSettingsApiUrl = () => `${getConfig().LMS_BASE_URL}/api/discussion/v1/courses/`;
export const getDiscussionsConfigUrl = (courseId) => `${getCourseConfigApiUrl()}${courseId}/`;
export const getDiscussionsSettingsUrl = (courseId) => `${getCourseSettingsApiUrl()}${courseId}/settings`;
/**
 * Get discussions course config
 * @param {string} courseId
 */
export async function getDiscussionsConfig(courseId) {
  const { data } = await getAuthenticatedHttpClient().get(getDiscussionsConfigUrl(courseId));
  return data;
}

/**
 * Get discussions course config
 * @param {string} courseId
 */
export async function getDiscussionsSettings(courseId) {
  const url = `${getDiscussionsSettingsUrl(courseId)}`;
  const { data } = await getAuthenticatedHttpClient().get(url);
  return data;
}

/**
 * Mute a user in discussions
 * @param {string} courseId
 * @param {string} username
 * @param {boolean} isCourseWide
 * @returns {Promise<{}>}
 */
export async function muteUser(courseId, username, isCourseWide = false) {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-mute/${courseId}/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    is_course_wide: isCourseWide,
  });
  return data;
}

/**
 * Unmute a user in discussions
 * @param {string} courseId
 * @param {string} username
 * @param {boolean} isCourseWide
 * @returns {Promise<{}>}
 */
export async function unmuteUser(courseId, username, isCourseWide = false) {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-unmute/${courseId}/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    is_course_wide: isCourseWide,
  });
  return data;
}

/**
 * Mute and report a user in discussions
 * @param {string} courseId
 * @param {string} username
 * @param {string} postId
 * @returns {Promise<{}>}
 */
export async function muteAndReportUser(courseId, username, postId) {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-mute-and-report/${courseId}/`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    username,
    post_id: postId,
  });
  return data;
}

/**
 * Get list of muted users
 * @param {string} courseId
 * @param {Object} options - Query options
 * @param {string} options.scope - Filter by scope ('personal', 'course', 'all')
 * @param {string|number} options.muted_by - Filter by user ID who performed mute
 * @param {string} options.include_usernames - Include username resolution
 * @returns {Promise<{}>}
 */
export async function getMutedUsers(courseId, options = {}) {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-muted-users/${courseId}/`;

  // Build query parameters
  const params = new URLSearchParams();
  if (options.scope) {
    params.append('scope', options.scope);
  }
  if (options.muted_by) {
    params.append('muted_by', options.muted_by);
  }
  if (options.include_usernames) {
    params.append('include_usernames', options.include_usernames);
  }

  const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;
  const { data } = await getAuthenticatedHttpClient().get(finalUrl);
  return data;
}

/**
 * Check if a user is muted
 * @param {string} courseId
 * @param {string} username
 * @returns {Promise<{}>}
 */
export async function checkMuteStatus(courseId, userId) {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-mute-status/${courseId}/${userId}/`;
  const { data } = await getAuthenticatedHttpClient().get(url);
  return data;
}
