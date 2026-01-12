import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { initializeMockApp } from '@edx/frontend-platform';
import { AppProvider } from '@edx/frontend-platform/react';

import { initializeStore } from '../../../store';
import DiscussionContext from '../../common/context';
import LearnerPostFilterBar from './LearnerPostFilterBar';

let store;
const username = 'abc123';
const courseId = 'course-v1:edX+DemoX+Demo_Course';

const renderComponent = () => render(
  <IntlProvider locale="en">
    <AppProvider store={store}>
      <DiscussionContext.Provider
        value={{
          learnerUsername: username,
          courseId,
        }}
      >
        <LearnerPostFilterBar />
      </DiscussionContext.Provider>
    </AppProvider>
  </IntlProvider>,
);

describe('LearnerPostFilterBar', () => {
  beforeEach(async () => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username,
        administrator: true,
        roles: [],
      },
    });
    const initialData = {
      config: {
        hasModerationPrivileges: true,
        isGroupTa: false,
      },
      cohorts: {
        status: 'successful',
        cohorts: [
          {
            name: 'Default Group',
            id: 1,
            userCount: 1,
            groupId: null,
          },
        ],
      },
    };
    store = initializeStore(initialData);
  });

  test('checks if all filters are visible', async () => {
    const { queryAllByRole } = await renderComponent();
    await act(async () => {
      fireEvent.click(queryAllByRole('button')[0]);
    });
    await waitFor(() => {
      expect(queryAllByRole('radiogroup')).toHaveLength(5);
    });
  });

  test('checks if default values are selected', async () => {
    const { queryAllByRole } = await renderComponent();
    await act(async () => {
      fireEvent.click(queryAllByRole('button')[0]);
    });
    await waitFor(() => {
      const radiogroups = queryAllByRole('radiogroup');
      // Radiogroup 0: postType filter - default is 'all'
      expect(
        radiogroups[0].querySelector('input[value="all"]'),
      ).toBeChecked();
      // Radiogroup 1: status filter (any/unread/reported/unanswered/unresponded)
      // - not checked since default is statusActive
      // Radiogroup 2: orderBy filter - default is 'lastActivityAt'
      expect(
        radiogroups[2].querySelector('input[value="lastActivityAt"]'),
      ).toBeChecked();
      // Radiogroup 3: active/deleted status filter - default is 'statusActive'
      expect(
        radiogroups[3].querySelector('input[value="statusActive"]'),
      ).toBeChecked();
      // Radiogroup 4: cohort filter - default is empty string
      expect(
        radiogroups[4].querySelector('input[value=""]'),
      ).toBeChecked();
    });
  });
});
