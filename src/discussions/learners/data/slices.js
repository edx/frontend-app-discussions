import { createSlice } from '@reduxjs/toolkit';

import {
  LearnersOrdering,
  PostsStatusFilter,
  RequestStatus,
  ThreadOrdering,
  ThreadType,
} from '../../../data/constants';

const learnersSlice = createSlice({
  name: 'learner',
  initialState: {
    status: RequestStatus.IN_PROGRESS,
    learnerProfiles: {},
    pages: [],
    nextPage: null,
    totalPages: null,
    totalLearners: null,
    sortedBy: LearnersOrdering.BY_LAST_ACTIVITY,
    postFilter: {
      postType: ThreadType.ALL,
      status: PostsStatusFilter.ALL, // secondary status (Unread, etc.)
      contentStatus: PostsStatusFilter.ACTIVE, // main content status (Active/Deleted)
      orderBy: ThreadOrdering.BY_LAST_ACTIVITY,
      cohort: '',
    },
    usernameSearch: null,
    bulkDeleteStats: {
      commentCount: 0,
      threadCount: 0,
    },
    bannedUsers: {
      status: RequestStatus.IDLE,
      list: [],
    },
    mutedPosts: {
      status: RequestStatus.IDLE,
      personalMutedPosts: [],
      courseWideMutedPosts: [],
      muteStatus: RequestStatus.IDLE,
    },
    mutedUsers: {
      status: RequestStatus.IDLE,
      byUsername: {},
      personal: [],
      course: [],
    },
  },
  reducers: {
    fetchLearnersSuccess: (state, { payload }) => (
      {
        ...state,
        status: RequestStatus.SUCCESSFUL,
        pages: [
          ...state.pages.slice(0, payload.page - 1),
          payload.results,
          ...state.pages.slice(payload.page),
        ],
        learnerProfiles: {
          ...state.learnerProfiles,
          ...(payload.learnerProfiles || {}),
        },
        nextPage: payload.page < payload.pagination.numPages ? payload.page + 1 : null,
        totalPages: payload.pagination.numPages,
        totalLearners: payload.pagination.count,
      }
    ),
    fetchLearnersFailed: (state) => (
      {
        ...state,
        status: RequestStatus.FAILED,
      }
    ),
    fetchLearnersDenied: (state) => (
      {
        ...state,
        status: RequestStatus.DENIED,
      }
    ),
    fetchLearnersRequest: (state) => (
      {
        ...state,
        status: RequestStatus.IN_PROGRESS,
      }
    ),
    setSortedBy: (state, { payload }) => (
      {
        ...state,
        pages: [],
        sortedBy: payload,
      }
    ),
    setUsernameSearch: (state, { payload }) => (
      {
        ...state,
        usernameSearch: payload,
        pages: [],
      }
    ),
    setPostFilter: (state, { payload }) => (
      {
        ...state,
        pages: [],
        postFilter: {
          ...state.postFilter,
          ...payload,
        },
      }
    ),
    deleteUserPostsRequest: (state) => (
      {
        ...state,
        status: RequestStatus.IN_PROGRESS,
      }
    ),
    deleteUserPostsSuccess: (state, { payload }) => (
      {
        ...state,
        status: RequestStatus.SUCCESSFUL,
        bulkDeleteStats: payload,
        pages: [], // Clear pages to force refetch with updated stats
      }
    ),
    deleteUserPostsFailed: (state) => (
      {
        ...state,
        status: RequestStatus.FAILED,
      }
    ),
    undeleteUserPostsRequest: (state) => (
      {
        ...state,
        status: RequestStatus.IN_PROGRESS,
      }
    ),
    undeleteUserPostsSuccess: (state, { payload }) => (
      {
        ...state,
        status: RequestStatus.SUCCESSFUL,
        bulkDeleteStats: payload,
        bulkUndeleteStats: payload,
        pages: [], // Clear pages to force refetch with updated stats
      }
    ),
    undeleteUserPostsFailed: (state) => (
      {
        ...state,
        status: RequestStatus.FAILED,
      }
    ),
    fetchBannedUsersRequest: (state) => (
      {
        ...state,
        bannedUsers: {
          ...state.bannedUsers,
          status: RequestStatus.IN_PROGRESS,
        },
      }
    ),
    fetchBannedUsersSuccess: (state, { payload }) => (
      {
        ...state,
        bannedUsers: {
          status: RequestStatus.SUCCESSFUL,
          list: payload,
        },
      }
    ),
    fetchBannedUsersFailed: (state) => (
      {
        ...state,
        bannedUsers: {
          ...state.bannedUsers,
          status: RequestStatus.FAILED,
        },
      }
    ),

    fetchMutedPostsRequest: (state) => (
      {
        ...state,
        mutedPosts: {
          ...state.mutedPosts,
          status: RequestStatus.IN_PROGRESS,
        },
      }
    ),
    fetchMutedPostsSuccess: (state, { payload }) => ({
      ...state,
      mutedPosts: {
        status: RequestStatus.SUCCESSFUL,

        // // 🔥 USERS (only muted by current user – already filtered in thunk)
        // personalMutedUsers: payload.personalMutedUsers || [],
        // courseWideMutedUsers: payload.courseWideMutedUsers || [],

        // POSTS
        personalMutedPosts: payload.personalMutedPosts || [],
        courseWideMutedPosts: payload.courseWideMutedPosts || [],
      },
    }),

    fetchMutedPostsFailed: (state) => (
      {
        ...state,
        mutedPosts: {
          ...state.mutedPosts,
          status: RequestStatus.FAILED,
        },
      }
    ),
    banUserRequest: (state) => ({
      ...state,
      status: RequestStatus.IN_PROGRESS,
    }),
    banUserSuccess: (state) => ({
      ...state,
      status: RequestStatus.SUCCESSFUL,
    }),
    banUserFailed: (state) => ({
      ...state,
      status: RequestStatus.FAILED,
    }),
    unbanUserRequest: (state) => ({
      ...state,
      status: RequestStatus.IN_PROGRESS,
    }),
    unbanUserSuccess: (state) => ({
      ...state,
      status: RequestStatus.SUCCESSFUL,
    }),
    unbanUserFailed: (state) => ({
      ...state,
      status: RequestStatus.FAILED,
    }),
    deleteUserActivityRequest: (state) => ({
      ...state,
      status: RequestStatus.IN_PROGRESS,
    }),
    deleteUserActivitySuccess: (state, { payload }) => ({
      ...state,
      status: RequestStatus.SUCCESSFUL,
      bulkDeleteStats: payload,
      pages: [], // Clear pages to force refetch with updated stats
    }),
    deleteUserActivityFailed: (state) => ({
      ...state,
      status: RequestStatus.FAILED,
    }),
    undeleteUserActivityRequest: (state) => ({
      ...state,
      status: RequestStatus.IN_PROGRESS,
    }),
    undeleteUserActivitySuccess: (state, { payload }) => ({
      ...state,
      status: RequestStatus.SUCCESSFUL,
      bulkDeleteStats: payload,
      pages: [], // Clear pages to force refetch with updated stats
    }),
    undeleteUserActivityFailed: (state) => ({
      ...state,
      status: RequestStatus.FAILED,
    }),
    // Add muted users actions
    fetchMutedUsersRequest: (state) => ({
      ...state,
      mutedUsers: {
        ...state.mutedUsers,
        status: RequestStatus.IN_PROGRESS,
      },
    }),

    fetchMutedUsersSuccess: (state, { payload }) => {
      const { mutedUsers } = payload;

      const byUsername = {};
      const personal = [];
      const course = [];

      mutedUsers.forEach(user => {
        if (!user.username) { return; }

        byUsername[user.username] = user;

        if (user.scope === 'personal') {
          personal.push(user.username);
        }
        if (user.scope === 'course') {
          course.push(user.username);
        }
      });

      return {
        ...state,
        mutedUsers: {
          status: RequestStatus.SUCCESSFUL,
          byUsername,
          personal,
          course,
        },
      };
    },

    fetchMutedUsersFailed: (state) => ({
      ...state,
      mutedUsers: {
        ...state.mutedUsers,
        status: RequestStatus.FAILED,
      },
    }),

  },
});

export const {
  fetchLearnersFailed,
  fetchLearnersRequest,
  fetchLearnersSuccess,
  fetchLearnersDenied,
  setSortedBy,
  setUsernameSearch,
  setPostFilter,
  deleteUserPostsRequest,
  deleteUserPostsSuccess,
  deleteUserPostsFailed,
  undeleteUserPostsRequest,
  undeleteUserPostsSuccess,
  undeleteUserPostsFailed,
  fetchBannedUsersRequest,
  fetchBannedUsersSuccess,
  fetchBannedUsersFailed,
  banUserRequest,
  banUserSuccess,
  banUserFailed,
  unbanUserRequest,
  unbanUserSuccess,
  unbanUserFailed,
  deleteUserActivityRequest,
  deleteUserActivitySuccess,
  deleteUserActivityFailed,
  undeleteUserActivityRequest,
  undeleteUserActivitySuccess,
  undeleteUserActivityFailed,
  fetchMutedPostsRequest,
  fetchMutedPostsSuccess,
  fetchMutedPostsFailed,
  fetchMutedUsersRequest,
  fetchMutedUsersSuccess,
  fetchMutedUsersFailed,
} = learnersSlice.actions;

export const learnersReducer = learnersSlice.reducer;
