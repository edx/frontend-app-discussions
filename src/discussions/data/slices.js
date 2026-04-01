import { createSlice } from '@reduxjs/toolkit';

import { RequestStatus } from '../../data/constants';

const configSlice = createSlice({
  name: 'config',
  initialState: {
    status: RequestStatus.IN_PROGRESS,
    courseId: null,
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
    isUserBanned: false,
    enableDiscussionBan: false,
    mutedUsers: [],
    personalMutedUsers: [],
    courseWideMutedUsers: [],
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
    // Mute user actions
    muteUserRequest: (state) => ({
      ...state,
      muteStatus: RequestStatus.IN_PROGRESS,
      muteError: null,
    }),
    muteUserSuccess: (state, { payload }) => {
      const { username, isCourseWide, mutedUsers } = payload;
      const newState = { ...state };
      if (isCourseWide) {
        newState.courseWideMutedUsers = [...state.courseWideMutedUsers, username];
      } else {
        newState.personalMutedUsers = [...state.personalMutedUsers, username];
      }
      if (mutedUsers) {
        newState.mutedUsers = mutedUsers;
      }
      newState.muteStatus = RequestStatus.SUCCESSFUL;
      return newState;
    },
    muteUserFailed: (state, { payload }) => ({
      ...state,
      muteStatus: RequestStatus.FAILED,
      muteError: payload,
    }),
    unmuteUserRequest: (state) => ({
      ...state,
      muteStatus: RequestStatus.IN_PROGRESS,
      muteError: null,
    }),
    unmuteUserSuccess: (state, { payload }) => {
      const { username, isCourseWide, mutedUsers } = payload;
      const newState = { ...state };
      if (isCourseWide) {
        newState.courseWideMutedUsers = state.courseWideMutedUsers.filter(user => user !== username);
      } else {
        newState.personalMutedUsers = state.personalMutedUsers.filter(user => user !== username);
      }
      if (mutedUsers) {
        newState.mutedUsers = mutedUsers;
      }
      newState.muteStatus = RequestStatus.SUCCESSFUL;
      return newState;
    },
    unmuteUserFailed: (state, { payload }) => ({
      ...state,
      muteStatus: RequestStatus.FAILED,
      muteError: payload,
    }),
  },
});

export const {
  fetchConfigDenied,
  fetchConfigFailed,
  fetchConfigRequest,
  fetchConfigSuccess,
  setContentCreationRateLimited,
  muteUserRequest,
  muteUserSuccess,
  muteUserFailed,
  unmuteUserRequest,
  unmuteUserSuccess,
  unmuteUserFailed,
} = configSlice.actions;

export const configReducer = configSlice.reducer;
