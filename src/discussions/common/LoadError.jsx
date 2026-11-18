import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import { Button } from '@openedx/paragon';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';

/**
 * Shown in place of a list whose request failed, so a failure is not mistaken
 * for an empty list ("No responses", or a blank posts list).
 */
const LoadError = ({ message, onRetry }) => {
  const intl = useIntl();
  const [isRetrying, setIsRetrying] = useState(false);

  // Disabled until the retry settles, so repeated clicks don't queue requests.
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  return (
    <div className="d-flex flex-column align-items-center text-center mx-4 my-3" role="alert">
      <span className="text-gray-700 mb-2">{intl.formatMessage(message)}</span>
      <Button variant="outline-primary" size="sm" onClick={handleRetry} disabled={isRetrying}>
        {intl.formatMessage(messages.loadErrorRetry)}
      </Button>
    </div>
  );
};

LoadError.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    defaultMessage: PropTypes.string,
  }).isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default React.memo(LoadError);
