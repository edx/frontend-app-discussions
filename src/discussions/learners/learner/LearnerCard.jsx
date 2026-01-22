import React, { useContext } from 'react';

import capitalize from 'lodash/capitalize';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PostsStatusFilter, Routes, ThreadType } from '../../../data/constants';
import DiscussionContext from '../../common/context';
import { discussionsPath } from '../../utils';
import { setPostFilter } from '../data/slices';
import LearnerAvatar from './LearnerAvatar';
import LearnerFooter from './LearnerFooter';
import learnerShape from './proptypes';

const LearnerCard = ({ learner }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    username, threads, inactiveFlags, activeFlags, responses, replies,
    deletedCount, deletedThreads, deletedResponses, deletedReplies,
  } = learner;
  const { enableInContextSidebar, learnerUsername, courseId } = useContext(DiscussionContext);
  const linkUrl = discussionsPath(Routes.LEARNERS.POSTS, {
    0: enableInContextSidebar ? 'in-context' : undefined,
    learnerUsername: learner.username,
    courseId,
  })();

  const handleFilterClick = (filters) => {
    // Apply the filters
    dispatch(setPostFilter(filters));
    // Navigate to the learner's posts view
    navigate(linkUrl);
  };

  // Handle clicking the card body (not footer icons)
  const handleCardClick = () => {
    // Set default filter to show all active posts
    handleFilterClick({
      postType: ThreadType.ALL,
      status: PostsStatusFilter.ALL,
      contentStatus: PostsStatusFilter.ACTIVE,
    });
  };

  return (
    <div
      className="discussion-post p-0 text-decoration-none text-gray-900 border-bottom border-light-400"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="d-flex flex-row flex-fill mw-100 py-3 px-4 border-primary-500"
        style={username === learnerUsername ? {
          borderRightWidth: '4px',
          borderRightStyle: 'solid',
        } : null}
      >
        <LearnerAvatar username={username} />
        <div className="d-flex flex-column flex-fill" style={{ overflow: 'visible' }}>
          <div className="d-flex flex-column justify-content-start flex-fill">
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
                deletedCount={deletedCount}
                deletedThreads={deletedThreads}
                deletedResponses={deletedResponses}
                deletedReplies={deletedReplies}
                onFilterClick={handleFilterClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

LearnerCard.propTypes = {
  learner: learnerShape.isRequired,
};

export default React.memo(LearnerCard);
