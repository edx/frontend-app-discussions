import React from 'react';

import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import { IntlProvider } from '@edx/frontend-platform/i18n';

import MuteModalManager from './MuteModalManager';

const mockMuteUserThunk = jest.fn();
const mockUnmuteUserThunk = jest.fn();
const mockMuteAndReportUserThunk = jest.fn();
const mockFetchMutedUsersThunk = jest.fn();

// Mock functions should return Redux action creators that return Promises for async behavior
jest.mock('../data/thunks', () => ({
  muteUserThunk: (...args) => () => {
    mockMuteUserThunk(...args);
    return Promise.resolve({ type: 'MOCK_MUTE_USER', payload: args });
  },
  unmuteUserThunk: (...args) => () => {
    mockUnmuteUserThunk(...args);
    return Promise.resolve({ type: 'MOCK_UNMUTE_USER', payload: args });
  },
  muteAndReportUserThunk: (...args) => () => {
    mockMuteAndReportUserThunk(...args);
    return Promise.resolve({ type: 'MOCK_MUTE_AND_REPORT_USER', payload: args });
  },
  fetchMutedUsersThunk: (...args) => () => {
    mockFetchMutedUsersThunk(...args);
    return Promise.resolve({ type: 'MOCK_FETCH_MUTED_USERS', payload: args });
  },
}));

// Mock posts thunks to prevent logError issues
jest.mock('../posts/data/thunks', () => ({
  fetchThreads: () => () => Promise.resolve({ type: 'MOCK_FETCH_THREADS' }),
}));

const mockStore = createStore(() => ({
  config: {
    personalMutedUsers: [],
    courseWideMutedUsers: [],
    userIsStaff: true,
    userHasModerationPrivileges: true,
  },
}), applyMiddleware(thunk));

const mockMessages = {
  learnerMuteTitle: {
    id: 'test.learnerMuteTitle',
    defaultMessage: 'Mute this user?',
    description: 'Title for learner mute modal',
  },
  learnerMuteDescription: {
    id: 'test.learnerMuteDescription',
    defaultMessage: 'Are you sure you want to mute {username}?',
    description: 'Description for learner mute modal',
  },
  learnerMuteButton: {
    id: 'test.learnerMuteButton',
    defaultMessage: 'Mute',
    description: 'Button text for mute action',
  },
  learnerMuteAndReportButton: {
    id: 'test.learnerMuteAndReportButton',
    defaultMessage: 'Mute and report',
    description: 'Button text for mute and report action',
  },
  unmuteTitle: {
    id: 'test.unmuteTitle',
    defaultMessage: 'Unmute this user?',
    description: 'Title for unmute modal',
  },
  unmuteDescription: {
    id: 'test.unmuteDescription',
    defaultMessage: 'Are you sure you want to unmute {username}?',
    description: 'Description for unmute modal',
  },
  unmuteButton: {
    id: 'test.unmuteButton',
    defaultMessage: 'Unmute',
    description: 'Button text for unmute action',
  },
};

const mockProps = {
  showLearnerMuteModal: false,
  showUnmuteModal: false,
  onCloseLearnerMuteModal: jest.fn(),
  onCloseUnmuteModal: jest.fn(),
  username: 'testuser',
  contentId: 'test-content-id',
  messages: mockMessages,
};

const renderWithProvider = (component) => render(
  <IntlProvider locale="en">
    <Provider store={mockStore}>
      {component}
    </Provider>
  </IntlProvider>,
);

describe('MuteModalManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Learner Mute Modal', () => {
    it('renders learner mute modal when showLearnerMuteModal is true', () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showLearnerMuteModal
        />,
      );

      expect(screen.getByText('Mute this user?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to mute testuser?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mute and report' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('calls onCloseLearnerMuteModal when cancel button is clicked', () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showLearnerMuteModal
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockProps.onCloseLearnerMuteModal).toHaveBeenCalledTimes(1);
    });

    it('handles learner mute action correctly', async () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showLearnerMuteModal
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
      expect(mockMuteUserThunk).toHaveBeenCalledWith('testuser', false);

      await waitFor(() => {
        expect(mockProps.onCloseLearnerMuteModal).toHaveBeenCalledTimes(1);
      });
    });

    it('handles learner mute and report action correctly', async () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showLearnerMuteModal
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Mute and report' }));
      expect(mockMuteAndReportUserThunk).toHaveBeenCalledWith('testuser', 'test-content-id');

      await waitFor(() => {
        expect(mockProps.onCloseLearnerMuteModal).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Unmute Modal', () => {
    it('renders unmute modal when showUnmuteModal is true', () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showUnmuteModal
        />,
      );

      expect(screen.getByText('Unmute this user?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to unmute testuser?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('calls onCloseUnmuteModal when cancel button is clicked', () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showUnmuteModal
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockProps.onCloseUnmuteModal).toHaveBeenCalledTimes(1);
    });

    it('handles unmute action correctly', async () => {
      renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showUnmuteModal
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
      expect(mockUnmuteUserThunk).toHaveBeenCalledWith('testuser', false);

      await waitFor(() => {
        expect(mockProps.onCloseUnmuteModal).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Integration', () => {
    it('handles multiple modals correctly', () => {
      // Test that only one modal is shown at a time
      const { rerender } = renderWithProvider(
        <MuteModalManager
          {...mockProps}
          showLearnerMuteModal
        />,
      );

      // Learner modal should be visible
      expect(screen.getByText('Mute this user?')).toBeInTheDocument();

      // Test switching to unmute modal
      rerender(
        <IntlProvider locale="en">
          <Provider store={mockStore}>
            <MuteModalManager
              {...mockProps}
              showLearnerMuteModal={false}
              showUnmuteModal
            />
          </Provider>
        </IntlProvider>,
      );

      expect(screen.getByText('Unmute this user?')).toBeInTheDocument();
    });
  });
});
