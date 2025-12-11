import React from 'react';
import PropTypes from 'prop-types';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './messages';

/**
 * AuditTrailInfo component displays ban audit information
 * Shows who banned the user, when, and the scope (course-wide or org-wide)
 * Only visible to staff members
 */
const AuditTrailInfo = ({ bannedByUsername, bannedAt, scope }) => {
  const intl = useIntl();

  if (!bannedByUsername || !bannedAt) {
    return null;
  }

  const scopeText = intl.formatMessage(messages.auditTrailBanScope, { scope });

  // Format the date and time in the viewer's local timezone
  const bannedDate = new Date(bannedAt);
  const formattedDate = intl.formatDate(bannedDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = intl.formatTime(bannedDate, {
    hour: 'numeric',
    minute: 'numeric',
  });

  return (
    <div
      className="audit-trail-info bg-warning-100 border border-warning-500 p-3 mb-3"
      data-testid="audit-trail-info"
    >
      <div className="font-weight-bold mb-2">
        {intl.formatMessage(messages.auditTrailInfoTitle)}
      </div>
      <div className="mb-2">
        Banned by {bannedByUsername}, <span className="text-lowercase">{scopeText}</span>, on {formattedDate} at {formattedTime}
      </div>
      <div className="small text-muted">
        {intl.formatMessage(messages.auditTrailStaffOnly)}
      </div>
    </div>
  );
};

AuditTrailInfo.propTypes = {
  bannedByUsername: PropTypes.string,
  bannedAt: PropTypes.string,
  scope: PropTypes.oneOf(['course', 'organization']),
};

AuditTrailInfo.defaultProps = {
  bannedByUsername: null,
  bannedAt: null,
  scope: null,
};

export default AuditTrailInfo;
