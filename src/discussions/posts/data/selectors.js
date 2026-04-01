import { createSelector } from '@reduxjs/toolkit';
import camelCase from 'lodash/camelCase';

const selectThreads = state => state.threads.threadsById;

// Consolidated muted users selector - single source of truth
const selectMutedUsers = createSelector(
  [
    state => state.learners?.mutedUsers?.all || [],
    state => state.config?.mutedUsers || [],
  ],
  (learnersMuted, configMuted) => (learnersMuted.length > 0 ? learnersMuted : configMuted),
);

const selectPersonalMutedUsers = createSelector(
  [
    state => state.learners?.mutedUsers?.personal || [],
    state => state.config?.personalMutedUsers || [],
  ],
  (learnersPersonal, configPersonal) => (learnersPersonal.length > 0 ? learnersPersonal : configPersonal),
);

const selectCourseWideMutedUsers = createSelector(
  [
    state => state.learners?.mutedUsers?.course || [],
    state => state.config?.courseWideMutedUsers || [],
  ],
  (learnersCourse, configCourse) => (learnersCourse.length > 0 ? learnersCourse : configCourse),
);

// Helper to filter out threads from muted users (except the user being viewed)
const filterMutedThreads = (threads, mutedUsers, personalMutedUsers, courseWideMutedUsers, viewingUsername = null) => {
  const allMutedUsers = [
    ...(mutedUsers || []),
    ...(personalMutedUsers || []),
    ...(courseWideMutedUsers || []),
  ];
  if (allMutedUsers.length === 0) {
    return threads;
  }

  return threads.filter(thread => {
    if (!thread) { return false; }
    // Don't filter out posts when viewing that user's activity page
    if (viewingUsername && thread.author === viewingUsername) {
      return true;
    }
    return !allMutedUsers.includes(thread.author);
  });
};

const mapIdsToThreads = (ids, threads) => ids.map(id => threads?.[id]);

const mapIdsToFilteredThreads = (
  ids,
  threads,
  mutedUsers,
  personalMutedUsers,
  courseWideMutedUsers,
  viewingUsername = null,
) => {
  const allThreads = mapIdsToThreads(ids, threads);
  return filterMutedThreads(allThreads, mutedUsers, personalMutedUsers, courseWideMutedUsers, viewingUsername);
};

export const selectPostEditorVisible = state => state.threads.postEditorVisible;

export const selectTopicThreads = topicIds => createSelector(
  [
    state => (topicIds || []).flatMap(topicId => state.threads.threadsInTopic[topicId] || []),
    selectThreads,
    selectMutedUsers,
    selectPersonalMutedUsers,
    selectCourseWideMutedUsers,
  ],
  (ids, threads, mutedUsers, personalMutedUsers, courseWideMutedUsers) => mapIdsToFilteredThreads(
    ids,
    threads,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
  ),
);

export const selectTopicThreadsIds = topicIds => state => (
  (topicIds || []).flatMap(topicId => state.threads.threadsInTopic[topicId] || [])
);

export const selectThreadsByIds = (ids, viewingUsername = null) => createSelector(
  [
    selectThreads,
    selectMutedUsers,
    selectPersonalMutedUsers,
    selectCourseWideMutedUsers,
  ],
  (threads, mutedUsers, personalMutedUsers, courseWideMutedUsers) => mapIdsToFilteredThreads(
    ids,
    threads,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
    viewingUsername,
  ),
);

export const selectThread = threadId => createSelector(
  [selectThreads],
  (threads) => threads?.[threadId],
);

export const selectAllThreadsOnPage = (page) => createSelector(
  [
    state => state.threads.pages[page] || [],
    selectThreads,
    selectMutedUsers,
    selectPersonalMutedUsers,
    selectCourseWideMutedUsers,
  ],
  (ids, threads, mutedUsers, personalMutedUsers, courseWideMutedUsers) => mapIdsToFilteredThreads(
    ids,
    threads,
    mutedUsers,
    personalMutedUsers,
    courseWideMutedUsers,
  ),
);

export const selectAllThreads = createSelector(
  [
    state => state.threads.pages,
    selectThreads,
    selectMutedUsers,
    selectPersonalMutedUsers,
    selectCourseWideMutedUsers,
  ],
  (pages, threads, mutedUsers, personalMutedUsers, courseWideMutedUsers) => {
    const allIds = pages.flatMap(ids => ids);
    return mapIdsToFilteredThreads(allIds, threads, mutedUsers, personalMutedUsers, courseWideMutedUsers);
  },
);

export const selectAllThreadsIds = createSelector(
  [state => state.threads.pages],
  pages => pages.flatMap(ids => ids),
);

export const threadsLoadingStatus = () => state => state.threads.status;

export const selectThreadSorting = () => state => state.threads.sortedBy;

export const selectThreadFilters = () => state => state.threads.filters;

export const selectThreadNextPage = () => state => state.threads.nextPage;

export const selectAuthorAvatar = author => state => (
  state.threads.avatars?.[camelCase(author)]?.profile.image
);

export const selectIsDeletedView = () => state => state.threads.isDeletedView;
