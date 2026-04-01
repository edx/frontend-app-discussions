import { createSelector } from '@reduxjs/toolkit';

import { RequestStatus } from '../../../data/constants';

export const selectAllLearners = createSelector(
  state => state.learners.pages,
  pages => pages.flat(),
);

export const learnersLoadingStatus = () => state => state.learners.status;

export const selectUsernameSearch = () => state => state.learners.usernameSearch;

export const selectLearnerSorting = () => state => state.learners.sortedBy;

export const selectLearnerNextPage = () => state => state.learners.nextPage;

export const selectLearnerAvatar = author => state => (
  state.learners.learnerProfiles[author]?.profileImage?.imageUrlLarge
);

export const selectBulkDeleteStats = () => state => state.learners.bulkDeleteStats;

export const selectBannedUsers = state => state.learners.bannedUsers?.list || [];

export const selectBannedUsersStatus = state => state.learners.bannedUsers?.status || RequestStatus.IDLE;

export const selectAllBannedUsers = createSelector(
  selectBannedUsers,
  (bannedUsers) => {
    if (!Array.isArray(bannedUsers)) {
      return [];
    }
    return bannedUsers.filter(user => user.isActive);
  },
);
// Forum muted users selector
export const selectForumMutedUsers = (currentUsername) => (state) => {
  const forumMutedUsers = state.learners.mutedUsers || {};
  if (!currentUsername) { return forumMutedUsers; }
  // Filter to exclude current user if needed
  return forumMutedUsers;
};

// Select all muted users as an array
export const selectAllMutedUsers = (state) => Object.values(state.learners?.mutedUsers?.byUsername || {});

// Personal muted users by current user
export const selectPersonalMutedUsers = () => (state) => {
  const mutedUsers = state.learners?.mutedUsers?.byUsername || {};
  return (state.learners?.mutedUsers?.personal || []).map(username => mutedUsers[username]).filter(Boolean);
};

// Course-wide muted users by current user
export const selectCourseWideMutedUsers = () => (state) => {
  const mutedUsers = state.learners?.mutedUsers?.byUsername || {};
  return (state.learners?.mutedUsers?.course || []).map(username => mutedUsers[username]).filter(Boolean);
};
