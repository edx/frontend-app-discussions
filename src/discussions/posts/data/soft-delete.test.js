import MockAdapter from 'axios-mock-adapter';
import { Factory } from 'rosie';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { initializeMockApp } from '@edx/frontend-platform/testing';

import { PostsStatusFilter } from '../../../data/constants';
import { initializeStore } from '../../../store';
import executeThunk from '../../../test-utils';
import { getThreadsApiUrl } from './api';
import { setStatusFilter } from './slices';
import { fetchThreads } from './thunks';

import './__factories__';

const courseId = 'course-v1:edX+TestX+Test_Course';
const threadsApiUrl = getThreadsApiUrl();

let axiosMock;
let store;

describe('Soft Delete Filtering Tests', () => {
  beforeEach(() => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });

    axiosMock = new MockAdapter(getAuthenticatedHttpClient());
    Factory.resetAll();
    store = initializeStore();
  });

  afterEach(() => {
    axiosMock.reset();
  });

  test('fetchThreads includes isDeleted=false when ACTIVE filter is selected', async () => {
    // Set filter to ACTIVE
    store.dispatch(setStatusFilter(PostsStatusFilter.ACTIVE));

    // Mock API response
    axiosMock.onGet(threadsApiUrl)
      .reply((config) => {
        // Verify that isDeleted=false is included in the request
        expect(config.params.is_deleted).toBe(false);
        return [200, Factory.build('threadsResult')];
      });

    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);
  });

  test('fetchThreads includes isDeleted=true when DELETED filter is selected', async () => {
    // Set filter to DELETED
    store.dispatch(setStatusFilter(PostsStatusFilter.DELETED));

    // Mock API response
    axiosMock.onGet(threadsApiUrl)
      .reply((config) => {
        // Verify that isDeleted=true is included in the request
        expect(config.params.is_deleted).toBe(true);
        return [200, Factory.build('threadsResult')];
      });

    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);
  });

  test('fetchThreads does not include isDeleted parameter for other filters', async () => {
    // Set filter to ALL (default)
    store.dispatch(setStatusFilter(PostsStatusFilter.ALL));

    // Mock API response
    axiosMock.onGet(threadsApiUrl)
      .reply((config) => {
        // Verify that isDeleted is not included in the request
        expect(config.params.is_deleted).toBeUndefined();
        return [200, Factory.build('threadsResult')];
      });

    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);
  });

  test('fetchThreads works with UNREAD filter (no isDeleted param)', async () => {
    // Set filter to UNREAD
    store.dispatch(setStatusFilter(PostsStatusFilter.UNREAD));

    // Mock API response
    axiosMock.onGet(threadsApiUrl)
      .reply((config) => {
        // Verify that view=unread is set and isDeleted is not included
        expect(config.params.view).toBe('unread');
        expect(config.params.is_deleted).toBeUndefined();
        return [200, Factory.build('threadsResult')];
      });

    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);
  });

  test('fetchThreads handles mixed filters correctly', async () => {
    // Set filter to DELETED with search
    store.dispatch(setStatusFilter(PostsStatusFilter.DELETED));

    const filters = {
      status: PostsStatusFilter.DELETED,
      search: 'test search',
    };

    // Mock API response
    axiosMock.onGet(threadsApiUrl)
      .reply((config) => {
        // Verify both isDeleted and textSearch are included
        expect(config.params.is_deleted).toBe(true);
        expect(config.params.text_search).toBe('test search');
        return [200, Factory.build('threadsResult')];
      });

    await executeThunk(fetchThreads(courseId, { filters }), store.dispatch, store.getState);
  });
});
