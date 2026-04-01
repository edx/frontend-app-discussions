import React from 'react';
import PropTypes from 'prop-types';

import { Badge, Card, Icon } from '@openedx/paragon';
import { Chat, QuestionAnswer } from '@openedx/paragon/icons';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import * as timeago from 'timeago.js';

import { useIntl } from '@edx/frontend-platform/i18n';

import HTMLLoader from '../../components/HTMLLoader';
import { Routes, ThreadType } from '../../data/constants';
import timeLocale from '../common/time-locale';
import { selectTopic } from '../topics/data/selectors';
import { discussionsPath } from '../utils';
import messages from './messages';

const MutedPostCard = ({ post }) => {
  const intl = useIntl();
  const { courseId } = useParams();
  const topic = useSelector(selectTopic(post.topicId));
  timeago.register('time-locale', timeLocale);

  const postLink = `${discussionsPath(Routes.POSTS.TOPIC, {
    courseId,
    topicId: post.topicId,
    category: post.postType,
    postId: post.id,
  })()}?includeMuted=true`;

  const getScopeDisplayInfo = () => {
    switch (post.muteScope) {
      case 'course':
        return {
          text: intl.formatMessage(messages.mutedCourseWide),
          variant: 'danger',
        };
      case 'personal':
        return {
          text: intl.formatMessage(messages.mutedForMe),
          variant: 'warning',
        };
      default:
        return {
          text: intl.formatMessage(messages.muted),
          variant: 'secondary',
        };
    }
  };

  const scopeInfo = getScopeDisplayInfo();

  return (
    <Card className="discussion-post-card border-light-300 mb-3">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <Icon
              src={post.type === ThreadType.QUESTION ? QuestionAnswer : Chat}
              className="mr-2 text-gray-500"
              size="sm"
            />
            <span className="text-gray-700 small font-weight-bold">
              {post.author || post.mutedUsername}
            </span>
            <Badge
              variant={scopeInfo.variant}
              className="ml-2"
              size="sm"
            >
              {scopeInfo.text}
            </Badge>
          </div>
          <div className="text-gray-500 small">
            {timeago.format(post.createdAt, 'time-locale')}
          </div>
        </div>

        <div className="mb-2">
          <Link
            to={postLink}
            className="text-decoration-none"
            style={{ color: 'inherit' }}
          >
            <h6 className="font-weight-bold text-dark mb-1">
              {post.title || `${post.rawBody?.substring(0, 100)}...`}
            </h6>
            <div className="text-gray-700 small">
              <HTMLLoader
                componentId={`muted-post-${post.id}`}
                htmlNode={post.renderedBody}
                cssClassName="rendered-content-muted-post"
                testId={`muted-post-content-${post.id}`}
              />
            </div>
          </Link>
        </div>

        {topic && (
          <div className="text-gray-500 small">
            <strong>Topic:</strong> {topic.name}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center text-gray-500 small mt-2">
          <div>
            {post.commentCount > 0 && (
              <span className="mr-3">
                {intl.formatMessage(messages.responseCount, { count: post.commentCount })}
              </span>
            )}
            {post.unreadCommentCount > 0 && (
              <span>
                {intl.formatMessage(messages.unreadResponseCount, { count: post.unreadCommentCount })}
              </span>
            )}
          </div>
          {post.lastActivity && (
            <div>
              {intl.formatMessage(messages.lastActivity, {
                relativeTime: timeago.format(post.lastActivity.createdAt, 'time-locale'),
              })}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

MutedPostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    author: PropTypes.string,
    mutedUsername: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string,
    rawBody: PropTypes.string,
    renderedBody: PropTypes.string,
    commentCount: PropTypes.number,
    unreadCommentCount: PropTypes.number,
    topicId: PropTypes.string,
    type: PropTypes.string,
    postType: PropTypes.string,
    muteScope: PropTypes.oneOf(['course', 'personal', 'default']),
    lastActivity: PropTypes.shape({
      createdAt: PropTypes.string,
    }),
  }).isRequired,
};

export default MutedPostCard;
