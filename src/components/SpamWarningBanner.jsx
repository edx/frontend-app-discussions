import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageBanner } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../discussions/messages';

const SPAM_WARNING_DISMISSED_KEY = 'discussions.spamWarningDismissed';

const SpamWarningBanner = ({ className = '' }) => {
  const intl = useIntl();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(SPAM_WARNING_DISMISSED_KEY);
      setIsDismissed(dismissed === 'true');
    } catch (e) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(SPAM_WARNING_DISMISSED_KEY, 'true');
      setIsDismissed(true);
    } catch (e) {
      setIsDismissed(true);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <PageBanner
      variant="warning"
      show={!isDismissed}
      dismissible={false}
      className={`spam-warning-banner ${className}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <span>
          <strong>{intl.formatMessage(messages.spamWarningHeading)}:</strong> {intl.formatMessage(messages.spamWarningMessage)}
        </span>
        <button
          type="button"
          onClick={handleDismiss}
          className="spam-warning-close-btn"
          aria-label="Close warning"
        >
          ×
        </button>
      </div>
    </PageBanner>
  );
};

SpamWarningBanner.propTypes = {
  className: PropTypes.string,
};

export default SpamWarningBanner;