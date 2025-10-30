import MockAdapter from 'axios-mock-adapter';
import { Factory } from 'rosie';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { initializeMockApp } from '@edx/frontend-platform/testing';

import { PostsStatusFilter } from '../../../data/constants';
import { initializeStore } from '../../../store';
import executeThunk from '../../../test-utils';
import { learnerPostsApiUrl } from './api';
import { fetchUserPosts } from './thunks';

const courseId = 'course-v1:edX+TestX+Test_Course';
const learnerApiUrl = learnerPostsApiUrl(courseId);

let axiosMock;
let store;

describe('Learner Posts Soft Delete Filtering Tests', () => {
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

  test('fetchUserPosts includes isDeleted=false when ACTIVE filter is selected', async () => {
    const filters = {
      status: PostsStatusFilter.ACTIVE,
    };
    
    // Mock API response
    axiosMock.onGet(learnerApiUrl)
      .reply((config) => {
        // Verify that isDeleted=false is included in the request
        expect(config.params.is_deleted).toBe(false);
        return [200, { results: [], pagination: { count: 0, num_pages: 1 } }];
      });

    await executeThunk(fetchUserPosts(courseId, { filters }), store.dispatch, store.getState);
  });

  test('fetchUserPosts includes isDeleted=true when DELETED filter is selected', async () => {
    const filters = {
      status: PostsStatusFilter.DELETED,
    };
    
    // Mock API response
    axiosMock.onGet(learnerApiUrl)
      .reply((config) => {
        // Verify that isDeleted=true is included in the request
        expect(config.params.is_deleted).toBe(true);
        return [200, { results: [], pagination: { count: 0, num_pages: 1 } }];
      });

    await executeThunk(fetchUserPosts(courseId, { filters }), store.dispatch, store.getState);
  });

  test('fetchUserPosts does not include isDeleted parameter for other filters', async () => {
    const filters = {
      status: PostsStatusFilter.UNREAD,
    };
    
    // Mock API response
    axiosMock.onGet(learnerApiUrl)
      .reply((config) => {
        // Verify that isDeleted is not included in the request
        expect(config.params.is_deleted).toBeUndefined();
        expect(config.params.status).toBe('unread');
        return [200, { results: [], pagination: { count: 0, num_pages: 1 } }];
      });

    await executeThunk(fetchUserPosts(courseId, { filters }), store.dispatch, store.getState);
  });

  test('fetchUserPosts handles mixed filters correctly', async () => {
    const filters = {
      status: PostsStatusFilter.DELETED,
      search: 'test search',
    };
    
    // Mock API response
    axiosMock.onGet(learnerApiUrl)
      .reply((config) => {
        // Verify both isDeleted and textSearch are included
        expect(config.params.is_deleted).toBe(true);
        expect(config.params.text_search).toBe('test search');
        return [200, { results: [], pagination: { count: 0, num_pages: 1 } }];
      });

    await executeThunk(fetchUserPosts(courseId, { filters }), store.dispatch, store.getState);
  });
});