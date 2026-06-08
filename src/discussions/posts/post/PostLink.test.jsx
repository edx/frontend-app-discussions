import React from 'react';

import { render, screen, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { IntlProvider } from 'react-intl';
import { Factory } from 'rosie';

import { initializeMockApp } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { AppProvider } from '@edx/frontend-platform/react';

import { initializeStore } from '../../../store';
import executeThunk from '../../../test-utils';
import DiscussionContext from '../../common/context';
import { getCourseConfigApiUrl } from '../../data/api';
import fetchCourseConfig from '../../data/thunks';
import { getThreadsApiUrl } from '../data/api';
import { fetchThread } from '../data/thunks';
import PostLink from './PostLink';

import '../data/__factories__';

const courseId = 'course-v1:edX+DemoX+Demo_Course';
const courseConfigApiUrl = getCourseConfigApiUrl();
const threadsApiUrl = getThreadsApiUrl();
const postId = 'thread-1';
let store;
let axiosMock;

const mockThread = async (id, abuseFlagged) => {
  store = initializeStore();
  Factory.resetAll();

  axiosMock = new MockAdapter(getAuthenticatedHttpClient());
  axiosMock.onGet(`${courseConfigApiUrl}${courseId}/settings`).reply(200, {});
  axiosMock.onGet(`${courseConfigApiUrl}${courseId}/`).reply(200, {
    has_moderation_privileges: true,
  });
  axiosMock.onGet(`${threadsApiUrl}${id}/`).reply(200, Factory.build('thread', {
    id, abuse_flagged: abuseFlagged,
  }));

  await executeThunk(fetchCourseConfig(courseId), store.dispatch, store.getState);
  await executeThunk(fetchThread(id), store.dispatch, store.getState);
};

function renderComponent(id, page = 'posts', contextOverrides = {}) {
  return render(
    <IntlProvider locale="en">
      <AppProvider store={store}>
        <DiscussionContext.Provider value={{ courseId, page, ...contextOverrides }}>
          <PostLink
            key={id}
            postId={id}
          />
        </DiscussionContext.Provider>
      </AppProvider>
    </IntlProvider>,
  );
}

describe('PostFooter', () => {
  beforeEach(async () => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });
  });

  it.each([true, false])('has reported text only when abuseFlagged is %s', async (abuseFlagged) => {
    await mockThread(postId, abuseFlagged);
    renderComponent(postId);

    if (abuseFlagged) {
      expect(screen.getByText('Reported')).toBeTruthy();
    } else {
      expect(screen.queryByTestId('reported-post')).toBeFalsy();
    }
  });
});

describe('Post username', () => {
  beforeEach(async () => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });
  });

  it.each([
    'anonymous',
    'test-user',
  ])('is not clickable for %s user', async () => {
    await mockThread(postId, false);
    renderComponent(postId);

    expect(screen.queryByTestId('learner-posts-link')).not.toBeInTheDocument();
  });

  it('does not show deleted by attribution in post list cards', async () => {
    store = initializeStore();
    Factory.resetAll();

    axiosMock = new MockAdapter(getAuthenticatedHttpClient());
    axiosMock.onGet(`${courseConfigApiUrl}${courseId}/settings`).reply(200, {});
    axiosMock.onGet(`${courseConfigApiUrl}${courseId}/`).reply(200, {
      has_moderation_privileges: true,
    });
    axiosMock.onGet(`${threadsApiUrl}${postId}/`).reply(200, Factory.build('thread', {
      id: postId,
      is_deleted: true,
      deleted_by: 'staff-user',
      deleted_by_label: 'Staff',
    }));

    await executeThunk(fetchCourseConfig(courseId), store.dispatch, store.getState);
    await executeThunk(fetchThread(postId), store.dispatch, store.getState);

    const { container } = renderComponent(postId);

    expect(container.querySelector('.deleted-content-icon')).not.toBeInTheDocument();
  });

  it.each(['learners', 'posts', 'my-posts'])(
    'shows author name and role on a single line for %s listing',
    async (page) => {
      store = initializeStore();
      Factory.resetAll();

      axiosMock = new MockAdapter(getAuthenticatedHttpClient());
      axiosMock.onGet(`${courseConfigApiUrl}${courseId}/settings`).reply(200, {});
      axiosMock.onGet(`${courseConfigApiUrl}${courseId}/`).reply(200, {
        has_moderation_privileges: true,
      });
      axiosMock.onGet(`${threadsApiUrl}${postId}/`).reply(200, Factory.build('thread', {
        id: postId,
        author: 'staff-user',
        author_label: 'Staff',
      }));

      await executeThunk(fetchCourseConfig(courseId), store.dispatch, store.getState);
      await executeThunk(fetchThread(postId), store.dispatch, store.getState);

      renderComponent(
        postId,
        page,
        page === 'learners' ? { learnerUsername: 'staff-user' } : {},
      );

      const authorName = screen.getByRole('heading', { name: 'staff-user' });
      const singleLineRow = authorName.closest('div.d-flex.align-items-center.flex-nowrap');
      expect(singleLineRow).toBeInTheDocument();
      expect(
        within(singleLineRow).getByText((content) => content.includes('Global Staff')),
      ).toBeInTheDocument();
    },
  );
});
