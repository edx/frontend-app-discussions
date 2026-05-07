import MockAdapter from 'axios-mock-adapter';
import { Factory } from 'rosie';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { initializeMockApp } from '@edx/frontend-platform/testing';

import { initializeStore } from '../../../store';
import executeThunk from '../../../test-utils';
import { setContentCreationRateLimited } from '../../data/slices';
import { getThreadsApiUrl } from './api';
import {
  createNewThread, fetchThread, fetchThreads, removeThread, updateExistingThread,
} from './thunks';

import './__factories__';

const courseId = 'course-v1:edX+TestX+Test_Course';
const threadsApiUrl = getThreadsApiUrl();

let axiosMock;
let store;

describe('Threads/Posts data layer tests', () => {
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

  test('successfully processes threads', async () => {
    axiosMock.onGet(threadsApiUrl)
      .reply(200, Factory.build('threadsResult'));

    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);

    expect(store.getState().threads.threadsInTopic)
      .toEqual({ 'test-topic': ['thread-1', 'thread-2', 'thread-3'] });
    expect(store.getState().threads.pages)
      .toEqual([['thread-1', 'thread-2', 'thread-3']]);
    expect(Object.keys(store.getState().threads.threadsById))
      .toEqual(['thread-1', 'thread-2', 'thread-3']);
    expect(store.getState().threads.threadsById['thread-1'])
      .toHaveProperty('courseId');
    expect(store.getState().threads.threadsById['thread-1'])
      .toHaveProperty('topicId');
    expect(store.getState().threads.threadsById['thread-1'].topicId)
      .toEqual('test-topic');
  });

  test('successfully processes threads pagination', async () => {
    const mockPage = page => axiosMock
      .onGet(threadsApiUrl)
      .reply(200, Factory.build('threadsResult', null, {
        page,
        count: 5,
        pageSize: 3,
      }));

    mockPage(1);
    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);
    expect(store.getState().threads.pages)
      .toEqual([
        ['thread-1', 'thread-2', 'thread-3'],
      ]);
    expect(store.getState().threads.nextPage)
      .toEqual(2);

    mockPage(2);
    await executeThunk(fetchThreads(courseId, { page: 2 }), store.dispatch, store.getState);
    expect(store.getState().threads.pages)
      .toEqual([
        ['thread-1', 'thread-2', 'thread-3'],
        ['thread-4', 'thread-5'],
      ]);
    expect(store.getState().threads.nextPage)
      .toBeNull();
  });

  test('successfully processes single thread', async () => {
    const threadId = 'thread-1';
    axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
      .reply(200, Factory.build('thread'));

    await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

    expect(Object.keys(store.getState().threads.threadsById))
      .toEqual(['thread-1']);
    expect(store.getState().threads.threadsById['thread-1'])
      .toHaveProperty('courseId');
    expect(store.getState().threads.threadsById['thread-1'])
      .toHaveProperty('topicId');
    expect(store.getState().threads.threadsById['thread-1'].topicId)
      .toEqual('test-topic-1');
  });

  test('successfully handles thread creation', async () => {
    const topicId = 'test-topic';
    const title = 'A Test Thread';
    const content = 'Some test content';
    // pre-load thread results
    axiosMock.onGet(threadsApiUrl)
      .reply(200, Factory.build('threadsResult'));
    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);

    axiosMock.onPost(threadsApiUrl)
      .reply(200, Factory.build('thread', {
        course_id: courseId, topic_id: topicId, title, raw_body: content, rendered_body: content,
      }));

    await executeThunk(createNewThread(courseId, topicId, 'discussion', title, content), store.dispatch, store.getState);

    expect(store.getState().threads.threadsInTopic)
      .toEqual({ [topicId]: ['thread-1', 'thread-2', 'thread-3', 'thread-4'] });
    expect(Object.keys(store.getState().threads.threadsById))
      .toEqual(['thread-1', 'thread-2', 'thread-3', 'thread-4']);
    expect(store.getState().threads.threadsById['thread-1'])
      .toHaveProperty('courseId');
    expect(store.getState().threads.threadsById['thread-1'])
      .toHaveProperty('topicId');
    expect(store.getState().threads.threadsById['thread-1'].topicId)
      .toEqual(topicId);
  });

  test('successfully handles thread creation for topic that has not been preloaded', async () => {
    const topicId = 'test-topic';
    const title = 'A Test Thread';
    const content = 'Some test content';

    axiosMock.onPost(threadsApiUrl)
      .reply(200, Factory.build('thread', {
        course_id: courseId, topic_id: topicId, title, raw_body: content, rendered_body: content,
      }));

    expect(store.getState().threads.threadsInTopic[topicId])
      .toEqual(undefined);

    await executeThunk(createNewThread(courseId, topicId, 'discussion', title, content), store.dispatch, store.getState);

    expect(store.getState().threads.threadsInTopic[topicId])
      .toEqual(['thread-1']);
  });

  test('successfully handles 429 rate limit error when creating a thread', async () => {
    axiosMock.onPost(threadsApiUrl).reply(429);

    const dispatch = jest.fn();
    const thunk = createNewThread({
      courseId,
      topicId: 'test-topic',
      type: 'discussion',
      title: 'Rate Limited Thread',
      content: 'This should trigger rate limit',
    });

    await thunk(dispatch);

    expect(dispatch).toHaveBeenCalledWith(setContentCreationRateLimited());
  });

  test('successfully handles thread updates', async () => {
    const threadId = 'thread-2';
    axiosMock.onGet(threadsApiUrl)
      .reply(200, Factory.build('threadsResult'));
    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);

    expect(store.getState().threads.threadsById[threadId].voted)
      .toEqual(false);

    axiosMock.onPatch(`${threadsApiUrl}${threadId}/`)
      .reply(200, Factory.build('thread', { voted: true, id: threadId }));
    await executeThunk(updateExistingThread(threadId, { voted: true }), store.dispatch, store.getState);

    expect(store.getState().threads.threadsById[threadId].voted)
      .toEqual(true);
  });

  test('successfully handles thread deletion', async () => {
    const threadId = 'thread-2';
    axiosMock.onGet(threadsApiUrl)
      .reply(200, Factory.build('threadsResult'));
    await executeThunk(fetchThreads(courseId), store.dispatch, store.getState);

    axiosMock.onDelete(`${threadsApiUrl}${threadId}/`)
      .reply(201);
    await executeThunk(removeThread(threadId), store.dispatch, store.getState);

    expect(store.getState().threads.threadsById)
      .not
      .toHaveProperty(threadId);
    expect(store.getState().threads.pages[0])
      .not
      .toContain(threadId);
    expect(store.getState().threads.threadsInTopic['test-topic'])
      .not
      .toContain(threadId);
  });

  describe('read state preservation', () => {
    test('preserves read state when lastActivityAt unchanged', async () => {
      const threadId = 'thread-1';
      const lastActivityAt = '2023-01-01T00:00:00Z';

      // Initial fetch with read=true
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: true, lastActivityAt }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);

      // Refetch returns read=false but lastActivityAt unchanged (stale backend data)
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: false, lastActivityAt }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

      // Should preserve read=true since no new activity
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);
      expect(store.getState().threads.threadsById[threadId].unreadCommentCount).toBe(0);
    });

    test('trusts backend when lastActivityAt changed', async () => {
      const threadId = 'thread-1';

      // Initial fetch with read=true
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: true, lastActivityAt: '2023-01-01T00:00:00Z' }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);

      // Refetch returns read=false with new lastActivityAt (new activity)
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', {
          id: threadId, read: false, lastActivityAt: '2023-01-02T00:00:00Z', unread_comment_count: 5,
        }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

      // Should trust backend's unread state since activity changed
      expect(store.getState().threads.threadsById[threadId].read).toBe(false);
      expect(store.getState().threads.threadsById[threadId].unreadCommentCount).toBe(5);
    });

    test('falls back to commentCount when lastActivityAt undefined', async () => {
      const threadId = 'thread-1';

      // Initial fetch with read=true, no lastActivityAt
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: true, comment_count: 10 }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);

      // Refetch returns read=false but commentCount unchanged
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: false, comment_count: 10 }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

      // Should preserve read=true since commentCount unchanged
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);
    });

    test('trusts backend when commentCount changed', async () => {
      const threadId = 'thread-1';

      // Initial fetch with read=true
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: true, comment_count: 10 }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);

      // Refetch returns read=false with increased commentCount
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', {
          id: threadId, read: false, comment_count: 12, unread_comment_count: 2,
        }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

      // Should trust backend's unread state since commentCount changed
      expect(store.getState().threads.threadsById[threadId].read).toBe(false);
      expect(store.getState().threads.threadsById[threadId].unreadCommentCount).toBe(2);
    });

    test('trusts backend when no reliable activity markers', async () => {
      const threadId = 'thread-1';

      // Initial fetch with read=true, explicitly remove activity markers
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, { ...Factory.build('thread', { id: threadId, read: true }), lastActivityAt: null, comment_count: null });
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);
      expect(store.getState().threads.threadsById[threadId].read).toBe(true);

      // Refetch returns read=false
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, { ...Factory.build('thread', { id: threadId, read: false, unread_comment_count: 3 }), lastActivityAt: null, comment_count: null });
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

      // Should trust backend since we can't verify no new activity
      expect(store.getState().threads.threadsById[threadId].read).toBe(false);
      expect(store.getState().threads.threadsById[threadId].unreadCommentCount).toBe(3);
    });

    test('does not preserve when thread was not previously read', async () => {
      const threadId = 'thread-1';

      // Initial fetch with read=false
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: false, lastActivityAt: '2023-01-01T00:00:00Z' }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);
      expect(store.getState().threads.threadsById[threadId].read).toBe(false);

      // Refetch still returns read=false
      axiosMock.onGet(`${threadsApiUrl}${threadId}/`)
        .replyOnce(200, Factory.build('thread', { id: threadId, read: false, lastActivityAt: '2023-01-01T00:00:00Z' }));
      await executeThunk(fetchThread(threadId), store.dispatch, store.getState);

      // Should remain false (no preservation logic applies)
      expect(store.getState().threads.threadsById[threadId].read).toBe(false);
    });
  });
});
