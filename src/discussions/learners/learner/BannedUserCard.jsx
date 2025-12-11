import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import capitalize from 'lodash/capitalize';
import { Link } from 'react-router-dom';

import { Routes } from '../../../data/constants';
import DiscussionContext from '../../common/context';
import { discussionsPath } from '../../utils';
import LearnerAvatar from './LearnerAvatar';
import LearnerFooter from './LearnerFooter';

const BannedUserCard = ({ user }) => {
  const {
    username, threads = 0, inactiveFlags = 0, activeFlags = 0, responses = 0, replies = 0,
  } = user;
  const { enableInContextSidebar, learnerUsername, courseId } = useContext(DiscussionContext);

  const linkUrl = discussionsPath(Routes.LEARNERS.POSTS, {
    0: enableInContextSidebar ? 'in-context' : undefined,
    learnerUsername: username,
    courseId,
  })();

  return (
    <Link
      className="discussion-post p-0 text-decoration-none text-gray-900 border-bottom border-light-400"
      to={linkUrl}
    >
      <div
        className="d-flex flex-row flex-fill mw-100 py-3 px-4 border-primary-500"
        style={username === learnerUsername ? {
          borderRightWidth: '4px',
          borderRightStyle: 'solid',
        } : null}
      >
        <LearnerAvatar username={username} />
        <div className="d-flex flex-column flex-fill" style={{ minWidth: 0 }}>
          <div className="d-flex flex-column justify-content-start mw-100 flex-fill">
            <div className="d-flex align-items-center flex-fill">
              <div
                className="text-truncate font-weight-500 text-primary-500 font-style"
              >
                {capitalize(username)}
              </div>
            </div>
            {threads !== null && (
              <LearnerFooter
                inactiveFlags={inactiveFlags}
                activeFlags={activeFlags}
                threads={threads}
                responses={responses}
                replies={replies}
                username={username}
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

BannedUserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string.isRequired,
    email: PropTypes.string,
    userId: PropTypes.number,
    courseId: PropTypes.string,
    organization: PropTypes.string,
    scope: PropTypes.string,
    reason: PropTypes.string,
    bannedAt: PropTypes.string,
    bannedByUsername: PropTypes.string,
    isActive: PropTypes.bool,
    threads: PropTypes.number,
    responses: PropTypes.number,
    replies: PropTypes.number,
    inactiveFlags: PropTypes.number,
    activeFlags: PropTypes.number,
  }).isRequired,
};

export default BannedUserCard;
