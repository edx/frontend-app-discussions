import React from 'react';
import PropTypes from 'prop-types';

import { Icon, OverlayTrigger, Tooltip } from '@openedx/paragon';
import {
  DeleteOutline, Edit, QuestionAnswerOutline, Report, ReportGmailerrorred,
} from '@openedx/paragon/icons';
import { useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';

import { PostsStatusFilter, ThreadType } from '../../../data/constants';
import { selectUserHasModerationPrivileges, selectUserIsGroupTa, selectUserIsStaff } from '../../data/selectors';
import messages from '../messages';

const LearnerFooter = ({
  inactiveFlags, activeFlags, threads, responses, replies, username,
  deletedThreads, deletedResponses, deletedReplies, onFilterClick,
}) => {
  const intl = useIntl();
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const userIsGroupTa = useSelector(selectUserIsGroupTa);
  const userIsStaff = useSelector(selectUserIsStaff);
  const canSeeLearnerReportedStats = (activeFlags || inactiveFlags) && (userHasModerationPrivileges || userIsGroupTa);
  const canSeeDeletedStats = userHasModerationPrivileges || userIsGroupTa || userIsStaff;

  // Calculate deleted count (sum of all deleted content)
  const totalDeletedCount = (deletedThreads || 0) + (deletedResponses || 0) + (deletedReplies || 0);

  // Shared styles for icon containers
  const iconContainerStyle = { minWidth: 0 };
  const iconStyle = { flexShrink: 0 };

  // Click handlers for filtering
  const handleAllActivityClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilterClick) {
      onFilterClick({
        postType: ThreadType.ALL,
        status: PostsStatusFilter.ALL,
        contentStatus: PostsStatusFilter.ACTIVE,
      });
    }
  };

  const handlePostsClick = (e) => {
    handleAllActivityClick(e);
  };

  const handleDeletedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilterClick) {
      onFilterClick({
        postType: ThreadType.ALL,
        status: PostsStatusFilter.ALL,
        contentStatus: PostsStatusFilter.DELETED,
      });
    }
  };

  const handleReportedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilterClick) {
      onFilterClick({
        postType: ThreadType.ALL,
        status: PostsStatusFilter.REPORTED,
        contentStatus: PostsStatusFilter.ACTIVE,
      });
    }
  };

  return (
    <div className="d-flex align-items-center pt-1 mt-2.5" style={{ marginBottom: '2px', gap: '1rem' }}>
      <OverlayTrigger
        placement="right"
        id={`learner-${username}-responses`}
        overlay={(
          <Tooltip id={`learner-${username}-responses`}>
            <div className="d-flex flex-column align-items-start">
              {intl.formatMessage(messages.allActivity)}
            </div>
          </Tooltip>
        )}
      >
        <div
          className="d-flex align-items-center flex-shrink-1"
          style={{ ...iconContainerStyle, cursor: 'pointer' }}
          onClick={handleAllActivityClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAllActivityClick(e);
            }
          }}
        >
          <Icon src={QuestionAnswerOutline} className="icon-size mr-2" style={iconStyle} />
          {threads + responses + replies}
        </div>
      </OverlayTrigger>
      <OverlayTrigger
        placement="right"
        id={`learner-${username}-posts`}
        overlay={(
          <Tooltip id={`learner-${username}-posts`}>
            <div className="d-flex flex-column align-items-start">
              {intl.formatMessage(messages.posts)}
            </div>
          </Tooltip>
        )}
      >
        <div
          className="d-flex align-items-center flex-shrink-1"
          style={{ ...iconContainerStyle, cursor: 'pointer' }}
          onClick={handlePostsClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePostsClick(e);
            }
          }}
        >
          <Icon src={Edit} className="icon-size mr-2" style={iconStyle} />
          {threads}
        </div>
      </OverlayTrigger>
      {Boolean(canSeeDeletedStats) && (
        <OverlayTrigger
          placement="right"
          id={`learner-${username}-deleted`}
          overlay={(
            <Tooltip id={`learner-${username}-deleted`}>
              <div className="d-flex flex-column align-items-start">
                {intl.formatMessage(messages.deletedActivity)}
              </div>
            </Tooltip>
          )}
        >
          <div
            className="d-flex align-items-center flex-shrink-1"
            style={{ ...iconContainerStyle, cursor: 'pointer' }}
            onClick={handleDeletedClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDeletedClick(e);
              }
            }}
          >
            <Icon src={DeleteOutline} className="icon-size mr-2" style={iconStyle} />
            {totalDeletedCount}
          </div>
        </OverlayTrigger>
      )}
      {Boolean(canSeeLearnerReportedStats) && (
        <OverlayTrigger
          placement="right"
          id={`learner-${username}-flags`}
          overlay={(
            <Tooltip id={`learner-${username}-flags`}>
              <div className="d-flex flex-column align-items-start">
                {Boolean(activeFlags)
                  && (
                  <span>
                    {intl.formatMessage(messages.reported, { reported: activeFlags })}
                  </span>
                  )}
                {Boolean(inactiveFlags)
                      && (
                        <span>
                          {intl.formatMessage(messages.previouslyReported, { previouslyReported: inactiveFlags })}
                        </span>
                      )}
              </div>
            </Tooltip>
          )}
        >
          <div
            className="d-flex align-items-center flex-shrink-1"
            style={{ ...iconContainerStyle, cursor: 'pointer' }}
            onClick={handleReportedClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleReportedClick(e);
              }
            }}
          >
            <Icon src={activeFlags ? Report : ReportGmailerrorred} className="icon-size mr-2 text-danger" style={iconStyle} />
            {activeFlags} {Boolean(inactiveFlags) && `/ ${inactiveFlags}`}
          </div>
        </OverlayTrigger>
      )}
    </div>
  );
};

LearnerFooter.propTypes = {
  inactiveFlags: PropTypes.number,
  activeFlags: PropTypes.number,
  threads: PropTypes.number,
  responses: PropTypes.number,
  replies: PropTypes.number,
  username: PropTypes.string,
  deletedThreads: PropTypes.number,
  deletedResponses: PropTypes.number,
  deletedReplies: PropTypes.number,
  onFilterClick: PropTypes.func,
};

LearnerFooter.defaultProps = {
  inactiveFlags: 0,
  activeFlags: 0,
  threads: 0,
  responses: 0,
  replies: 0,
  username: '',
  deletedThreads: 0,
  deletedResponses: 0,
  deletedReplies: 0,
  onFilterClick: null,
};

export default React.memo(LearnerFooter);
