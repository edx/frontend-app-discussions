import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Icon, IconButton, OverlayTrigger, Tooltip,
} from '@openedx/paragon';
import {
  StarFilled, StarOutline, ThumbUpFilled, ThumbUpOutline,
} from '@openedx/paragon/icons';
import classNames from 'classnames';

import { useIntl } from '@edx/frontend-platform/i18n';

import { ThreadType } from '../../data/constants';
import { useHasLikePermission, useUserPostingEnabled } from '../data/hooks';
import PostCommentsContext from '../post-comments/postCommentsContext';
import messages from '../posts/post/messages';
import ActionsDropdown from './ActionsDropdown';
import DiscussionContext from './context';

const HoverCard = ({
  id,
  contentType,
  actionHandlers,
  handleResponseCommentButton,
  addResponseCommentButtonMessage,
  onLike,
  onFollow,
  voted,
  following,
  endorseIcons,
  isDeleted,
}) => {
  const intl = useIntl();
  const { enableInContextSidebar } = useContext(DiscussionContext);
  const { isClosed } = useContext(PostCommentsContext);
  const isUserPrivilegedInPostingRestriction = useUserPostingEnabled();
  const userHasLikePermission = useHasLikePermission(contentType, id);

  return (
    <div
      className="flex-fill justify-content-end align-items-center hover-card bg-white mr-n4 position-absolute"
      data-testid={`hover-card-${id}`}
      id={`hover-card-${id}`}
    >
      {isUserPrivilegedInPostingRestriction && (
        <div className="d-flex">
          <Button
            variant="tertiary"
            className={classNames(
              'px-2.5 py-2 border-0 font-style text-gray-700',
              { 'w-100': enableInContextSidebar },
            )}
            onClick={() => !isDeleted && handleResponseCommentButton()}
            disabled={isClosed || isDeleted}
            style={{ lineHeight: '20px', ...(isDeleted ? { opacity: 0.3, cursor: 'not-allowed' } : {}) }}
          >
            {addResponseCommentButtonMessage}
          </Button>
        </div>
      )}
      {endorseIcons && (
        <div className="hover-button">
          <OverlayTrigger
            overlay={(
              <Tooltip id="endorsed-icon-tooltip">
                {intl.formatMessage(endorseIcons.label)}
              </Tooltip>
            )}
            trigger={['hover', 'focus']}
          >
            <IconButton
              src={endorseIcons.icon}
              iconAs={Icon}
              onClick={() => {
                if (!isDeleted) {
                  const actionFunction = actionHandlers[endorseIcons.action];
                  actionFunction();
                }
              }}
              className={['endorse', 'unendorse'].includes(endorseIcons.id) ? 'text-dark-500' : 'text-success-500'}
              size="sm"
              alt="Endorse"
              disabled={isDeleted}
              style={isDeleted ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
            />
          </OverlayTrigger>
        </div>
      )}
      <div className="hover-button">
        <OverlayTrigger
          overlay={(
            <Tooltip>
              {intl.formatMessage(voted ? messages.removeLike : messages.like)}
            </Tooltip>
        )}
        >
          <IconButton
            src={voted ? ThumbUpFilled : ThumbUpOutline}
            iconAs={Icon}
            size="sm"
            alt="Like"
            disabled={!userHasLikePermission || isDeleted}
            iconClassNames="like-icon-dimensions"
            style={isDeleted ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
            onClick={(e) => {
              e.preventDefault();
              if (!isDeleted) {
                onLike();
              }
            }}
          />
        </OverlayTrigger>
      </div>
      {following !== undefined && (
        <div className="hover-button">
          <OverlayTrigger
            overlay={(
              <Tooltip>
                {intl.formatMessage(following ? messages.unFollow : messages.follow)}
              </Tooltip>
          )}
          >
            <IconButton
              src={following ? StarFilled : StarOutline}
              iconAs={Icon}
              size="sm"
              alt="Follow"
              iconClassNames="follow-icon-dimensions"
              disabled={isDeleted}
              style={isDeleted ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
              onClick={(e) => {
                e.preventDefault();
                if (!isDeleted) {
                  onFollow();
                }
              }}
            />
          </OverlayTrigger>
        </div>
      )}
      <div className="hover-button ml-auto">
        <ActionsDropdown
          id={id}
          contentType={contentType}
          actionHandlers={actionHandlers}
          dropDownIconSize
        />
      </div>
    </div>
  );
};

HoverCard.propTypes = {
  id: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  actionHandlers: PropTypes.objectOf(PropTypes.func).isRequired,
  handleResponseCommentButton: PropTypes.func.isRequired,
  addResponseCommentButtonMessage: PropTypes.string.isRequired,
  onLike: PropTypes.func.isRequired,
  voted: PropTypes.bool.isRequired,
  endorseIcons: PropTypes.objectOf(PropTypes.shape(
    {
      id: PropTypes.string,
      action: PropTypes.string,
      icon: PropTypes.element,
      label: {
        id: PropTypes.string,
        defaultMessage: PropTypes.string,
        description: PropTypes.string,
      },
      conditions: {
        endorsed: PropTypes.bool,
        postType: ThreadType,
      },
    },
  )),
  onFollow: PropTypes.func,
  following: PropTypes.bool,
  isDeleted: PropTypes.bool,
};

HoverCard.defaultProps = {
  onFollow: () => null,
  endorseIcons: null,
  following: undefined,
  isDeleted: false,
};

export default React.memo(HoverCard);
