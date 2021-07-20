import React from 'react';

import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Icon } from '@edx/paragon';
import { Flag } from '@edx/paragon/icons';

import { Routes } from '../../../data/constants';
import messages from './messages';
import Post, { postShape } from './Post';

function PostLink({
  post,
  intl,
}) {
  return (
    <Link
      className="discussion-post list-group-item list-group-item-action p-0 text-decoration-none text-gray-900"
      to={
        Routes.COMMENTS.PATH.replace(':courseId', post.courseId)
          .replace(':topicId', post.topicId)
          .replace(':postId', post.id)
      }
    >
      {post.abuseFlagged && (
        <div className="align-items-center bg-danger-100 d-flex flex-fill p-1">
          <Icon className="text-danger-700" src={Flag} />
          <span className="text-gray-700 x-small">{intl.formatMessage(messages.contentReported)}</span>
        </div>
      )}
      <div className="d-flex flex-row">
        <FontAwesomeIcon icon={faCircle} className={`my-1 text-accent-a ${post.read && 'invisible'}`} size="xs" />
        <Post post={post} />
      </div>
    </Link>
  );
}

PostLink.propTypes = {
  post: postShape.isRequired,
  intl: intlShape.isRequired,
};

export default injectIntl(PostLink);
