import { ensureConfig, getConfig, snakeCaseObject } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import { ThreadType } from '../../../data/constants';

ensureConfig([
  'LMS_BASE_URL',
], 'Comments API service');

export const getCommentsApiUrl = () => `${getConfig().LMS_BASE_URL}/api/discussion/v1/comments/`;

/**
 * Builds the requested_fields parameter conditionally including ban fields.
 * @param {boolean} enableDiscussionBan - Whether to include ban-related fields
 * @returns {string} Comma-separated list of fields
 */
const buildRequestedFields = (enableDiscussionBan = false) => {
  const fields = ['profile_image'];
  if (enableDiscussionBan) {
    fields.push('is_author_banned', 'author_ban_scope');
  }
  return fields.join(',');
};

/**
 * Returns all the comments for the specified thread.
 * @param {string} threadId
 * @param {EndorsementStatus} endorsed
 * @param {number=} page
 * @param {number=} pageSize
 * @param reverseOrder
 * @param enableInContextSidebar
 * @returns {Promise<{}>}
 */
export const getThreadComments = async (threadId, {
  threadType,
  page,
  pageSize,
  reverseOrder,
  enableInContextSidebar = false,
  showDeleted = false,
  enableDiscussionBan = false,
  includeMuted = false,
  signal,
} = {}) => {
  const params = snakeCaseObject({
    threadId,
    page,
    pageSize,
    reverseOrder,
    requestedFields: buildRequestedFields(enableDiscussionBan),
    enableInContextSidebar,
    mergeQuestionTypeResponses: threadType === ThreadType.QUESTION ? true : null,
    showDeleted,
    includeMuted,
  });

  const { data } = await getAuthenticatedHttpClient().get(getCommentsApiUrl(), { params: { ...params, signal } });
  return data;
};

/**
 * Fetches a responses to a comment.
 * @param {string} commentId
 * @param {number=} page
 * @param {number=} pageSize
 * @returns {Promise<{}>}
 */
export const getCommentResponses = async (commentId, {
  page,
  pageSize,
  reverseOrder,
  showDeleted = false,
  enableDiscussionBan = false,
  includeMuted,
} = {}) => {
  const url = `${getCommentsApiUrl()}${commentId}/`;

  const params = snakeCaseObject({
    page,
    pageSize,
    requestedFields: buildRequestedFields(enableDiscussionBan),
    includeMuted,
    reverseOrder,
    showDeleted,
  });

  const { data } = await getAuthenticatedHttpClient().get(url, { params });
  return data;
};
/**
 * Posts a comment.
 * @param {string} comment Raw comment data to post.
 * @param {string} threadId Thread ID for thread in which to post comment.
 * @param {string=} parentId ID for a comments parent.
 * @param {boolean} enableInContextSidebar
 * @returns {Promise<{}>}
 */
export const postComment = async (
  comment,
  threadId,
  parentId,
  enableInContextSidebar,
  recaptchaToken,
) => {
  const { data } = await getAuthenticatedHttpClient()
    .post(getCommentsApiUrl(), snakeCaseObject({
      threadId, raw_body: comment, parentId, enableInContextSidebar, captchaToken: recaptchaToken,
    }));
  return data;
};

/**
 * Updates existing comment.
 * @param {string} commentId ID of comment to update.
 * @param {string=} comment Raw updated comment data to post.
 * @param {boolean=} voted
 * @param {boolean=} flagged
 * @param {boolean=} endorsed
 * @param {string=} editReasonCode The moderation reason code for editing.
 * @returns {Promise<{}>}
 */
export const updateComment = async (commentId, {
  comment,
  voted,
  flagged,
  endorsed,
  editReasonCode,
}) => {
  const url = `${getCommentsApiUrl()}${commentId}/`;
  const postData = snakeCaseObject({
    raw_body: comment,
    voted,
    abuse_flagged: flagged,
    endorsed,
    editReasonCode,
  });

  const { data } = await getAuthenticatedHttpClient()
    .patch(url, postData, { headers: { 'Content-Type': 'application/merge-patch+json' } });
  return data;
};

/**
 * Deletes existing comment.
 * @param {string} commentId ID of comment to delete
 */
export const deleteComment = async (commentId) => {
  const url = `${getCommentsApiUrl()}${commentId}/`;
  await getAuthenticatedHttpClient()
    .delete(url);
};

/**
 * Restores a deleted comment.
 * @param {string} commentId ID of comment to restore
 * @param {string} courseId Course ID
 * @returns {Promise<{}>}
 */
export const restoreComment = async (commentId, courseId) => {
  const url = `${getConfig().LMS_BASE_URL}/api/discussion/v1/restore_content`;
  const { data } = await getAuthenticatedHttpClient().post(url, {
    content_type: 'comment',
    content_id: commentId,
    course_id: courseId,
  });
  return data;
};
