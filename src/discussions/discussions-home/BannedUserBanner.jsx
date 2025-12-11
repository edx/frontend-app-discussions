import React from 'react';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';

import './BannedUserBanner.scss';

const BannedUserBanner = () => {
  const intl = useIntl();

  return (
    <div
      data-testid="banned-user-banner"
      className="banned-user-banner"
      role="alert"
      aria-live="polite"
    >
      {intl.formatMessage(messages.bannedUserBannerMessage)}
    </div>
  );
};

export default BannedUserBanner;
