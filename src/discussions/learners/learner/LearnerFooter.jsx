import React from 'react';
import PropTypes from 'prop-types';

import { Icon, OverlayTrigger, Tooltip } from '@openedx/paragon';
import {
  DeleteOutline, Edit, QuestionAnswerOutline, Report, ReportGmailerrorred,
} from '@openedx/paragon/icons';
import { useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';

import { selectUserHasModerationPrivileges, selectUserIsGroupTa, selectUserIsStaff } from '../../data/selectors';
import messages from '../messages';

const LearnerFooter = ({
  inactiveFlags, activeFlags, threads, responses, replies, username,
  deletedCount, deletedThreads, deletedResponses, deletedReplies,
}) => {
  const intl = useIntl();
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const userIsGroupTa = useSelector(selectUserIsGroupTa);
  const userIsStaff = useSelector(selectUserIsStaff);
  const canSeeLearnerReportedStats = (activeFlags || inactiveFlags) && (userHasModerationPrivileges || userIsGroupTa);
  const canSeeDeletedStats = userHasModerationPrivileges || userIsGroupTa || userIsStaff;

  // Calculate active counts (total - deleted)
  const activeThreads = (threads || 0) - (deletedThreads || 0);
  const activeResponses = (responses || 0) - (deletedResponses || 0);
  const activeReplies = (replies || 0) - (deletedReplies || 0);
  const totalActive = activeThreads + activeResponses + activeReplies;

  return (
    <div className="d-flex align-items-center pt-1 mt-2.5" style={{ marginBottom: '2px' }}>
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
        <div className="d-flex align-items-center">
          <Icon src={QuestionAnswerOutline} className="icon-size mr-2" />
          {totalActive}
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
        <div className="d-flex align-items-center">
          <Icon src={Edit} className="icon-size mr-2 ml-4" />
          {activeThreads}
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
          <div className="d-flex align-items-center">
            <Icon src={DeleteOutline} className="icon-size mr-2 ml-4" />
            {deletedCount || 0}
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
          <div className="d-flex align-items-center">
            <Icon src={activeFlags ? Report : ReportGmailerrorred} className="icon-size mr-2 ml-4 text-danger" />
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
  deletedCount: PropTypes.number,
  deletedThreads: PropTypes.number,
  deletedResponses: PropTypes.number,
  deletedReplies: PropTypes.number,
};

LearnerFooter.defaultProps = {
  inactiveFlags: 0,
  activeFlags: 0,
  threads: 0,
  responses: 0,
  replies: 0,
  username: '',
  deletedCount: 0,
  deletedThreads: 0,
  deletedResponses: 0,
  deletedReplies: 0,
};

export default React.memo(LearnerFooter);
