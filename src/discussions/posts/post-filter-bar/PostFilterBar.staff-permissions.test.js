import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { initializeMockApp } from '@edx/frontend-platform';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Factory } from 'rosie';

import { initializeStore } from '../../../store';
import { executeThunk } from '../../../test-utils';
import DiscussionContext from '../../common/context';
import { fetchConfigSuccess } from '../../data/slices';
import '../../data/__factories__';
import PostFilterBar from './PostFilterBar';

const courseId = 'course-v1:edX+TestX+Test_Course';

function renderComponent(mockStore, mockContext = {}) {
  return render(
    <IntlProvider locale="en">
      <Provider store={mockStore}>
        <MemoryRouter initialEntries={[`/course/${courseId}/discussions`]}>
          <Routes>
            <Route
              path="/course/:courseId/*"
              element={(
                <DiscussionContext.Provider
                  value={{
                    courseId,
                    page: 'discussions',
                    category: null,
                    topicId: null,
                    postId: null,
                    ...mockContext,
                  }}
                >
                  <PostFilterBar />
                </DiscussionContext.Provider>
              )}
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    </IntlProvider>,
  );
}

describe('PostFilterBar Staff Permission Tests', () => {
  let store;

  beforeEach(() => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });
    store = initializeStore();
  });

  test('shows soft delete filters for staff users', async () => {
    const configData = Factory.build('config', {
      has_moderation_privileges: false,
      isGroupTa: false,
      isUserAdmin: true, // This is the staff flag
    });

    await executeThunk(fetchConfigSuccess(configData), store.dispatch, store.getState);

    renderComponent(store);

    // Open the filter dropdown
    const filterButton = screen.getByRole('button');
    filterButton.click();

    // Check that Active and Deleted filters are present
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  test('shows soft delete filters for moderation privilege users', async () => {
    const configData = Factory.build('config', {
      has_moderation_privileges: true,
      isGroupTa: false,
      isUserAdmin: false,
    });

    await executeThunk(fetchConfigSuccess(configData), store.dispatch, store.getState);

    renderComponent(store);

    // Open the filter dropdown
    const filterButton = screen.getByRole('button');
    filterButton.click();

    // Check that Active and Deleted filters are present
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  test('shows soft delete filters for group TA users', async () => {
    const configData = Factory.build('config', {
      has_moderation_privileges: false,
      isGroupTa: true,
      isUserAdmin: false,
    });

    await executeThunk(fetchConfigSuccess(configData), store.dispatch, store.getState);

    renderComponent(store);

    // Open the filter dropdown
    const filterButton = screen.getByRole('button');
    filterButton.click();

    // Check that Active and Deleted filters are present
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  test('hides soft delete filters for regular learners', async () => {
    const configData = Factory.build('config', {
      has_moderation_privileges: false,
      isGroupTa: false,
      isUserAdmin: false,
    });

    await executeThunk(fetchConfigSuccess(configData), store.dispatch, store.getState);

    renderComponent(store);

    // Open the filter dropdown
    const filterButton = screen.getByRole('button');
    filterButton.click();

    // Check that Active and Deleted filters are NOT present
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
  });
});