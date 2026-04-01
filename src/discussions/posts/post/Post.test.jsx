import React from 'react';

import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';

import DiscussionContext from '../../common/context';
import Post from './Post';

let mockThreadData;
const mockHoverCard = jest.fn(() => <div data-testid="hover-card-mock" />);

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: () => jest.fn(),
}));

jest.mock('@openedx/paragon/icons', () => ({
  DeleteOutline: 'DeleteOutline',
}));

jest.mock('../../../components/HTMLLoader', () => 'HTMLLoader');
jest.mock('../../common/HoverCard', () => (props) => mockHoverCard(props));
jest.mock('./ClosePostReasonModal', () => 'ClosePostReasonModal');
jest.mock('./PostFooter', () => 'PostFooter');
jest.mock('./PostHeader', () => 'PostHeader');

jest.mock('../../common', () => ({
  AlertBanner: 'AlertBanner',
  AuthorLabel: 'AuthorLabel',
  AutoSpamAlertBanner: 'AutoSpamAlertBanner',
  BanModerationModals: 'BanModerationModals',
  Confirmation: 'Confirmation',
  DeletedByBanner: () => <div className="deleted-content-icon" />,
  MuteModalManager: 'MuteModalManager',
}));

jest.mock('../../common/withPostingRestrictions', () => Component => Component);

jest.mock('../data/selectors', () => ({
  selectThread: jest.fn(() => () => mockThreadData),
}));

jest.mock('../../topics/data/selectors', () => ({
  selectTopic: jest.fn(() => () => null),
}));

jest.mock('../../../data/selectors', () => ({
  selectorForUnitSubsection: jest.fn(() => null),
  selectTopicContext: jest.fn(() => null),
}));

jest.mock('../../data/selectors', () => ({
  selectContentCreationRateLimited: jest.fn(() => false),
  selectIsUserBanned: jest.fn(() => false),
  selectShouldShowEmailConfirmation: jest.fn(() => false),
  selectUserHasModerationPrivileges: jest.fn(() => true),
}));

jest.mock('../../utils', () => ({
  useActions: jest.fn(() => []),
}));

jest.mock('@edx/frontend-platform', () => ({
  ensureConfig: jest.fn(),
  getConfig: jest.fn(() => ({ BASE_URL: 'http://localhost:18000' })),
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  logError: jest.fn(),
}));

const baseThread = {
  topicId: 'topic-1',
  abuseFlagged: false,
  closed: false,
  pinned: false,
  voted: false,
  hasEndorsed: false,
  following: false,
  closedBy: null,
  voteCount: 0,
  groupId: null,
  groupName: null,
  closeReason: null,
  authorLabel: 'staff',
  type: 'discussion',
  author: 'post-author',
  title: 'Test Post',
  createdAt: '2025-01-01T00:00:00Z',
  renderedBody: '<p>Body</p>',
  lastEdit: null,
  editByLabel: null,
  closedByLabel: null,
  users: {},
  isDeleted: false,
  deletedBy: null,
  deletedByLabel: null,
  is_spam: false,
};

const renderPost = (threadOverrides = {}) => {
  mockThreadData = { ...baseThread, ...threadOverrides };

  return render(
    <IntlProvider locale="en">
      <MemoryRouter>
        <DiscussionContext.Provider
          value={{
            enableInContextSidebar: false,
            postId: 'post-1',
            courseId: 'course-v1:edX+DemoX+Demo_Course',
          }}
        >
          <Post
            handleAddResponseButton={jest.fn()}
            openRestrictionDialogue={jest.fn()}
          />
        </DiscussionContext.Provider>
      </MemoryRouter>
    </IntlProvider>,
  );
};

describe('Post deleted-by banner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(jest.fn());
    useSelector.mockImplementation((selector) => {
      const mockState = {
        config: { enableDiscussionBan: true },
      };
      return typeof selector === 'function' ? selector(mockState) : selector;
    });
    useLocation.mockReturnValue({ pathname: '/course/post-1', search: '' });
  });

  it('renders deleted-by banner when isDeleted=true and deletedBy is present', () => {
    const { container } = renderPost({ isDeleted: true, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(container.querySelector('.deleted-content-icon')).toBeInTheDocument();
  });

  it('passes isDeleted to HoverCard for deleted posts', () => {
    renderPost({ isDeleted: true, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(mockHoverCard).toHaveBeenCalled();
    expect(mockHoverCard.mock.calls[0][0]).toEqual(expect.objectContaining({ isDeleted: true }));
  });

  it('does not render deleted-by banner when isDeleted=false', () => {
    const { container } = renderPost({ isDeleted: false, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(container.querySelector('.deleted-content-icon')).not.toBeInTheDocument();
  });
});
