import React from 'react';

import { render, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { PostsStatusFilter } from '../../../../data/constants';
import DiscussionContext from '../../../common/context';
import { fetchCommentResponses } from '../../data/thunks';
import PostCommentsContext from '../../postCommentsContext';
import Comment from './Comment';

let mockCommentData;
const mockHoverCard = jest.fn(() => <div data-testid="hover-card-mock" />);

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@openedx/paragon/icons', () => ({
  DeleteOutline: 'DeleteOutline',
}));

jest.mock('../../../../components/HTMLLoader', () => 'HTMLLoader');
jest.mock('./CommentEditor', () => 'CommentEditor');
jest.mock('./CommentHeader', () => 'CommentHeader');
jest.mock('./Reply', () => 'Reply');

jest.mock('../../../common/HoverCard', () => (props) => mockHoverCard(props));
jest.mock('../../../posts/post/LikeButton', () => 'LikeButton');

jest.mock('../../../common', () => ({
  AlertBanner: 'AlertBanner',
  AuthorLabel: 'AuthorLabel',
  AutoSpamAlertBanner: 'AutoSpamAlertBanner',
  BanModerationModals: 'BanModerationModals',
  Confirmation: 'Confirmation',
  DeletedByBanner: () => <div className="deleted-content-icon" />,
  EndorsedAlertBanner: 'EndorsedAlertBanner',
  MuteModalManager: 'MuteModalManager',
}));

jest.mock('../../../common/withPostingRestrictions', () => Component => Component);

jest.mock('../../data/selectors', () => ({
  selectCommentCurrentPage: jest.fn(() => () => 1),
  selectCommentHasMorePages: jest.fn(() => () => false),
  selectCommentOrResponseById: jest.fn(() => () => mockCommentData),
  selectCommentResponses: jest.fn(() => () => []),
  selectCommentResponsesIds: jest.fn(() => () => []),
  selectCommentSortOrder: jest.fn(() => false),
}));

jest.mock('../../../data/selectors', () => ({
  selectContentCreationRateLimited: jest.fn(() => false),
  selectIsUserBanned: jest.fn(() => false),
  selectShouldShowEmailConfirmation: jest.fn(() => false),
  selectUserHasModerationPrivileges: jest.fn(() => true),
}));

jest.mock('../../../data/hooks', () => ({
  useUserPostingEnabled: jest.fn(() => true),
}));

jest.mock('../../../utils', () => ({
  useActions: jest.fn(() => []),
}));

jest.mock('../../data/thunks', () => ({
  editComment: jest.fn(),
  fetchCommentResponses: jest.fn(() => ({ type: 'FETCH_COMMENT_RESPONSES' })),
  performRestoreComment: jest.fn(),
  removeComment: jest.fn(),
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  logError: jest.fn(),
}));

const baseComment = {
  id: 'comment-1',
  parentId: null,
  childCount: 0,
  abuseFlagged: false,
  endorsed: false,
  threadId: 'post-1',
  endorsedAt: null,
  endorsedBy: null,
  endorsedByLabel: null,
  renderedBody: '<p>Comment body</p>',
  voted: false,
  following: false,
  voteCount: 0,
  authorLabel: 'staff',
  author: 'comment-author',
  createdAt: '2025-01-01T00:00:00Z',
  lastEdit: null,
  rawBody: 'Comment body',
  closed: false,
  closedBy: null,
  closeReason: null,
  editByLabel: null,
  closedByLabel: null,
  users: {},
  isDeleted: false,
  deletedBy: null,
  deletedByLabel: null,
  is_spam: false,
};

const renderComment = (commentOverrides = {}, { showFullThread = false } = {}) => {
  mockCommentData = { ...baseComment, ...commentOverrides };

  return render(
    <IntlProvider locale="en">
      <MemoryRouter>
        <DiscussionContext.Provider
          value={{
            courseId: 'course-v1:edX+DemoX+Demo_Course',
            enableDiscussionBan: true,
            learnerUsername: 'learner-1',
          }}
        >
          <PostCommentsContext.Provider value={{ isClosed: false }}>
            <Comment
              commentId="comment-1"
              marginBottom={false}
              showFullThread={showFullThread}
              openRestrictionDialogue={jest.fn()}
            />
          </PostCommentsContext.Provider>
        </DiscussionContext.Provider>
      </MemoryRouter>
    </IntlProvider>,
  );
};

describe('Comment deleted-by banner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(jest.fn());
    useSelector.mockImplementation(selector => (typeof selector === 'function' ? selector({}) : selector));
  });

  it('renders deleted-by banner when isDeleted=true and deletedBy is present', () => {
    const { container } = renderComment({ isDeleted: true, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(container.querySelector('.deleted-content-icon')).toBeInTheDocument();
  });

  it('passes isDeleted to HoverCard for deleted comments', () => {
    renderComment({ isDeleted: true, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(mockHoverCard).toHaveBeenCalled();
    expect(mockHoverCard.mock.calls[0][0]).toEqual(expect.objectContaining({ isDeleted: true }));
  });

  it('does not render deleted-by banner when deletedBy is not present', () => {
    const { container } = renderComment({ isDeleted: true, deletedBy: null, deletedByLabel: 'staff' });

    expect(container.querySelector('.deleted-content-icon')).not.toBeInTheDocument();
  });

  it('requests deleted replies when learner deleted filter is active', async () => {
    useSelector.mockImplementation((selector) => {
      const mockState = {
        learners: {
          postFilter: {
            contentStatus: PostsStatusFilter.DELETED,
          },
        },
      };
      return typeof selector === 'function' ? selector(mockState) : selector;
    });

    renderComment({ childCount: 2 }, { showFullThread: true });

    await waitFor(() => {
      expect(fetchCommentResponses).toHaveBeenCalledWith('comment-1', {
        includeMuted: false,
        page: 1,
        reverseOrder: false,
        showDeleted: true,
      });
    });
  });
});
