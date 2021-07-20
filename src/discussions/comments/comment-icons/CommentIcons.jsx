import React from 'react';
import PropTypes from 'prop-types';

import { Button, Icon } from '@edx/paragon';
import {
  Flag,
  StarFilled,
  StarOutline,
} from '@edx/paragon/icons';

function CommentIcons({ abuseFlagged, following }) {
  return (
    <div className="d-flex flex-column icons">
      {/* Only show the star if the comment has a following attribute, indicating it can be followed */}
      { following !== undefined && (
        following
          ? (
            <Button variant="link" className="p-0" size="xs">
              <Icon src={StarFilled} />
            </Button>
          ) : (
            <Button variant="link" className="p-0" size="xs">
              <Icon src={StarOutline} />
            </Button>
          )
      )}
      {abuseFlagged && (
        <Button variant="link" className="p-0" size="xs">
          <Icon src={Flag} />
        </Button>
      )}
    </div>
  );
}

CommentIcons.propTypes = {
  abuseFlagged: PropTypes.bool,
  following: PropTypes.bool,
};

CommentIcons.defaultProps = {
  abuseFlagged: undefined,
  following: undefined,
};

export default CommentIcons;
