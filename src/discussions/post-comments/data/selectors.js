import { createSelector } from '@reduxjs/toolkit';

const selectCommentsById = state => state.comments.commentsById;

// Helper to filter out comments from muted users (except the user being viewed)
const filterMutedComments = (
  comments,
  mutedUsers,
  personalMutedUsers,
  courseWideMutedUsers,
  viewingUsername = null,
) => {
  const allMutedUsers = [
    ...(mutedUsers || []),
    ...(personalMutedUsers || []),
    ...(courseWideMutedUsers || []),
  ];

  if (allMutedUsers.length === 0) {
    return comments;
  }

  return comments.filter(comment => {
    if (!comment) { return false; }
    // Don't filter out comments when viewing that user's activity page
    if (viewingUsername && comment.author === viewingUsername) {
      return true;
    }
    return !allMutedUsers.includes(comment.author);
  });
};

const mapIdToComment = (ids, comments) => ids.map(id => comments[id]);

const mapIdToFilteredComment = (
  ids,
  comments,
  mutedUsers,
  personalMutedUsers,
  courseWideMutedUsers,
  viewingUsername = null,
) => {
  const allComments = mapIdToComment(ids, comments);
  return filterMutedComments(allComments, mutedUsers, personalMutedUsers, courseWideMutedUsers, viewingUsername);
};

export const selectCommentOrResponseById = commentOrResponseId => createSelector(
  selectCommentsById,
  comments => comments[commentOrResponseId],
);

export const selectThreadComments = (threadId, viewingUsername = null) => createSelector(
  [
    state => state.comments.commentsInThreads[threadId] || [],
    selectCommentsById,
    state => state.learners?.mutedUsers?.all || [],
    state => state.learners?.mutedUsers?.personal || [],
    state => state.learners?.mutedUsers?.course || [],
  ],
  (
    ids,
    comments,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
  ) => mapIdToFilteredComment(
    ids,
    comments,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
    viewingUsername,
  ),
);

export const selectCommentResponsesIds = commentId => (
  state => state.comments.commentsInComments[commentId] || []
);

export const selectCommentResponses = (commentId, viewingUsername = null) => createSelector(
  [
    state => state.comments.commentsInComments[commentId] || [],
    selectCommentsById,
    state => state.learners?.mutedUsers?.all || [],
    state => state.learners?.mutedUsers?.personal || [],
    state => state.learners?.mutedUsers?.course || [],
  ],
  (
    ids,
    comments,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
  ) => mapIdToFilteredComment(
    ids,
    comments,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
    viewingUsername,
  ),
);

export const selectThreadHasMorePages = (threadId) => (
  state => state.comments.pagination[threadId]?.hasMorePages || false
);

export const selectThreadCurrentPage = (threadId) => (
  state => state.comments.pagination[threadId]?.currentPage || null
);

export const selectCommentHasMorePages = commentId => (
  state => state.comments.responsesPagination[commentId]?.hasMorePages || false
);

export const selectCommentCurrentPage = commentId => (
  state => state.comments.responsesPagination[commentId]?.currentPage || null
);

export const selectCommentsStatus = state => state.comments.status;

export const selectCommentSortOrder = state => state.comments.sortOrder;

export const selectDraftComments = state => state.comments.draftComments;

export const selectDraftResponses = state => state.comments.draftResponses;
