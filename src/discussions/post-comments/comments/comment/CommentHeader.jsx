import React from 'react';
import PropTypes from 'prop-types';

import { Avatar, Badge } from '@openedx/paragon';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';

import { AvatarOutlineAndLabelColors } from '../../../../data/constants';
import { AuthorLabel } from '../../../common';
import { useAlertBannerVisible } from '../../../data/hooks';
import { selectAuthorAvatar } from '../../../posts/data/selectors';
import messages from '../../messages';

const CommentHeader = ({
  author,
  authorLabel,
  abuseFlagged,
  closed,
  createdAt,
  lastEdit,
  postUsers,
  isDeleted,
  parentId,
  postIsDeleted,
}) => {
  const intl = useIntl();
  const colorClass = AvatarOutlineAndLabelColors[authorLabel];
  const hasAnyAlert = useAlertBannerVisible({
    author,
    abuseFlagged,
    lastEdit,
    closed,
  });
  const authorAvatar = useSelector(selectAuthorAvatar(author));

  const profileImage = getConfig()?.ENABLE_PROFILE_IMAGE === 'true'
    ? Object.values(postUsers ?? {})[0]?.profile?.image
    : null;

  // Determine which deleted badge to show based on priority rules
  // Priority: Deleted Post > Deleted Response > Deleted Comment
  const shouldShowDeletedBadge = isDeleted && !postIsDeleted; // Don't show if post is already deleted
  const isResponse = !parentId; // Response has no parentId, comment has parentId
  const deletedBadgeMessage = isResponse
    ? messages.deletedResponse
    : messages.deletedComment;

  return (
    <div className={classNames('d-flex flex-row justify-content-between', {
      'mt-2': hasAnyAlert,
    })}
    >
      <div className="align-items-center d-flex flex-row flex-wrap">
        <Avatar
          className={`border-0 ml-0.5 mr-2.5 ${colorClass ? `outline-${colorClass}` : 'outline-anonymous'}`}
          alt={author}
          src={profileImage?.hasImage ? profileImage?.imageUrlSmall : authorAvatar}
          style={{
            width: '32px',
            height: '32px',
          }}
        />
        <AuthorLabel
          author={author}
          authorLabel={authorLabel}
          labelColor={colorClass && `text-${colorClass}`}
          linkToProfile
          postCreatedAt={createdAt}
          postOrComment
        />
        {shouldShowDeletedBadge && (
          <Badge
            variant="light"
            data-testid="deleted-comment-badge"
            className="font-weight-500 ml-2 bg-light-400 text-dark"
          >
            {intl.formatMessage(deletedBadgeMessage)}
            <span className="sr-only">{' '}deleted {isResponse ? 'response' : 'comment'}</span>
          </Badge>
        )}
      </div>
    </div>
  );
};

CommentHeader.propTypes = {
  author: PropTypes.string.isRequired,
  authorLabel: PropTypes.string,
  abuseFlagged: PropTypes.bool.isRequired,
  closed: PropTypes.bool,
  createdAt: PropTypes.string.isRequired,
  lastEdit: PropTypes.shape({
    editorUsername: PropTypes.string,
    reason: PropTypes.string,
  }),
  postUsers: PropTypes.shape({}).isRequired,
  isDeleted: PropTypes.bool,
  parentId: PropTypes.string,
  postIsDeleted: PropTypes.bool,
};

CommentHeader.defaultProps = {
  authorLabel: null,
  closed: undefined,
  lastEdit: null,
  isDeleted: false,
  parentId: null,
  postIsDeleted: false,
};

export default React.memo(CommentHeader);
