import { camelCaseObject } from '@edx/frontend-platform';
import { logError } from '@edx/frontend-platform/logging';

import { selectEnableDiscussionBan } from '../../data/selectors';
import { setContentCreationRateLimited } from '../../data/slices';
import { updateThreadAbuseFlaggedCount } from '../../posts/data/slices';
import { getHttpErrorStatus } from '../../utils';
import {
  deleteComment, getCommentResponses, getThreadComments, postComment, updateComment,
} from './api';
import {
  deleteCommentDenied,
  deleteCommentFailed,
  deleteCommentRequest,
  deleteCommentSuccess,
  fetchCommentResponsesDenied,
  fetchCommentResponsesFailed,
  fetchCommentResponsesRequest,
  fetchCommentResponsesSuccess,
  fetchCommentsDenied,
  fetchCommentsFailed,
  fetchCommentsRequest,
  fetchCommentsSuccess,
  postCommentDenied,
  postCommentFailed,
  postCommentRequest,
  postCommentSuccess,
  updateCommentDenied,
  updateCommentFailed,
  updateCommentRequest,
  updateCommentSuccess,
} from './slices';

/**
 * Normalises comment data by mapping comments to ids, and grouping them by their
 * parent thread and comment.
 * @param data
 * @returns {{commentsInComments: {}, pagination, commentsById: {}, commentsInThreads: {}}}
 */
function normaliseComments(data) {
  const { pagination, results } = data;
  const commentsInThreads = {};
  const commentsInComments = {};
  const commentsById = {};
  const ids = [];
  results.forEach(
    comment => {
      const { parentId, threadId, id } = comment;
      ids.push(id);
      if (parentId) {
        if (!commentsInComments[parentId]) {
          commentsInComments[parentId] = [];
        }
        if (!commentsInComments[parentId].includes(id)) {
          commentsInComments[parentId].push(id);
        }
      } else {
        if (!commentsInThreads[threadId]) {
          commentsInThreads[threadId] = [];
        }
        if (!commentsInThreads[threadId].includes(id)) {
          commentsInThreads[threadId].push(id);
        }
      }
      // Normalize editableFields to always be an array
      commentsById[id] = {
        ...comment,
        editableFields: comment.editableFields || [],
      };
    },
  );
  return {
    ids,
    commentsInThreads,
    commentsInComments,
    commentsById,
    pagination,
  };
}

export function fetchThreadComments(
  threadId,
  {
    page = 1,
    reverseOrder,
    threadType,
    enableInContextSidebar,
    showDeleted = false,
    signal,
    includeMuted,
  } = {},
) {
  return async (dispatch, getState) => {
    try {
      dispatch(fetchCommentsRequest());
      const enableDiscussionBan = selectEnableDiscussionBan(getState());
      const data = await getThreadComments(threadId, {
        page, reverseOrder, threadType, enableInContextSidebar, showDeleted, enableDiscussionBan, signal, includeMuted,
      });
      dispatch(fetchCommentsSuccess({
        ...normaliseComments(camelCaseObject(data)),
        page,
        threadId,
      }));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(fetchCommentsDenied());
      } else {
        dispatch(fetchCommentsFailed());
      }
      logError(error);
    }
  };
}

export function fetchCommentResponses(commentId, {
  page = 1, reverseOrder = true, showDeleted = false, includeMuted,
} = {}) {
  return async (dispatch, getState) => {
    try {
      dispatch(fetchCommentResponsesRequest({ commentId }));
      const enableDiscussionBan = selectEnableDiscussionBan(getState());
      const data = await getCommentResponses(commentId, {
        page, reverseOrder, showDeleted, enableDiscussionBan, includeMuted,
      });
      dispatch(fetchCommentResponsesSuccess({
        ...normaliseComments(camelCaseObject(data)),
        page,
        commentId,
      }));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(fetchCommentResponsesDenied());
      } else {
        dispatch(fetchCommentResponsesFailed());
      }
      logError(error);
    }
  };
}

export function editComment(commentId, comment) {
  return async (dispatch) => {
    try {
      dispatch(updateCommentRequest({ commentId }));
      const data = await updateComment(commentId, comment);
      const updatedComment = camelCaseObject(data);
      dispatch(updateCommentSuccess(updatedComment));
      // If the flagged state changed, update the parent thread's abuseFlaggedCount
      if (comment.flagged !== undefined) {
        const { threadId } = updatedComment;
        if (threadId) {
          const delta = comment.flagged ? 1 : -1;
          dispatch(updateThreadAbuseFlaggedCount({ threadId, delta }));
        }
      }
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(updateCommentDenied());
      } else {
        dispatch(updateCommentFailed());
      }
      logError(error);
    }
  };
}

export function addComment(comment, threadId, parentId = null, enableInContextSidebar = false, recaptchaToken = '') {
  return async (dispatch) => {
    try {
      dispatch(postCommentRequest({
        comment,
        threadId,
        parentId,
        recaptchaToken,
      }));
      const data = await postComment(comment, threadId, parentId, enableInContextSidebar, recaptchaToken);
      dispatch(postCommentSuccess(camelCaseObject(data)));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(postCommentDenied());
      } else if (getHttpErrorStatus(error) === 429) {
        dispatch(setContentCreationRateLimited());
      } else {
        dispatch(postCommentFailed());
      }
      logError(error);
    }
  };
}

export function removeComment(commentId, threadId) {
  return async (dispatch) => {
    try {
      dispatch(deleteCommentRequest({ commentId }));
      await deleteComment(commentId);
      dispatch(deleteCommentSuccess({
        commentId,
        threadId,
      }));
    } catch (error) {
      if (getHttpErrorStatus(error) === 403) {
        dispatch(deleteCommentDenied());
      } else {
        dispatch(deleteCommentFailed());
      }
      logError(error);
    }
  };
}

export function performRestoreComment(commentId, courseId) {
  return async (dispatch) => {
    try {
      const { restoreComment } = await import('./api');
      await restoreComment(commentId, courseId);
      // Fetch the updated comment state by calling editComment with empty object
      // This will refresh the comment data from the backend
      await dispatch(editComment(commentId, {}));
      return { success: true };
    } catch (error) {
      logError(error);
      return { success: false, error: error.message };
    }
  };
}
