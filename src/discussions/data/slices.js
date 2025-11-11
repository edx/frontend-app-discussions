/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

import { RequestStatus } from '../../data/constants';

const configSlice = createSlice({
  name: 'config',
  initialState: {
    status: RequestStatus.IN_PROGRESS,
    allowAnonymous: false,
    allowAnonymousToPeers: false,
    userRoles: [],
    groupAtSubsection: false,
    hasModerationPrivileges: false,
    hasBulkDeletePrivileges: false,
    isGroupTa: false,
    isCourseAdmin: false,
    isCourseStaff: false,
    isUserAdmin: false,
    isPostingEnabled: false,
    settings: {
      divisionScheme: 'none',
      alwaysDivideInlineDiscussions: false,
      dividedInlineDiscussions: [],
      dividedCourseWideDiscussions: [],
    },
    captchaSettings: {
      enabled: false,
      siteKey: '',
    },
    editReasons: [],
    postCloseReasons: [],
    enableInContext: false,
    isEmailVerified: false,
    contentCreationRateLimited: false,
  },
  reducers: {
    fetchConfigRequest: (state) => (
      {
        ...state,
        status: RequestStatus.IN_PROGRESS,
      }
    ),
    fetchConfigSuccess: (state, { payload }) => {
      const newState = Object.assign(state, payload);
      newState.status = RequestStatus.SUCCESSFUL;
      return newState;
    },
    fetchConfigFailed: (state) => (
      {
        ...state,
        status: RequestStatus.FAILED,
      }
    ),
    fetchConfigDenied: (state) => (
      {
        ...state,
        status: RequestStatus.DENIED,
      }
    ),
    setContentCreationRateLimited: (state) => (
      {
        ...state,
        contentCreationRateLimited: true,
      }
    ),
  },
});

export const {
  fetchConfigDenied,
  fetchConfigFailed,
  fetchConfigRequest,
  fetchConfigSuccess,
  setContentCreationRateLimited,
} = configSlice.actions;

export const configReducer = configSlice.reducer;

// Threads slice for soft delete functionality
const threadsSlice = createSlice({
  name: 'threads',
  initialState: {
    filter: 'active', // 'active' or 'deleted'
    loading: false,
    selectedThreadIds: [],
    bulkActionStatus: RequestStatus.IDLE,
    bulkActionError: null,
  },
  reducers: {
    setThreadsFilter: (state, { payload }) => {
      state.filter = payload;
      state.selectedThreadIds = []; // Clear selection when changing filter
    },
    setThreadsLoading: (state, { payload }) => {
      state.loading = payload;
    },
    setSelectedThreadIds: (state, { payload }) => {
      state.selectedThreadIds = payload;
    },
    toggleThreadSelection: (state, { payload }) => {
      const threadId = payload;
      const index = state.selectedThreadIds.indexOf(threadId);
      if (index > -1) {
        state.selectedThreadIds.splice(index, 1);
      } else {
        state.selectedThreadIds.push(threadId);
      }
    },
    clearThreadSelection: (state) => {
      state.selectedThreadIds = [];
    },
    bulkActionRequest: (state) => {
      state.bulkActionStatus = RequestStatus.IN_PROGRESS;
      state.bulkActionError = null;
    },
    bulkActionSuccess: (state) => {
      state.bulkActionStatus = RequestStatus.SUCCESSFUL;
      state.selectedThreadIds = []; // Clear selection after successful action
    },
    bulkActionFailed: (state, { payload }) => {
      state.bulkActionStatus = RequestStatus.FAILED;
      state.bulkActionError = payload;
    },
  },
});

export const {
  setThreadsFilter,
  setThreadsLoading,
  setSelectedThreadIds,
  toggleThreadSelection,
  clearThreadSelection,
  bulkActionRequest,
  bulkActionSuccess,
  bulkActionFailed,
} = threadsSlice.actions;

export const threadsReducer = threadsSlice.reducer;
