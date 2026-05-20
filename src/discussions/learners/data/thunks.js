import { camelCaseObject, snakeCaseObject } from '@edx/frontend-platform';
import { logError } from '@edx/frontend-platform/logging';

import {
  banUser as banUserApi,
  bulkDeleteUserPosts as bulkDeleteUserActivity,
  bulkUndeleteUserPosts as bulkUndeleteUserActivity,
  unbanUser as unbanUserApi,
} from '../../../data/api/moderation';
import {
  PostsStatusFilter, ThreadType,
} from '../../../data/constants';
import { updateAuthorBanStatus as updateCommentAuthorBanStatus } from '../../post-comments/data/slices';
import {
  fetchLearnerThreadsRequest,
  fetchThreadsDenied,
  fetchThreadsFailed,
  fetchThreadsSuccess,
  updateAuthorBanStatus as updateThreadAuthorBanStatus,
} from '../../posts/data/slices';
import { normaliseThreads } from '../../posts/data/thunks';
import { getHttpErrorStatus } from '../../utils';
import {
  deleteUserPostsApi,
  getBannedUsers,
  getForumMutedUsers,
  getLearners,
  getMutedPostsByScope,
  getUserProfiles,
  muteUser,
  unmuteUser,
} from './api';
import {
  banUserFailed,
  banUserRequest,
  banUserSuccess,
  deleteUserActivityFailed,
  deleteUserActivityRequest,
  deleteUserActivitySuccess,
  deleteUserPostsFailed,
  deleteUserPostsRequest,
  deleteUserPostsSuccess,
  fetchBannedUsersFailed,
  fetchBannedUsersRequest,
  fetchBannedUsersSuccess,
  fetchLearnersDenied,
  fetchLearnersFailed,
  fetchLearnersRequest,
  fetchLearnersSuccess,
  fetchMutedUsersFailed,
  fetchMutedUsersRequest,
  fetchMutedUsersSuccess,
  unbanUserFailed,
  unbanUserRequest,
  unbanUserSuccess,
  undeleteUserActivityFailed,
  undeleteUserActivityRequest,
  undeleteUserActivitySuccess,
  undeleteUserPostsFailed,
  undeleteUserPostsRequest,
  undeleteUserPostsSuccess,
} from './slices';

export function fetchUserPosts(courseId, {
  orderBy,
  filters = {},
  page = 1,
  author = null,
  countFlagged,
  includeMuted,
} = {}) {
  const options = {
    orderBy,
    page,
    author,
    countFlagged,
    includeMuted,
  };

  if (filters.status === PostsStatusFilter.UNREAD) {
    options.status = 'unread';
  }
  if (filters.status === PostsStatusFilter.UNANSWERED) {
    options.status = 'unanswered';
  }
  if (filters.status === PostsStatusFilter.REPORTED) {
    options.status = 'flagged';
  }
  if (filters.status === PostsStatusFilter.UNRESPONDED) {
    options.status = 'unresponded';
  }
  if (filters.postType !== ThreadType.ALL) {
    options.threadType = filters.postType;
  }
  if (filters.search) {
    options.textSearch = filters.search;
  }
  if (filters.cohort) {
    options.cohort = filters.cohort;
  }

  return async (dispatch) => {
    try {
      dispatch(fetchLearnerThreadsRequest({ courseId, author }));

      let data;

      // Use dedicated deleted content endpoint when viewing deleted posts
      if (filters.contentStatus === PostsStatusFilter.DELETED) {
        const { getDeletedContent } = await import('./api');
        data = await getDeletedContent(courseId, {
          author,
          page,
          pageSize: 10,
        });
      } else {
        // Use regular learner posts endpoint for active content
        const { getUserPosts } = await import('./api');

        // Only show active content (not deleted)
        if (filters.contentStatus === PostsStatusFilter.ACTIVE) {
          options.showDeleted = false;
        }

        // Secondary status filters (independent)
        if (filters.status === PostsStatusFilter.UNREAD) {
          options.status = 'unread';
        }
        if (filters.status === PostsStatusFilter.UNANSWERED) {
          options.status = 'unanswered';
        }
        if (filters.status === PostsStatusFilter.REPORTED) {
          options.status = 'flagged';
        }
        if (filters.status === PostsStatusFilter.UNRESPONDED) {
          options.status = 'unresponded';
        }

        if (filters.postType !== ThreadType.ALL) {
          options.threadType = filters.postType;
        }
        if (filters.search) {
          options.textSearch = filters.search;
        }
        if (filters.cohort) {
          options.cohort = filters.cohort;
        }

        data = await getUserPosts(courseId, options);
      }

      const normalisedData = normaliseThreads(camelCaseObject(data));

      dispatch(fetchThreadsSuccess({ ...normalisedData, page, author }));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(fetchThreadsDenied());
      } else {
        dispatch(fetchThreadsFailed());
      }
      logError(error);
    }
  };
}

// export const deleteUserPosts = (
//   courseId,
//   username,
//   courseOrOrg,
//   execute,
// ) => async (dispatch) => {
//   try {
//     dispatch(deleteUserPostsRequest({ courseId, username }));
//     const response = await deleteUserPostsApi(
//       courseId,
//       username,
//       courseOrOrg,
//       execute,
//     );
//     dispatch(deleteUserPostsSuccess(camelCaseObject(response)));
//   } catch (error) {
//     dispatch(deleteUserPostsFailed());
//     logError(error);
//   }
// };

/**
 * Fetches the learners for the course courseId.
 * @param {string} courseId The course ID for the course to fetch data for.
 * @param {string} orderBy
 * @param {number} page
 * @param {usernameSearch} username
 * @returns {(function(*): Promise<void>)|*}
 */
export function fetchLearners(courseId, {
  orderBy,
  page = 1,
  usernameSearch = null,
} = {}) {
  return async (dispatch, getState) => {
    try {
      const params = snakeCaseObject({ orderBy, page });
      if (usernameSearch) {
        params.username = usernameSearch;
      }

      dispatch(fetchLearnersRequest({ courseId }));

      const learnerStats = await getLearners(courseId, params);
      const learnerProfilesData = await getUserProfiles(
        learnerStats.results.map(l => l.username),
      );

      const learnerProfiles = {};
      learnerProfilesData.forEach(profile => {
        learnerProfiles[profile.username] = camelCaseObject(profile);
      });

      // 🔍 Include muted users in username search
      if (usernameSearch && page === 1) {
        try {
          const state = getState();
          const personalMutedUsers = state.learners.mutedUsers.personal || [];
          const courseWideMutedUsers = state.learners.mutedUsers.course || [];

          const allMutedUsers = [...personalMutedUsers, ...courseWideMutedUsers];

          // ✅ FIX: muted users should now be strings (usernames) after processing in fetchMutedUsersThunk
          const matchingMutedUsers = allMutedUsers
            .filter(username => username.toLowerCase().includes(usernameSearch.toLowerCase()));

          const existingUsernames = new Set(
            learnerStats.results.map(l => l.username),
          );

          const additionalMutedLearners = [];

          for (const username of matchingMutedUsers) {
            if (!existingUsernames.has(username)) {
              additionalMutedLearners.push({
                username,
                abuseFlagged: 0,
                replies: 0,
                threads: 0,
                lastActivityAt: '',
                isMuted: true,
              });

              if (!learnerProfiles[username]) {
                try {
                  // eslint-disable-next-line no-await-in-loop
                  const mutedProfile = await getUserProfiles([username]);
                  if (mutedProfile?.length) {
                    learnerProfiles[username] = camelCaseObject(mutedProfile[0]);
                  }
                } catch {
                  learnerProfiles[username] = { username };
                }
              }
            }
          }

          learnerStats.results = [
            ...learnerStats.results,
            ...additionalMutedLearners,
          ];
          learnerStats.count += additionalMutedLearners.length;
        } catch (e) {
          // Silently handle error
        }
      }

      dispatch(fetchLearnersSuccess({
        ...camelCaseObject(learnerStats),
        learnerProfiles,
        page,
      }));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(fetchLearnersDenied());
      } else {
        dispatch(fetchLearnersFailed());
      }
      logError(error);
    }
  };
}

export function undeleteUserPosts(courseId, username, courseOrOrg, execute) {
  return async (dispatch) => {
    try {
      const { restoreUserPostsApi } = await import('./api');
      dispatch(undeleteUserPostsRequest({ courseId, username }));
      const response = await restoreUserPostsApi(courseId, username, courseOrOrg, execute);
      dispatch(undeleteUserPostsSuccess(camelCaseObject(response)));
    } catch (error) {
      dispatch(undeleteUserPostsFailed());
      logError(error);
    }
  };
}

/**
 * Fetches the list of banned users for the course
 * @param {string} courseId The course ID for the course to fetch data for.
 * @returns {(function(*): Promise<void>)|*}
 */
export function fetchBannedUsers(courseId) {
  return async (dispatch) => {
    try {
      dispatch(fetchBannedUsersRequest({ courseId }));
      const response = await getBannedUsers(courseId);
      // API returns { count, results } structure
      // camelCaseObject will convert the whole response including the array items
      const camelCasedResponse = camelCaseObject(response);
      const bannedUsers = (camelCasedResponse.results || []).map(ban => ({
        ...ban,
        // Flatten the nested user object to top level for component compatibility
        username: ban.user?.username,
        email: ban.user?.email,
        userId: ban.user?.id,
        // Flatten the bannedBy object for component compatibility
        bannedByUsername: ban.bannedBy?.username,
      }));
      dispatch(fetchBannedUsersSuccess(bannedUsers));
    } catch (error) {
      dispatch(fetchBannedUsersFailed());
      logError(error);
    }
  };
}
/*
 * Fetch the posts of a user for the specified course and update the
 * redux state
 *
 * @param {string} courseId Course ID of the course eg., course-v1:X+Y+Z
 * @param {string} username name of the learner
 * @param page
 * @returns a promise that will update the state with the learner's posts
 */
// export function fetchUserPosts(courseId, {
//   orderBy,
//   filters = {},
//   page = 1,
//   author = null,
//   countFlagged,
//   includeMuted,
// } = {}) {
//   const options = {
//     orderBy,
//     page,
//     author,
//     countFlagged,
//     includeMuted,
//   };

//   if (filters.status === PostsStatusFilter.UNREAD) {
//     options.status = 'unread';
//   }
//   if (filters.status === PostsStatusFilter.UNANSWERED) {
//     options.status = 'unanswered';
//   }
//   if (filters.status === PostsStatusFilter.REPORTED) {
//     options.status = 'flagged';
//   }
//   if (filters.status === PostsStatusFilter.UNRESPONDED) {
//     options.status = 'unresponded';
//   }
//   if (filters.postType !== ThreadType.ALL) {
//     options.threadType = filters.postType;
//   }
//   if (filters.search) {
//     options.textSearch = filters.search;
//   }
//   if (filters.cohort) {
//     options.cohort = filters.cohort;
//   }

//   return async (dispatch) => {
//     try {
//       dispatch(fetchLearnerThreadsRequest({ courseId, author }));

//       const data = await getUserPosts(courseId, options);
//       const normalisedData = normaliseThreads(camelCaseObject(data));

//       dispatch(fetchThreadsSuccess({ ...normalisedData, page, author }));
//     } catch (error) {
//       if (getHttpErrorStatus(error) === 403) {
//         dispatch(fetchThreadsDenied());
//       } else {
//         dispatch(fetchThreadsFailed());
//       }
//       logError(error);
//     }
//   };
// }

export const deleteUserPosts = (
  courseId,
  username,
  courseOrOrg,
  execute,
) => async (dispatch) => {
  try {
    dispatch(deleteUserPostsRequest({ courseId, username }));
    const response = await deleteUserPostsApi(
      courseId,
      username,
      courseOrOrg,
      execute,
    );
    dispatch(deleteUserPostsSuccess(camelCaseObject(response)));
  } catch (error) {
    dispatch(deleteUserPostsFailed());
    logError(error);
  }
};

/**
 * Fetch muted posts (unchanged – correct)
 */
export function fetchMutedPosts(courseId) {
  return async () => {
    try {
      await getMutedPostsByScope(courseId, 'personal');
      await getMutedPostsByScope(courseId, 'course');
      // Data fetched successfully - could dispatch to store if needed
    } catch (error) {
      logError(error);
    }
  };
}

/**
 * Fetch muted USERS (personal + course-wide)
 */

export function fetchMutedUsersThunk(courseId) {
  return async (dispatch, getState) => {
    try {
      dispatch(fetchMutedUsersRequest());

      const response = await getForumMutedUsers(courseId);
      const state = getState();

      const currentUserId = String(state.config.userId);
      const isStaff = state.config.userIsStaff;
      const { hasModerationPrivileges } = state.config;
      const isStaffOrModerator = isStaff || hasModerationPrivileges;

      const mutedUsers = response.results || response.muted_users || [];
      const activeMutedUsers = mutedUsers.filter(
        u => u.is_active,
      );

      // Staff/moderators can see ALL muted users so they can unmute any user
      // Non-staff only see their own personal mutes
      const personalMutedUsers = activeMutedUsers.filter(
        u => u.scope === 'personal'
          && String(u.muted_by_id) === currentUserId,
      );

      // For staff: show ALL course-wide mutes (not just ones they created)
      // For non-staff: show none (they can't unmute course-wide mutes)
      const courseWideMutedUsers = isStaffOrModerator
        ? activeMutedUsers.filter(u => u.scope === 'course')
        : [];

      // Combine and send as array for the slice to process
      const allMutedUsers = [...personalMutedUsers, ...courseWideMutedUsers];

      dispatch(fetchMutedUsersSuccess({
        mutedUsers: allMutedUsers,
      }));
    } catch (error) {
      dispatch(fetchMutedUsersFailed(error));
      logError(error);
    }
  };
}

/**
 * Bans a user from discussions in a course or organization
 * @param {string} courseId Course ID
 * @param {string} username Username of the user to ban
 * @param {string} scope 'course' or 'organization'
 * @returns {(function(*): Promise<void>)|*}
 */
export function banUser(courseId, username, scope) {
  return async (dispatch) => {
    try {
      dispatch(banUserRequest());
      await banUserApi(courseId, username, scope);
      dispatch(banUserSuccess());
      dispatch(updateThreadAuthorBanStatus({ author: username, isBanned: true, banScope: scope }));
      dispatch(updateCommentAuthorBanStatus({ author: username, isBanned: true, banScope: scope }));
      dispatch(fetchBannedUsers(courseId));
    } catch (error) {
      dispatch(banUserFailed());
      logError(error);
    }
  };
}

/**
 * Mutes a user in discussions for a course
 * @param {string} courseId Course ID
 * @param {string} username Username of the user to mute
 * @param {boolean} isCourseWide Whether to apply the mute course-wide (true) or just for the current user (false)
 * @param {string} reason Optional reason for muting the user
 * @returns {(function(*): Promise<void>)|*}
 */
export function muteUserThunk(courseId, username, isCourseWide = false, reason = '') {
  return async (dispatch) => {
    try {
      const result = await muteUser(courseId, username, isCourseWide, reason);
      dispatch(fetchMutedUsersThunk(courseId));
      return result;
    } catch (error) {
      logError(error);
      throw error;
    }
  };
}

/**
 * Unbans a user from discussions
 * @param {string} courseId Course ID
 * @param {string} username Username of the user to unban
 * @param {string} scope 'course' or 'organization'
 * @returns {(function(*): Promise<void>)|*}
 */
export function unbanUser(courseId, username, scope) {
  return async (dispatch) => {
    try {
      dispatch(unbanUserRequest());
      await unbanUserApi(courseId, username, scope);
      dispatch(unbanUserSuccess());
      dispatch(updateThreadAuthorBanStatus({ author: username, isBanned: false, banScope: null }));
      dispatch(updateCommentAuthorBanStatus({ author: username, isBanned: false, banScope: null }));
      dispatch(fetchBannedUsers(courseId));
    } catch (error) {
      dispatch(unbanUserFailed());
      logError(error);
    }
  };
}

/**
 * Deletes all discussion activity for a user in a course or organization
 * @param {string} courseId Course ID
 * @param {string} username Username of the user
 * @param {string} scope 'course' or 'organization'
 * @param {boolean} shouldBanUser Whether to also ban the user
 * @returns {(function(*): Promise<void>)|*}
 */
export function deleteUserActivity(courseId, username, scope, shouldBanUser = false) {
  return async (dispatch) => {
    try {
      dispatch(deleteUserActivityRequest());
      const response = await bulkDeleteUserActivity(courseId, username, scope, shouldBanUser);
      dispatch(deleteUserActivitySuccess(camelCaseObject(response)));
      // Refresh banned users list if user was banned
      if (shouldBanUser) {
        dispatch(fetchBannedUsers(courseId));
      }
    } catch (error) {
      dispatch(deleteUserActivityFailed());
      logError(error);
    }
  };
}

/**
 * Undeletes all discussion activity for a user in a course or organization
 * @param {string} courseId Course ID
 * @param {string} username Username of the user
 * @param {string} scope 'course' or 'organization'
 * @returns {(function(*): Promise<void>)|*}
 */
export function undeleteUserActivity(courseId, username, scope) {
  return async (dispatch) => {
    try {
      dispatch(undeleteUserActivityRequest());
      const response = await bulkUndeleteUserActivity(courseId, username, scope);
      dispatch(undeleteUserActivitySuccess(camelCaseObject(response)));
    } catch (error) {
      dispatch(undeleteUserActivityFailed());
      logError(error);
    }
  };
}

/**
 * Unmutes a user in discussions for a course
 * @param {string} courseId Course ID
 * @param {string} username Username of the user to unmute
 * @param {boolean} isCourseWide Whether to remove a course-wide mute (true) or just a personal mute (false)
 * @returns {(function(*): Promise<void>)|*}
 */
export function unmuteUserThunk(courseId, username, isCourseWide = false) {
  return async (dispatch) => {
    try {
      const result = await unmuteUser(courseId, username, isCourseWide);
      dispatch(fetchMutedUsersThunk(courseId));
      return result;
    } catch (error) {
      logError(error);
      throw error;
    }
  };
}
