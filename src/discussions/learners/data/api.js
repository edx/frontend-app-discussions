import snakeCase from 'lodash/snakeCase';

import { ensureConfig, getConfig, snakeCaseObject } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

ensureConfig([
  'LMS_BASE_URL',
], 'Posts API service');

export const getCoursesApiUrl = () => `${getConfig().LMS_BASE_URL}/api/discussion/v1/courses/`;
export const getUserProfileApiUrl = () => `${getConfig().LMS_BASE_URL}/api/user/v1/accounts`;
export const learnerPostsApiUrl = (courseId) => `${getCoursesApiUrl()}${courseId}/learner/`;
export const learnersApiUrl = (courseId) => `${getCoursesApiUrl()}${courseId}/activity_stats/`;
export const deletedContentApiUrl = (courseId) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/deleted_content/${courseId}`;
export const deletePostsApiUrl = (courseId, username, courseOrOrg, execute) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/bulk_delete_user_posts/${courseId}?username=${username}&course_or_org=${courseOrOrg}&execute=${execute}`;
export const restorePostsApiUrl = (courseId, username, courseOrOrg, execute) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/bulk_restore_user_posts/${courseId}?username=${username}&course_or_org=${courseOrOrg}&execute=${execute}`;
export const bannedUsersApiUrl = (courseId) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/banned-users/${courseId}`;
export const forumMutedUsersApiUrl = (courseId) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-muted-users/${courseId}/`;
export const forumMuteUserApiUrl = (courseId) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-mute/${courseId}/`;
export const forumUnmuteUserApiUrl = (courseId) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/forum-unmute/${courseId}/`;
export const mutedUsersListApiUrl = (courseId) => `${getConfig().LMS_BASE_URL}/api/discussion/v1/moderation/muted/${courseId}/`;

/**
 * Fetches all the learners in the given course.
 * @param {string} courseId
 * @param {object} params {page, order_by}
 * @returns {Promise<{}>}
 */
export async function getLearners(courseId, params) {
  const { data } = await getAuthenticatedHttpClient().get(learnersApiUrl(courseId), { params });
  return data;
}

/**
 * Get user profile
 * @param {string} usernames
 */
export async function getUserProfiles(usernames) {
  const url = `${getUserProfileApiUrl()}?username=${usernames.join()}`;
  const { data } = await getAuthenticatedHttpClient().get(url);
  return data;
}

/**
 * Get the posts by a specific user in a course's discussions
 *
 * @param {string} courseId Course ID of the course
 * @param {string} author
 * @param {number} page
 * @param {number} pageSize
 * @param {string} textSearch A search string to match.
 * @param {ThreadOrdering} orderBy The results wil be sorted on this basis.
 * @param {boolean} following If true, only threads followed by the current user will be returned.
 * @param {boolean} flagged If true, only threads that have been reported will be returned.
 * @param {string} threadType Can be 'discussion' or 'question'.
 * @param {ThreadViewStatus} view Set to "unread" on "unanswered" to filter to only those statuses.
 * @param {boolean} countFlagged If true, abuseFlaggedCount will be available.
 * @param {number} cohort
 * @param {boolean} showDeleted If true, only deleted posts will be returned.
 * @returns API Response object in the format
 *  {
 *    results: [array of posts],
 *    pagination: {count, num_pages, next, previous}
 *  }
 */
export async function getUserPosts(courseId, {
  page,
  pageSize,
  textSearch,
  orderBy,
  status,
  author,
  threadType,
  countFlagged,
  cohort,
  // showDeleted,
  includeMuted,
} = {}) {
  const params = snakeCaseObject({
    page,
    pageSize,
    textSearch,
    threadType,
    orderBy: orderBy && snakeCase(orderBy),
    status,
    requestedFields: 'profile_image',
    username: author,
    countFlagged,
    groupId: cohort,
    // showDeleted,
    includeMuted,
  });

  const { data } = await getAuthenticatedHttpClient()
    .get(learnerPostsApiUrl(courseId), { params });
  return data;
}

/**
 * Get banned users for a course
 * @param {string} courseId Course ID of the course
 * @returns API Response object with array of banned users
 */
export async function getBannedUsers(courseId) {
  const { data } = await getAuthenticatedHttpClient().get(bannedUsersApiUrl(courseId));
  return data;
}

/**
 * Deletes posts by a specific user in a course or organization
 * @param {string} courseId Course ID of the course
 * @param {string} username Username of the user whose posts are to be deleted
 * @param {string} courseOrOrg Can be 'course' or 'org' to specify deletion scope
 * @param {boolean} execute If true, deletes posts; if false, returns count of threads and comments
 * @returns API Response object in the format
 *  {
 *    thread_count: number,
 *    comment_count: number
 *  }
 */
export async function deleteUserPostsApi(courseId, username, courseOrOrg, execute) {
  const { data } = await getAuthenticatedHttpClient().post(
    deletePostsApiUrl(courseId, username, courseOrOrg, execute),
    null,
  );
  return data;
}

/**
 * Restores deleted posts by a specific user in a course or organization
 * @param {string} courseId Course ID of the course
 * @param {string} username Username of the user whose posts are to be restored
 * @param {string} courseOrOrg Can be 'course' or 'org' to specify restoration scope
 * @param {boolean} execute If true, restores posts; if false, returns count of threads and comments
 * @returns API Response object in the format
 *  {
 *    thread_count: number,
 *    comment_count: number
 *  }
 */
export async function restoreUserPostsApi(courseId, username, courseOrOrg, execute) {
  const { data } = await getAuthenticatedHttpClient().post(
    restorePostsApiUrl(courseId, username, courseOrOrg, execute),
    null,
  );
  return data;
}

/**
 * Get deleted content for a course
 *
 * @param {string} courseId Course ID of the course
 * @param {string} author Optional - filter by author username
 * @param {number} page Page number for pagination
 * @param {number} pageSize Number of items per page
 * @param {string} contentType Optional - filter by 'thread' or 'comment'
 * @returns API Response object in the format
 *  {
 *    results: [array of deleted posts],
 *    pagination: {count, num_pages, next, previous}
 *  }
 */
export async function getDeletedContent(courseId, {
  author,
  page,
  pageSize,
  contentType,
} = {}) {
  const params = snakeCaseObject({
    authorId: author, // The backend expects author_id
    page,
    perPage: pageSize,
    contentType,
  });

  const { data } = await getAuthenticatedHttpClient()
    .get(deletedContentApiUrl(courseId), { params });
  return data;
}
/**
 * @param {string} courseId Course ID of the course
 * @returns API Response object in the format
 *  {
 *    results: [{
 *      username: string,
 *      is_course_wide: boolean,
 *      muted_by: string
 *    }]
 *  }
 */
export async function getForumMutedUsers(courseId) {
  try {
    const url = forumMutedUsersApiUrl(courseId);
    const { data } = await getAuthenticatedHttpClient().get(url);
    return data;
  } catch (error) {
    // Return empty results instead of throwing to allow fallback to config data
    return { results: [] };
  }
}

/**
 * Mute a user with proper scope handling
 * @param {string} courseId Course ID
 * @param {string} username Username to mute
 * @param {boolean} isCourseWide Whether this is a course-wide mute (staff only)
 * @param {string} reason Optional reason for muting
 * @returns Promise<Object> API response
 */
export async function muteUser(courseId, username, isCourseWide = false, reason = '') {
  const url = forumMuteUserApiUrl(courseId);
  const payload = {
    username,
    is_course_wide: isCourseWide,
    reason,
  };

  const { data } = await getAuthenticatedHttpClient().post(url, payload);
  return data;
}

/**
 * Unmute a user with proper scope handling
 * @param {string} courseId Course ID
 * @param {string} username Username to unmute
 * @param {boolean} isCourseWide Whether this is a course-wide unmute
 * @returns Promise<Object> API response
 */
export async function unmuteUser(courseId, username, isCourseWide = false) {
  const url = forumUnmuteUserApiUrl(courseId);
  const payload = {
    username,
    is_course_wide: isCourseWide,
  };

  const { data } = await getAuthenticatedHttpClient().post(url, payload);
  return data;
}

/**
 * Get posts from muted users with proper scope-based filtering
 * @param {string} courseId Course ID of the course
 * @param {Array<Object>} mutedUsers List of muted user objects with scope information
 * @param {string} filterScope Filter posts by mute scope ('course', 'personal', 'all')
 * @param {object} options Options for fetching posts
 * @returns API Response object in the format
 *  {
 *    results: [array of posts with mute scope info],
 *    pagination: {count, num_pages, next, previous}
 *  }
 */
export async function getMutedUsersPosts(courseId, mutedUsers, filterScope = 'all', options = {}) {
  if (!mutedUsers || mutedUsers.length === 0) {
    return { results: [], pagination: { count: 0, num_pages: 0 } };
  }

  // Filter users by scope if specified
  let filteredUsers = mutedUsers;
  if (filterScope !== 'all') {
    filteredUsers = mutedUsers.filter(user => {
      if (typeof user === 'string') {
        // If it's just a username, assume personal scope for backwards compatibility
        return filterScope === 'personal';
      }
      // Check the scope property
      const userScope = user.scope || (user.is_course_wide ? 'course' : 'personal');
      return userScope === filterScope;
    });
  }

  // Extract usernames and remove duplicates
  const usernames = [...new Set(filteredUsers.map(user => (typeof user === 'string' ? user : user.username || user.muted_user?.username)))].filter(username => username && username.trim());

  if (usernames.length === 0) {
    return { results: [], pagination: { count: 0, num_pages: 0 } };
  }

  // Fetch posts for all muted users
  const allPosts = [];

  // Process users one by one to avoid overwhelming the API and better handle individual failures
  for (const username of usernames) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const userPosts = await getUserPosts(courseId, {
        ...options,
        author: username.trim(),
        page: 1,
        pageSize: 50, // Increased limit for better coverage
      });

      if (userPosts && userPosts.results && userPosts.results.length > 0) {
        // Find the mute info for this user
        const muteInfo = filteredUsers.find(user => {
          const userUsername = typeof user === 'string' ? user : user.username || user.muted_user?.username;
          return userUsername === username;
        });

        // Add mute information to each post
        const postsWithMuteInfo = userPosts.results.map(post => ({
          ...post,
          mutedUsername: username,
          muteScope: muteInfo ? (muteInfo.scope || (muteInfo.is_course_wide ? 'course' : 'personal')) : 'unknown',
          mutedBy: muteInfo ? (muteInfo.muted_by?.username || muteInfo.muted_by) : 'unknown',
        }));
        allPosts.push(...postsWithMuteInfo);
      }
    } catch (error) {
      // Handle various error types that can occur – silently skip failed users
    }
  }

  // Sort by creation date (newest first)
  allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    results: allPosts,
    pagination: {
      count: allPosts.length,
      num_pages: 1,
      next: null,
      previous: null,
    },
  };
}

/**
 * Mute a user with proper scope handling
 * @param {string} courseId Course ID
/**
 * Get posts from muted users separated by scope with proper filtering based on current user permissions
 * @param {string} courseId Course ID of the course
 * @param {object} options Options for fetching posts
 * @param {object} currentUser Current user information (username, isStaff)
 * @returns Promise<{courseWidePosts: Array, personalPosts: Array}>
 */
export async function getMutedPostsByScope(courseId, options = {}, currentUser = {}) {
  try {
    // Get muted users from forum API
    const forumUsers = await getForumMutedUsers(courseId);
    const allMutedUsers = (forumUsers.results || []).map(user => ({
      username: user.username,
      scope: user.is_course_wide ? 'course' : 'personal',
      muted_by: user.muted_by,
      is_course_wide: user.is_course_wide,
      source: 'forum',
    })).filter(user => user.username);

    // Filter muted users based on current user's permissions and scope
    const courseWideMutedUsers = allMutedUsers.filter(user => user.is_course_wide);

    // For personal mutes, only show posts that the CURRENT user muted
    // This ensures that personal mutes only hide posts for the person who did the muting
    const personalMutedUsers = allMutedUsers.filter(
      user => !user.is_course_wide && user.muted_by === currentUser.username,
    );

    // Fetch posts by scope
    const [courseWidePosts, personalPosts] = await Promise.all([
      getMutedUsersPosts(courseId, courseWideMutedUsers, 'course', options),
      getMutedUsersPosts(courseId, personalMutedUsers, 'personal', options),
    ]);

    return {
      courseWidePosts: courseWidePosts.results || [],
      personalPosts: personalPosts.results || [],
      allMutedUsers: {
        courseWide: courseWideMutedUsers,
        personal: personalMutedUsers,
        total: allMutedUsers,
      },
    };
  } catch (error) {
    return {
      courseWidePosts: [],
      personalPosts: [],
      allMutedUsers: {
        courseWide: [],
        personal: [],
        total: [],
      },
    };
  }
}
