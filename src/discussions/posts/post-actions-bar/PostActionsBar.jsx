import React from 'react';

import { useDispatch } from 'react-redux';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Button, SearchField } from '@edx/paragon';

import { setSearchQuery } from '../data';
import messages from './messages';

function PostActionsBar({ intl }) {
  const dispatch = useDispatch();
  return (
    <div className="d-flex justify-content-end py-1">
      <SearchField
        placeholder={intl.formatMessage(messages.searchAllPosts)}
        onSubmit={(value) => dispatch(setSearchQuery(value))}
      />
      <Button variant="outline-primary" className="ml-2">
        {intl.formatMessage(messages.addAPost)}
      </Button>
    </div>
  );
}

PostActionsBar.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(PostActionsBar);
