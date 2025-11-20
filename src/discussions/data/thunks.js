import { camelCaseObject } from '@edx/frontend-platform';
import { logError } from '@edx/frontend-platform/logging';

import {
  DiscussionProvider, LearnersOrdering,
  PostsStatusFilter,
} from '../../data/constants';
import { setSortedBy } from '../learners/data';
import { setStatusFilter } from '../posts/data';
import { getHttpErrorStatus } from '../utils';
import { getDiscussionsConfig, getDiscussionsSettings } from './api';
import {
  bulkActionFailed,
  bulkActionRequest, bulkActionSuccess, fetchConfigDenied, fetchConfigFailed, fetchConfigRequest, fetchConfigSuccess,
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

// Soft delete thunks
export function performBulkSoftDelete(threadIds) {
  return async (dispatch) => {
    try {
      dispatch(bulkActionRequest());
      const { bulkSoftDeleteThreads } = await import('../posts/data/api');
      await bulkSoftDeleteThreads(threadIds);
      dispatch(bulkActionSuccess());
      return { success: true };
    } catch (error) {
      dispatch(bulkActionFailed(error.message || 'Failed to delete threads'));
      logError(error);
      return { success: false, error: error.message };
    }
  };
}

export function performBulkRestore(threadIds, courseId) {
  return async (dispatch) => {
    try {
      dispatch(bulkActionRequest());
      const { bulkRestoreThreads } = await import('../posts/data/api');
      await bulkRestoreThreads(threadIds, courseId);
      dispatch(bulkActionSuccess());
      return { success: true };
    } catch (error) {
      dispatch(bulkActionFailed(error.message || 'Failed to restore threads'));
      logError(error);
      return { success: false, error: error.message };
    }
  };
}

export function performSoftDeleteThread(threadId) {
  return async () => {
    try {
      const { softDeleteThread } = await import('../posts/data/api');
      await softDeleteThread(threadId);
      return { success: true };
    } catch (error) {
      logError(error);
      return { success: false, error: error.message };
    }
  };
}

export function performRestoreThread(threadId, courseId) {
  return async () => {
    try {
      const { restoreThread } = await import('../posts/data/api');
      await restoreThread(threadId, courseId);
      return { success: true };
    } catch (error) {
      logError(error);
      return { success: false, error: error.message };
    }
  };
}
