import React from 'react';
import PropTypes from 'prop-types';

import { Alert } from '@openedx/paragon';
import { DeleteOutline } from '@openedx/paragon/icons';

import { AvatarOutlineAndLabelColors } from '../../data/constants';
import AuthorLabel from './AuthorLabel';

const DeletedByBanner = ({
  deletedBy,
  deletedByLabel,
  message,
  postData,
}) => (
  <Alert variant="info" className="px-3 shadow-none mb-1 py-10px bg-light-200">
    <div className="d-flex align-items-center flex-nowrap w-100">
      <DeleteOutline className="mr-2 text-dark-500 flex-shrink-0 deleted-content-icon" />
      <div className="d-flex align-items-center flex-nowrap text-gray-700 font-style min-w-0">
        <span className="text-nowrap">{message}</span>
        <div className="ml-1 d-flex align-items-center flex-nowrap">
          <AuthorLabel
            author={deletedBy}
            authorLabel={deletedByLabel}
            labelColor={AvatarOutlineAndLabelColors[deletedByLabel] && `text-${AvatarOutlineAndLabelColors[deletedByLabel]}`}
            linkToProfile
            postOrComment
            singleLine
            postData={postData}
          />
        </div>
      </div>
    </div>
  </Alert>
);

DeletedByBanner.propTypes = {
  deletedBy: PropTypes.string.isRequired,
  deletedByLabel: PropTypes.string,
  message: PropTypes.string,
  postData: PropTypes.shape({}),
};

DeletedByBanner.defaultProps = {
  deletedByLabel: null,
  message: '',
  postData: null,
};

export default React.memo(DeletedByBanner);
