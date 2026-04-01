import React, { useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { Icon, OverlayTrigger, Tooltip } from '@openedx/paragon';
import { Block } from '@openedx/paragon/icons';
import classNames from 'classnames';
import { generatePath, Link } from 'react-router-dom';
import * as timeago from 'timeago.js';

import { useIntl } from '@edx/frontend-platform/i18n';

import { Routes } from '../../data/constants';
import { useLearnerStatus } from '../data/hooks/useLearnerStatus';
import messages from '../messages';
import { getAuthorLabel } from '../utils';
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
  const { icon, authorLabelMessage } = useMemo(
    () => getAuthorLabel(intl, authorLabel),
    [authorLabel, intl],
  );
  const { isNewLearner, isRegularLearner } = useLearnerStatus(
    postData,
    author,
    authorLabel,
  );

  const isRetiredUser = author ? author.startsWith('retired__user') : false;
  const showTextPrimary = !authorLabelMessage && !isRetiredUser && !alert;
  const className = classNames(
    'd-flex align-items-center',
    { 'mb-0.5': !postOrComment },
    labelColor,
  );

  // Check if user is banned from postData
  const isAuthorBanned = postData?.is_author_banned || postData?.isAuthorBanned || false;

  const showUserNameAsLink = (
    linkToProfile
    && author
    && author !== intl.formatMessage(messages.anonymous)
    && !enableInContextSidebar
  );
  const canDisplayLearnerRole = Boolean(
    author
    && !isRetiredUser
    && author !== intl.formatMessage(messages.anonymous),
  );

  const hasRecognizedAuthorRole = Boolean(authorLabelMessage && icon);

  const authorName = useMemo(
    () => (
      <span
        className={classNames('mr-1.5 font-style font-weight-500 author-name', {
          'text-gray-700': isRetiredUser || !author,
          'text-primary-500': !authorLabelMessage && !isRetiredUser && author,
        })}
        role="heading"
        aria-level="2"
      >
        {isRetiredUser ? '[Deactivated]' : (author || '[Deleted User]')}
      </span>
    ),
    [author, authorLabelMessage, isRetiredUser],
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
    if (isNewLearner) {
      return createLearnerMessage('newLearnerMessage');
    }
    if (isRegularLearner) {
      return createLearnerMessage('learnerMessage');
    }
    return null;
  }, [isNewLearner, isRegularLearner, createLearnerMessage]);

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
      if (hasRecognizedAuthorRole) {
        return (
          <OverlayTrigger
            placement={authorToolTip ? 'top' : 'right'}
            overlay={(
              <Tooltip
                id={
                  authorToolTip
                    ? `endorsed-by-${author}-tooltip`
                    : `${authorLabel}-label-tooltip`
                }
              >
                <>
                  {authorToolTip ? author : authorLabel}
                  <br />
                  {intl.formatMessage(messages.authorAdminDescription)}
                </>
              </Tooltip>
            )}
            trigger={['hover', 'focus']}
          >
            <div className={classNames('d-flex flex-row align-items-center')}>
              <Icon
                style={{
                  width: '1rem',
                  height: '1rem',
                }}
                src={icon}
                data-testid="author-icon"
              />
              <span
                className={classNames('mr-1.5 font-style font-weight-500', {
                  'text-primary-500': showTextPrimary,
                  'text-gray-700': isRetiredUser,
                })}
                style={{ marginLeft: '2px' }}
              >
                {authorLabelMessage}
              </span>
            </div>
          </OverlayTrigger>
        );
      }

      if (canDisplayLearnerRole) {
        return (
          <span
            className={classNames('font-style font-weight-400', {
              'text-white': alert,
              'text-gray-600': !alert,
            })}
            style={{ fontSize: '12px', lineHeight: '16px' }}
          >
            {intl.formatMessage(messages.learnerMessage)}
          </span>
        );
      }

      return null;
    },
    [
      author,
      authorLabel,
      authorLabelMessage,
      authorToolTip,
      canDisplayLearnerRole,
      hasRecognizedAuthorRole,
      icon,
      intl,
      isRetiredUser,
      showTextPrimary,
      alert,
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
        <div className={classNames('d-flex align-items-center flex-nowrap', labelColor)}>
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
      <div className="d-flex flex-column w-100">
        <div className={classNames('d-flex align-items-center', labelColor)}>
          {learnerPostsLink}
          {timestamp}
        </div>
        <div className={classNames('d-flex align-items-center', labelColor)}>
          {roleContents}
          {bannedIndicator}
        </div>
        {postOrComment && learnerMessageComponent}
      </div>
    </div>
  ) : (
    <div className={`${className} flex-wrap`}>
      <div className="d-flex flex-column w-100">
        <div className={classNames('d-flex align-items-center', labelColor)}>
          {authorName}
          {timestamp}
        </div>
        <div className={classNames('d-flex align-items-center', labelColor)}>
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
  authorLabel: PropTypes.string,
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
