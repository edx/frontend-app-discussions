import React from 'react';

import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';

import DiscussionContext from '../../../common/context';
import Reply from './Reply';

let mockReplyData;

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@openedx/paragon', () => ({
  Avatar: 'Avatar',
  useToggle: jest.fn(() => [false, jest.fn(), jest.fn()]),
}));

jest.mock('@openedx/paragon/icons', () => ({
  DeleteOutline: 'DeleteOutline',
}));

jest.mock('../../../../components/HTMLLoader', () => 'HTMLLoader');
jest.mock('./CommentEditor', () => 'CommentEditor');

jest.mock('../../../common', () => ({
  ActionsDropdown: 'ActionsDropdown',
  AlertBanner: 'AlertBanner',
  AuthorLabel: 'AuthorLabel',
  AutoSpamAlertBanner: 'AutoSpamAlertBanner',
  Confirmation: 'Confirmation',
  DeletedByBanner: () => <div className="deleted-content-icon" />,
}));

jest.mock('../../../posts/post/DeleteWithBanConfirmation', () => 'DeleteWithBanConfirmation');

jest.mock('../../data/selectors', () => ({
  selectCommentOrResponseById: jest.fn(() => () => mockReplyData),
}));

jest.mock('../../../posts/data/selectors', () => ({
  selectAuthorAvatar: jest.fn(() => () => ({ imageUrlSmall: '' })),
}));

jest.mock('../../../data/hooks', () => ({
  useAlertBannerVisible: jest.fn(() => false),
}));

jest.mock('../../../data/selectors', () => ({
  selectIsUserBanned: jest.fn(() => false),
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  logError: jest.fn(),
}));

const baseReply = {
  id: 'reply-1',
  abuseFlagged: false,
  author: 'reply-author',
  authorLabel: 'staff',
  endorsed: false,
  lastEdit: null,
  closed: false,
  closedBy: null,
  closeReason: null,
  createdAt: '2025-01-01T00:00:00Z',
  threadId: 'post-1',
  parentId: 'comment-1',
  rawBody: 'Reply body',
  renderedBody: '<p>Reply body</p>',
  editByLabel: null,
  closedByLabel: null,
  isDeleted: false,
  deletedBy: null,
  deletedByLabel: null,
  is_spam: false,
};

const renderReply = (replyOverrides = {}) => {
  mockReplyData = { ...baseReply, ...replyOverrides };

  return render(
    <IntlProvider locale="en">
      <DiscussionContext.Provider
        value={{
          courseId: 'course-v1:edX+DemoX+Demo_Course',
          enableDiscussionBan: true,
        }}
      >
        <Reply responseId="reply-1" />
      </DiscussionContext.Provider>
    </IntlProvider>,
  );
};

describe('Reply deleted-by banner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(jest.fn());
    useSelector.mockImplementation(selector => (typeof selector === 'function' ? selector({}) : selector));
  });

  it('renders deleted-by banner when isDeleted=true and deletedBy is present', () => {
    const { container } = renderReply({ isDeleted: true, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(container.querySelector('.deleted-content-icon')).toBeInTheDocument();
  });

  it('does not render deleted-by banner when isDeleted=false', () => {
    const { container } = renderReply({ isDeleted: false, deletedBy: 'deleted-mod', deletedByLabel: 'staff' });

    expect(container.querySelector('.deleted-content-icon')).not.toBeInTheDocument();
  });
});
