import React, { useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { Icon, OverlayTrigger, Tooltip } from '@openedx/paragon';
import { Block, RemoveCircleOutline } from '@openedx/paragon/icons';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { generatePath, Link } from 'react-router-dom';
import * as timeago from 'timeago.js';

import { useIntl } from '@edx/frontend-platform/i18n';

import { AvatarOutlineAndLabelColors, Routes } from '../../data/constants';
import { useLearnerStatus } from '../data/hooks/useLearnerStatus';
import messages from '../messages';
import { getAuthorLabel, getAuthorLabels } from '../utils';
import DiscussionContext from './context';
import timeLocale from './time-locale';

const AuthorLabel = ({
  author,
  authorLabel = null,
  linkToProfile = false,
  labelColor = '',
  alert = false,
  postCreatedAt = null,
  authorToolTip = false,
  postOrComment = false,
  singleLine = false,
  roleBeforeTimestamp = false,
  postData = null, // Thread or comment data from API containing is_new_learner field
}) => {
  timeago.register('time-locale', timeLocale);
  const intl = useIntl();
  const { courseId, enableInContextSidebar } = useContext(DiscussionContext);
  const { authorLabelMessage } = useMemo(
    () => getAuthorLabel(intl, authorLabel),
    [authorLabel, intl],
  );
  // All matched roles for multi-role display
  const authorRolesList = useMemo(
    () => getAuthorLabels(intl, authorLabel),
    [authorLabel, intl],
  );
  const { isNewLearner, isRegularLearner } = useLearnerStatus(
    postData,
    author,
    authorLabel,
  );

  // Check if the author is muted by the current user
  const personalMutedUsers = useSelector(state => state.learners?.mutedUsers?.personal || []);
  const courseWideMutedUsers = useSelector(state => state.learners?.mutedUsers?.course || []);
  const isMuted = useMemo(() => {
    if (!author) { return false; }
    return personalMutedUsers.includes(author) || courseWideMutedUsers.includes(author);
  }, [author, personalMutedUsers, courseWideMutedUsers]);

  // For multi-role display, avoid applying one shared color to the whole row.
  const appliedLabelColor = authorRolesList.length > 1 ? '' : labelColor;

  const isRetiredUser = author ? author.startsWith('retired__user') : false;
  const className = classNames(
    'd-flex align-items-center',
    { 'mb-0.5': !postOrComment },
    appliedLabelColor,
  );

  // Check if user is banned from postData
  const isAuthorBanned = postData?.is_author_banned || postData?.isAuthorBanned || false;

  const showUserNameAsLink = (
    linkToProfile
    && author
    && author !== intl.formatMessage(messages.anonymous)
    && !enableInContextSidebar
  );

  const authorName = useMemo(
    () => (
      <span
        className={classNames('mr-1.5 font-style font-weight-500 author-name', {
          'text-gray-700': isRetiredUser || !author,
          'text-primary-500': !authorLabelMessage && !isRetiredUser && author,
          [labelColor]: !!authorLabelMessage && !isRetiredUser && author && !!labelColor,
        })}
        role="heading"
        aria-level="2"
      >
        {isRetiredUser ? '[Deactivated]' : (author || '[Deleted User]')}
      </span>
    ),
    [author, authorLabelMessage, isRetiredUser, labelColor],
  );

  const createLearnerMessage = useCallback(
    (messageKey) => (
      <span
        className="text-gray-600 mt-0.5"
        style={{ fontSize: '12px', fontWeight: '400', lineHeight: '16px' }}
      >
        {intl.formatMessage(messages[messageKey])}
      </span>
    ),
    [intl],
  );

  const learnerMessageComponent = useMemo(() => {
    let learnerMessage = null;

    if (isNewLearner) {
      learnerMessage = createLearnerMessage('newLearnerMessage');
    } else if (isRegularLearner) {
      learnerMessage = createLearnerMessage('learnerMessage');
    }

    if (!learnerMessage && !isMuted) {
      return null;
    }

    return (
      <div className="d-flex align-items-center mt-0.5">
        {learnerMessage}
        {isMuted && (
          <OverlayTrigger
            placement="top"
            overlay={(
              <Tooltip id={`muted-${author}-tooltip`}>
                {intl.formatMessage(messages.mutedUser)}
              </Tooltip>
            )}
            trigger={['hover', 'focus']}
          >
            <div className="d-flex align-items-center ml-1.5">
              <Icon
                style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  fill: 'currentColor',
                  stroke: 'currentColor',
                }}
                src={RemoveCircleOutline}
                className="text-gray-600"
                data-testid="muted-badge-icon"
              />
              <span
                className="text-gray-600 ml-0.5"
                style={{ fontSize: '12px', fontWeight: '400', lineHeight: '16px' }}
              >
                {intl.formatMessage(messages.muted)}
              </span>
            </div>
          </OverlayTrigger>
        )}
      </div>
    );
  }, [isNewLearner, isRegularLearner, isMuted, createLearnerMessage, author, intl]);

  // Banned indicator - shown for all users (learners and staff)
  const bannedIndicator = useMemo(
    () => isAuthorBanned && (
      <span
        className="d-flex align-items-center ml-1 text-danger-500"
        style={{ fontSize: '12px', fontWeight: '500' }}
        data-testid="banned-label"
      >
        <Icon
          src={Block}
          style={{
            width: '0.75rem',
            height: '0.75rem',
            marginRight: '4px',
          }}
        />
        {intl.formatMessage(messages.authorLabelBanned)}
      </span>
    ),
    [isAuthorBanned, intl],
  );

  const roleContents = useMemo(
    () => {
      if (authorRolesList.length > 0) {
        const firstRole = authorRolesList[0].role;

        return (
          <OverlayTrigger
            placement={authorToolTip ? 'top' : 'right'}
            overlay={(
              <Tooltip
                id={
                  authorToolTip
                    ? `endorsed-by-${author}-tooltip`
                    : `${firstRole.toLowerCase().replace(/\s+/g, '-')}-label-tooltip`
                }
              >
                <>
                  {authorToolTip
                    ? author
                    : authorRolesList.map(role => role.authorLabelMessage).join(', ')}
                  <br />
                  {intl.formatMessage(messages.authorAdminDescription)}
                </>
              </Tooltip>
            )}
            trigger={['hover', 'focus']}
          >
            <div className="d-flex flex-row align-items-center author-role-label">
              {authorRolesList.map((roleEntry, index) => (
                <React.Fragment key={roleEntry.role}>
                  {index > 0 && (
                    <span className="font-style font-weight-500" style={{ margin: '0 2px' }}>,</span>
                  )}
                  <span
                    className={classNames(
                      'd-flex flex-row align-items-center',
                      AvatarOutlineAndLabelColors[roleEntry.role]
                      && `text-${AvatarOutlineAndLabelColors[roleEntry.role]}`,
                    )}
                  >
                    <Icon
                      style={{
                        width: '1rem',
                        height: '1rem',
                        flexShrink: 0,
                        marginLeft: index === 0 ? '0' : '2px',
                      }}
                      src={roleEntry.icon}
                      data-testid="author-icon"
                    />
                    <span
                      className="font-style font-weight-500"
                      style={{
                        marginLeft: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {roleEntry.authorLabelMessage}
                    </span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          </OverlayTrigger>
        );
      }

      return null;
    },
    [
      author,
      authorRolesList,
      authorToolTip,
      intl,
    ],
  );

  const timestamp = useMemo(() => (
    postCreatedAt ? (
      <span
        title={postCreatedAt}
        className={classNames('align-content-center post-summary-timestamp ml-1', {
          'text-white': alert,
          'text-gray-500': !alert,
        })}
        style={{ lineHeight: '20px', fontSize: '12px' }}
      >
        {timeago.format(postCreatedAt, 'time-locale')}
      </span>
    ) : null
  ), [postCreatedAt, alert]);

  const learnerPostsLink = author ? (
    <Link
      data-testid="learner-posts-link"
      id="learner-posts-link"
      to={generatePath(Routes.LEARNERS.POSTS, { learnerUsername: author, courseId })}
      className="text-decoration-none text-reset"
      style={{ width: 'fit-content' }}
    >
      {!alert && authorName}
    </Link>
  ) : (
    <span style={{ width: 'fit-content' }}>
      {!alert && authorName}
    </span>
  );

  if (singleLine) {
    return (
      <div className={className}>
        <div className={classNames('d-flex align-items-center flex-nowrap', appliedLabelColor)} style={{ minWidth: 0, overflow: 'hidden' }}>
          {showUserNameAsLink ? learnerPostsLink : authorName}
          {roleBeforeTimestamp && roleContents}
          {timestamp}
          {!roleBeforeTimestamp && roleContents}
          {bannedIndicator}
        </div>
      </div>
    );
  }

  return showUserNameAsLink ? (
    <div className={`${className} flex-wrap`}>
      <div className="d-flex flex-column w-100" style={{ minWidth: 0 }}>
        <div className={classNames('d-flex align-items-center', appliedLabelColor)} style={{ minWidth: 0, overflow: 'hidden' }}>
          {learnerPostsLink}
          {timestamp}
        </div>
        <div className={classNames('d-flex align-items-center', appliedLabelColor)} style={{ minWidth: 0, overflow: 'hidden' }}>
          {roleContents}
          {bannedIndicator}
        </div>
        {postOrComment && learnerMessageComponent}
      </div>
    </div>
  ) : (
    <div className={`${className} flex-wrap`}>
      <div className="d-flex flex-column w-100" style={{ minWidth: 0 }}>
        <div className={classNames('d-flex align-items-center', appliedLabelColor)} style={{ minWidth: 0, overflow: 'hidden' }}>
          {authorName}
          {timestamp}
        </div>
        <div className={classNames('d-flex align-items-center', appliedLabelColor)} style={{ minWidth: 0, overflow: 'hidden' }}>
          {roleContents}
          {bannedIndicator}
        </div>
        {postOrComment && learnerMessageComponent}
      </div>
    </div>
  );
};

AuthorLabel.propTypes = {
  author: PropTypes.string,
  authorLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  linkToProfile: PropTypes.bool,
  labelColor: PropTypes.string,
  alert: PropTypes.bool,
  postCreatedAt: PropTypes.string,
  authorToolTip: PropTypes.bool,
  postOrComment: PropTypes.bool,
  singleLine: PropTypes.bool,
  roleBeforeTimestamp: PropTypes.bool,
  postData: PropTypes.shape({
    is_new_learner: PropTypes.bool,
    is_regular_learner: PropTypes.bool,
  }), // Thread or comment data from API
};

AuthorLabel.defaultProps = {
  author: null,
  authorLabel: null,
  linkToProfile: false,
  labelColor: '',
  alert: false,
  postCreatedAt: null,
  authorToolTip: false,
  postOrComment: false,
  singleLine: false,
  roleBeforeTimestamp: false,
  postData: null,
};

export default React.memo(AuthorLabel);
