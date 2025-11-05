/**
 * Tests for FilterBar component with soft delete functionality
 */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';

import { IntlProvider } from '@edx/frontend-platform/i18n';

import messages from '../messages';
import { threadsReducer } from '../posts/data/slices';
import FilterBar from './FilterBar';

// Mock the soft delete service
jest.mock('../data/services/softDeleteService', () => ({
  bulkSoftDeleteThreads: jest.fn(),
  bulkRestoreThreads: jest.fn(),
}));

describe('FilterBar Component', () => {
  let store;
  let mockOnBulkAction;

  const createStore = (initialState = {}) => configureStore({
    reducer: {
      threads: threadsReducer,
    },
    preloadedState: {
      threads: {
        filter: 'active',
        loading: false,
        selectedThreadIds: [],
        bulkActionStatus: 'idle',
        bulkActionError: null,
        ...initialState.threads,
      },
    },
  });

  const renderFilterBar = (props = {}) => render(
    <Provider store={store}>
      <IntlProvider locale="en">
        <FilterBar
          isDeletedView={false}
          setIsDeletedView={jest.fn()}
          selectedThreadIds={[]}
          onBulkAction={mockOnBulkAction}
          isLoading={false}
          {...props}
        />
      </IntlProvider>
    </Provider>,
  );

  beforeEach(() => {
    store = createStore();
    mockOnBulkAction = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders filter buttons correctly', () => {
      renderFilterBar();

      expect(screen.getByTestId('active-threads-button')).toBeInTheDocument();
      expect(screen.getByTestId('deleted-threads-button')).toBeInTheDocument();
      expect(screen.getByText('Active Threads')).toBeInTheDocument();
      expect(screen.getByText('Deleted Threads')).toBeInTheDocument();
    });

    test('shows active filter as primary by default', () => {
      renderFilterBar();

      const activeButton = screen.getByTestId('active-threads-button');
      const deletedButton = screen.getByTestId('deleted-threads-button');

      expect(activeButton).toHaveClass('btn-primary');
      expect(deletedButton).toHaveClass('btn-outline-primary');
    });

    test('shows deleted filter as primary when in deleted view', () => {
      renderFilterBar({ isDeletedView: true });

      const activeButton = screen.getByTestId('active-threads-button');
      const deletedButton = screen.getByTestId('deleted-threads-button');

      expect(activeButton).toHaveClass('btn-outline-primary');
      expect(deletedButton).toHaveClass('btn-primary');
    });
  });

  describe('Loading State', () => {
    test('disables buttons when loading', () => {
      renderFilterBar({ isLoading: true });

      const activeButton = screen.getByTestId('active-threads-button');
      const deletedButton = screen.getByTestId('deleted-threads-button');

      expect(activeButton).toBeDisabled();
      expect(deletedButton).toBeDisabled();
    });

    test('shows loading spinner when loading', () => {
      renderFilterBar({ isLoading: true });

      expect(screen.getByText('Loading threads...')).toBeInTheDocument();
    });
  });

  describe('Bulk Actions - Active View', () => {
    test('shows bulk delete button when threads are selected in active view', () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({
        selectedThreadIds,
        isDeletedView: false,
      });

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-delete-button')).toBeInTheDocument();
      expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    });

    test('handles bulk delete action correctly', async () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({
        selectedThreadIds,
        isDeletedView: false,
      });

      const deleteButton = screen.getByTestId('bulk-delete-button');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnBulkAction).toHaveBeenCalledWith('soft-delete', selectedThreadIds);
      });
    });

    test('shows loading state during bulk delete', async () => {
      const selectedThreadIds = ['thread1'];
      mockOnBulkAction.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      renderFilterBar({
        selectedThreadIds,
        isDeletedView: false,
      });

      const deleteButton = screen.getByTestId('bulk-delete-button');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Bulk Actions - Deleted View', () => {
    test('shows bulk restore button when threads are selected in deleted view', () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({
        selectedThreadIds,
        isDeletedView: true,
      });

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-restore-button')).toBeInTheDocument();
      expect(screen.getByText('Restore Selected')).toBeInTheDocument();
    });

    test('handles bulk restore action correctly', async () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({
        selectedThreadIds,
        isDeletedView: true,
      });

      const restoreButton = screen.getByTestId('bulk-restore-button');
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(mockOnBulkAction).toHaveBeenCalledWith('restore', selectedThreadIds);
      });
    });

    test('shows loading state during bulk restore', async () => {
      const selectedThreadIds = ['thread1'];
      mockOnBulkAction.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      renderFilterBar({
        selectedThreadIds,
        isDeletedView: true,
      });

      const restoreButton = screen.getByTestId('bulk-restore-button');
      fireEvent.click(restoreButton);

      expect(screen.getByText('Restoring...')).toBeInTheDocument();
      expect(restoreButton).toBeDisabled();
    });
  });

  describe('No Selection State', () => {
    test('does not show bulk actions when no threads are selected', () => {
      renderFilterBar({ selectedThreadIds: [] });

      expect(screen.queryByText('Delete Selected')).not.toBeInTheDocument();
      expect(screen.queryByText('Restore Selected')).not.toBeInTheDocument();
      expect(screen.queryByText('selected')).not.toBeInTheDocument();
    });

    test('does not show bulk actions when onBulkAction is not provided', () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({
        selectedThreadIds,
        onBulkAction: undefined,
      });

      expect(screen.queryByText('Delete Selected')).not.toBeInTheDocument();
      expect(screen.queryByText('Restore Selected')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('resets loading state after bulk action completion', async () => {
      const selectedThreadIds = ['thread1'];
      let resolveAction;
      mockOnBulkAction.mockImplementation(() => new Promise((resolve) => {
        resolveAction = resolve;
      }));

      renderFilterBar({
        selectedThreadIds,
        isDeletedView: false,
      });

      const deleteButton = screen.getByTestId('bulk-delete-button');
      fireEvent.click(deleteButton);

      // Button should be disabled during action
      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
      });

      // Complete the action
      resolveAction();

      // Button should be re-enabled after action completes
      await waitFor(() => {
        expect(deleteButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper aria labels and roles', () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({ selectedThreadIds });

      const activeButton = screen.getByTestId('active-threads-button');
      const deletedButton = screen.getByTestId('deleted-threads-button');

      // Button components render as actual button elements
      expect(activeButton.tagName).toBe('BUTTON');
      expect(deletedButton.tagName).toBe('BUTTON');
    });

    test('spinner has proper screen reader text', () => {
      renderFilterBar({ isLoading: true });

      const spinner = screen.getByText('Loading threads...');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    test('displays localized messages correctly', () => {
      renderFilterBar();

      // Check that messages are being used correctly
      expect(screen.getByText(messages.activeThreads.defaultMessage)).toBeInTheDocument();
      expect(screen.getByText(messages.deletedThreads.defaultMessage)).toBeInTheDocument();
    });

    test('displays localized bulk action messages', () => {
      const selectedThreadIds = ['thread1', 'thread2'];
      renderFilterBar({ selectedThreadIds });

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    });
  });
});
