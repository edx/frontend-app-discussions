import { camelCaseObject } from '@edx/frontend-platform';
import { logError } from '@edx/frontend-platform/logging';

import {
  DiscussionProvider, LearnersOrdering,
  PostsStatusFilter,
} from '../../data/constants';
import { setSortedBy } from '../learners/data';
import {
  fetchMutedUsersFailed,
  fetchMutedUsersRequest,
  fetchMutedUsersSuccess,
} from '../learners/data/slices';
import { setStatusFilter } from '../posts/data';
import { fetchThreads } from '../posts/data/thunks';
import { getHttpErrorStatus } from '../utils';
import {
  getDiscussionsConfig,
  getDiscussionsSettings,
  getMutedUsers,
  muteAndReportUser,
  muteUser,
  unmuteUser,
} from './api';
import {
  fetchConfigDenied,
  fetchConfigFailed,
  fetchConfigRequest,
  fetchConfigSuccess,
  muteUserFailed,
  muteUserRequest,
  muteUserSuccess,
  unmuteUserFailed,
  unmuteUserRequest,
} from './slices';

/**
 * Fetches the configuration data for the course
 * @param {string} courseId The course ID for the course to fetch config for.
 * @returns {(function(*): Promise<void>)|*}
 */
export default function fetchCourseConfig(courseId) {
  return async (dispatch) => {
    try {
      let learnerSort = LearnersOrdering.BY_LAST_ACTIVITY;
      const postsFilterStatus = PostsStatusFilter.ALL;
      dispatch(fetchConfigRequest());

      const config = await getDiscussionsConfig(courseId);
      if (config.has_moderation_privileges) {
        const settings = await getDiscussionsSettings(courseId);
        Object.assign(config, { settings });
      }

      if ((config.has_moderation_privileges || config.is_group_ta)) {
        learnerSort = LearnersOrdering.BY_FLAG;
      }

      dispatch(fetchConfigSuccess(camelCaseObject({
        ...config,
        courseId,
        enable_in_context: config.provider === DiscussionProvider.OPEN_EDX,
      })));
      dispatch(setSortedBy(learnerSort));
      dispatch(setStatusFilter(postsFilterStatus));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(fetchConfigDenied());
      } else {
        dispatch(fetchConfigFailed());
      }
      logError(error);
    }
  };
}

/**
 * Fetch list of muted users
 * @param {string} courseId
 * @returns {(function(*): Promise<void>)|*}
 */
export function fetchMutedUsersThunk(courseId) {
  return async (dispatch, getState) => {
    try {
      dispatch(fetchMutedUsersRequest());

      const state = getState();
      const currentUserId = state.config.userId;

      const response = await getMutedUsers(courseId, {
        muted_by: currentUserId,
        include_usernames: 'true',
      });

      dispatch(fetchMutedUsersSuccess({
        mutedUsers: response.muted_users || [],
        personalMutedUsers: (response.personal_muted_users || []).map(u => u.username).filter(Boolean),
        courseWideMutedUsers: (response.course_wide_muted_users || []).map(u => u.username).filter(Boolean),
      }));
    } catch (error) {
      dispatch(fetchMutedUsersFailed(error.message));
      logError(error);
    }
  };
}

/**
 * Mute a user in discussions
 * @param {string} username
 * @param {boolean} isCourseWide
 * @returns {(function(*): Promise<void>)|*}
 */
export function muteUserThunk(username, isCourseWide = false) {
  return async (dispatch, getState) => {
    const { courseId } = getState().config;
    try {
      dispatch(muteUserRequest());
      await muteUser(courseId, username, isCourseWide);
      dispatch(fetchMutedUsersThunk(courseId));
      dispatch(fetchThreads(courseId, {
        orderBy: 'last_activity_at',
        page: 1,
        pageSize: 20,
      }));
    } catch (error) {
      dispatch(muteUserFailed(error.message));
      logError(error);
    }
  };
}

/**
 * Unmute a user in discussions
 * @param {string} username
 * @param {boolean} isCourseWide
 * @returns {(function(*): Promise<void>)|*}
 */
export function unmuteUserThunk(username, isCourseWide = false) {
  return async (dispatch, getState) => {
    const { courseId } = getState().config;
    try {
      dispatch(unmuteUserRequest());
      await unmuteUser(courseId, username, isCourseWide);
      dispatch(fetchMutedUsersThunk(courseId));
      dispatch(fetchThreads(courseId, {
        orderBy: 'last_activity_at',
        page: 1,
        pageSize: 20,
      }));
    } catch (error) {
      dispatch(unmuteUserFailed(error.message));
      logError(error);
    }
  };
}

/**
 * Mute and report a user in discussions
 * @param {string} username
 * @param {string} postId
 * @returns {(function(*): Promise<void>)|*}
 */
export function muteAndReportUserThunk(username, postId) {
  return async (dispatch, getState) => {
    const { courseId } = getState().config;
    try {
      dispatch(muteUserRequest());
      const response = await muteAndReportUser(courseId, username, postId);
      dispatch(muteUserSuccess({
        username,
        isCourseWide: false,
        mutedUsers: response.muted_users,
      }));

      dispatch(fetchMutedUsersThunk(courseId));
      dispatch(fetchThreads(courseId, {
        orderBy: 'last_activity_at',
        page: 1,
        pageSize: 20,
      }));
    } catch (error) {
      dispatch(muteUserFailed(error.message));
      logError(error);
    }
  };
}

/**
 * Fetch list of muted users
 * @param {string} courseId
 * @returns {(function(*): Promise<void>)|*}
 */
