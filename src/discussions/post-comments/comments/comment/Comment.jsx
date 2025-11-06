import React, {
  useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';

import { Button, useToggle } from '@openedx/paragon';
import { DeleteOutline } from '@openedx/paragon/icons';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import HTMLLoader from '../../../../components/HTMLLoader';
import { AvatarOutlineAndLabelColors, ContentActions, EndorsementStatus } from '../../../../data/constants';
import {
  AlertBanner, AuthorLabel, Confirmation, EndorsedAlertBanner,
} from '../../../common';
import DiscussionContext from '../../../common/context';
import HoverCard from '../../../common/HoverCard';
import withPostingRestrictions from '../../../common/withPostingRestrictions';
import { ContentTypes } from '../../../data/constants';
import { useUserPostingEnabled } from '../../../data/hooks';
import { selectContentCreationRateLimited, selectShouldShowEmailConfirmation } from '../../../data/selectors';
import { selectThread } from '../../../posts/data/selectors';
import { fetchThread } from '../../../posts/data/thunks';
import LikeButton from '../../../posts/post/LikeButton';
import { useActions } from '../../../utils';
import {
  selectCommentCurrentPage,
  selectCommentHasMorePages,
  selectCommentOrResponseById,
  selectCommentResponses,
  selectCommentResponsesIds,
  selectCommentSortOrder,
} from '../../data/selectors';
import { editComment, fetchCommentResponses } from '../../data/thunks';
import messages from '../../messages';
import PostCommentsContext from '../../postCommentsContext';
import CommentEditor from './CommentEditor';
import CommentHeader from './CommentHeader';
import Reply from './Reply';

const Comment = ({
  commentId,
  marginBottom,
  showFullThread = true,
  openRestrictionDialogue,
}) => {
  const comment = useSelector(selectCommentOrResponseById(commentId));
  const {
    id, parentId, childCount, abuseFlagged, endorsed, threadId, endorsedAt, endorsedBy, endorsedByLabel, renderedBody,
    voted, following, voteCount, authorLabel, author, createdAt, lastEdit, rawBody, closed, closedBy, closeReason,
    editByLabel, closedByLabel, users: postUsers, isDeleted, deletedByLabel,
  } = comment;
  const intl = useIntl();
  const hasChildren = childCount > 0;
  const isNested = Boolean(parentId);
  const dispatch = useDispatch();
  const { courseId } = useContext(DiscussionContext);
  const { isClosed } = useContext(PostCommentsContext);
  // Get the post's isDeleted state for priority rules
  const post = useSelector(selectThread(threadId));
  const postIsDeleted = post?.isDeleted || false;
  const [isEditing, setEditing] = useState(false);
  const [isReplying, setReplying] = useState(false);
  const [isDeleting, showDeleteConfirmation, hideDeleteConfirmation] = useToggle(false);
  const [isRestoring, showRestoreConfirmation, hideRestoreConfirmation] = useToggle(false);
  const [isReporting, showReportConfirmation, hideReportConfirmation] = useToggle(false);
  const inlineReplies = useSelector(selectCommentResponses(id));
  const inlineRepliesIds = useSelector(selectCommentResponsesIds(id));
  const hasMorePages = useSelector(selectCommentHasMorePages(id));
  const currentPage = useSelector(selectCommentCurrentPage(id));
  const sortedOrder = useSelector(selectCommentSortOrder);
  const actions = useActions(ContentTypes.COMMENT, id);
  const isUserPrivilegedInPostingRestriction = useUserPostingEnabled();
  const shouldShowEmailConfirmation = useSelector(selectShouldShowEmailConfirmation);
  const contentCreationRateLimited = useSelector(selectContentCreationRateLimited);

  useEffect(() => {
    // If the comment has a parent comment, it won't have any children, so don't fetch them.
    if (hasChildren && showFullThread) {
      dispatch(fetchCommentResponses(id, {
        page: 1,
        reverseOrder: sortedOrder,
      }));
    }
  }, [id, sortedOrder]);

  const endorseIcons = useMemo(() => (
    actions.find(({ action }) => action === EndorsementStatus.ENDORSED)
  ), [actions]);

  const handleEditContent = useCallback(() => {
    setEditing(true);
  }, []);

  const handleCommentEndorse = useCallback(async () => {
    await dispatch(editComment(id, { endorsed: !endorsed }));
    await dispatch(fetchThread(threadId, courseId));
  }, [id, endorsed, threadId, courseId, dispatch]);

  const handleAbusedFlag = useCallback(() => {
    if (abuseFlagged) {
      dispatch(editComment(id, { flagged: !abuseFlagged }));
    } else {
      showReportConfirmation();
    }
  }, [abuseFlagged, id, showReportConfirmation]);

  const handleDeleteConfirmation = useCallback(async () => {
    try {
      const { performSoftDeleteComment } = await import('../../data/thunks');
      const result = await dispatch(performSoftDeleteComment(id));
      if (result.success) {
        await dispatch(fetchThread(threadId, courseId));
      }
    } catch (error) {
      logError(error);
    }
    hideDeleteConfirmation();
  }, [id, courseId, threadId, dispatch, hideDeleteConfirmation]);

  const handleReportConfirmation = useCallback(() => {
    dispatch(editComment(id, { flagged: !abuseFlagged }));
    hideReportConfirmation();
  }, [abuseFlagged, id, hideReportConfirmation]);

  const handleCommentLike = useCallback(async () => {
    await dispatch(editComment(id, { voted: !voted }));
  }, [id, voted]);

  const handleSoftDelete = useCallback(() => {
    showDeleteConfirmation();
  }, [showDeleteConfirmation]);

  const handleRestore = useCallback(() => {
    showRestoreConfirmation();
  }, [showRestoreConfirmation]);

  const handleRestoreConfirmation = useCallback(async () => {
    try {
      const { performRestoreComment } = await import('../../data/thunks');
      const result = await dispatch(performRestoreComment(id));
      if (result.success) {
        // Refresh the thread to reflect the change
        await dispatch(fetchThread(threadId, courseId));
      }
    } catch (error) {
      logError(error);
    }
    hideRestoreConfirmation();
  }, [id, courseId, threadId, dispatch, hideRestoreConfirmation]);

  const actionHandlers = useMemo(() => ({
    [ContentActions.EDIT_CONTENT]: handleEditContent,
    [ContentActions.ENDORSE]: handleCommentEndorse,
    [ContentActions.SOFT_DELETE]: handleSoftDelete,
    [ContentActions.RESTORE]: handleRestore,
    [ContentActions.REPORT]: handleAbusedFlag,
  }), [handleEditContent, handleCommentEndorse, handleSoftDelete, handleRestore, handleAbusedFlag]);

  const handleLoadMoreComments = useCallback(() => (
    dispatch(fetchCommentResponses(id, {
      page: currentPage + 1,
      reverseOrder: sortedOrder,
    }))
  ), [id, currentPage, sortedOrder]);

  const handleAddCommentButton = useCallback(() => {
    if (isUserPrivilegedInPostingRestriction) {
      setReplying(true);
    }
  }, [isUserPrivilegedInPostingRestriction]);

  const handleCloseEditor = useCallback(() => {
    setEditing(false);
  }, []);

  const handleAddCommentReply = useCallback(() => {
    setReplying(true);
  }, []);

  const handleCloseReplyEditor = useCallback(() => {
    setReplying(false);
  }, []);

  return (
    <div className={classNames({ 'mb-3': (showFullThread && !marginBottom) })}>
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
      <div
        tabIndex="0"
        className="d-flex flex-column card on-focus border-0"
        data-testid={`comment-${id}`}
        role="listitem"
      >
        <Confirmation
          isOpen={isDeleting}
          title={intl.formatMessage(
            isNested ? messages.deleteCommentTitle : messages.deleteResponseTitle,
          )}
          description={intl.formatMessage(
            isNested ? messages.deleteCommentDescription : messages.deleteResponseDescription,
          )}
          onClose={hideDeleteConfirmation}
          confirmAction={handleDeleteConfirmation}
          closeButtonVariant="tertiary"
          confirmButtonText={intl.formatMessage(messages.deleteConfirmationDelete)}
        />
        <Confirmation
          isOpen={isRestoring}
          title={intl.formatMessage(
            isNested ? messages.undeleteCommentTitle : messages.undeleteResponseTitle,
          )}
          description={intl.formatMessage(
            isNested ? messages.undeleteCommentDescription : messages.undeleteResponseDescription,
          )}
          onClose={hideRestoreConfirmation}
          confirmAction={handleRestoreConfirmation}
          closeButtonVariant="tertiary"
        />
        {!abuseFlagged && (
          <Confirmation
            isOpen={isReporting}
            title={intl.formatMessage(messages.reportResponseTitle)}
            description={intl.formatMessage(messages.reportResponseDescription)}
            onClose={hideReportConfirmation}
            confirmAction={handleReportConfirmation}
            confirmButtonVariant="danger"
          />
        )}
        <EndorsedAlertBanner
          endorsed={endorsed}
          endorsedAt={endorsedAt}
          endorsedBy={endorsedBy}
          endorsedByLabel={endorsedByLabel}
        />
        <div className="d-flex flex-column post-card-comment px-4 pt-3.5 pb-10px" tabIndex="0">
          <HoverCard
            id={id}
            contentType={ContentTypes.COMMENT}
            actionHandlers={actionHandlers}
            handleResponseCommentButton={shouldShowEmailConfirmation || contentCreationRateLimited
              ? openRestrictionDialogue : handleAddCommentButton}
            addResponseCommentButtonMessage={intl.formatMessage(messages.addComment)}
            onLike={handleCommentLike}
            voted={voted}
            following={following}
            endorseIcons={endorseIcons}
            isDeleted={isDeleted}
          />
          {isDeleted && deletedByLabel && (
            <div className="alert alert-info px-3 shadow-none mb-1 py-10px bg-light-200 d-flex align-items-start">
              <DeleteOutline className="mr-2 text-dark-500 flex-shrink-0" style={{ width: '1.5rem', height: '1.5rem' }} />
              <div className="d-flex align-items-center flex-wrap text-gray-700 font-style">
                {intl.formatMessage(messages.deletedBy)}
                <span className="ml-1">
                  <AuthorLabel
                    author={author}
                    authorLabel={deletedByLabel}
                    labelColor={AvatarOutlineAndLabelColors[deletedByLabel] && `text-${AvatarOutlineAndLabelColors[deletedByLabel]}`}
                    linkToProfile
                    postOrComment
                  />
                </span>
              </div>
            </div>
          )}
          <AlertBanner
            author={author}
            abuseFlagged={abuseFlagged}
            lastEdit={lastEdit}
            closed={closed}
            closedBy={closedBy}
            closeReason={closeReason}
            editByLabel={editByLabel}
            closedByLabel={closedByLabel}
          />
          <CommentHeader
            author={author}
            authorLabel={authorLabel}
            abuseFlagged={abuseFlagged}
            closed={closed}
            createdAt={createdAt}
            lastEdit={lastEdit}
            postUsers={postUsers}
            isDeleted={isDeleted}
            parentId={parentId}
            postIsDeleted={postIsDeleted}
            postData={comment}
          />
          {isEditing ? (
            <CommentEditor
              comment={{
                author,
                id,
                lastEdit,
                threadId,
                parentId,
                rawBody,
              }}
              onCloseEditor={handleCloseEditor}
              formClasses="pt-3"
            />
          ) : (
            <HTMLLoader
              cssClassName="comment-body html-loader text-break mt-14px font-style text-primary-500"
              componentId="comment"
              htmlNode={renderedBody}
              testId={id}
            />
          )}
          {voted && (
            <div className="ml-n1.5 mt-10px">
              <LikeButton
                count={voteCount}
                onClick={handleCommentLike}
                voted={voted}
              />
            </div>
          )}
          {inlineRepliesIds.length > 0 && (
            <div className="d-flex flex-column mt-0.5" role="list">
              {inlineRepliesIds.map(replyId => (
                <Reply
                  responseId={replyId}
                  key={replyId}
                />
              ))}
            </div>
          )}
          {hasMorePages && (
            <Button
              onClick={handleLoadMoreComments}
              variant="link"
              block="true"
              className="line-height-24 font-style pt-10px border-0 font-weight-500 pb-0"
              data-testid="load-more-comments-responses"
            >
              {intl.formatMessage(messages.loadMoreComments)}
            </Button>
          )}
          {!isNested && showFullThread && (
            isReplying ? (
              <div className="mt-2.5">
                <CommentEditor
                  comment={{ threadId, parentId: id }}
                  edit={false}
                  onCloseEditor={handleCloseReplyEditor}
                />
              </div>
            ) : (
              !isClosed && isUserPrivilegedInPostingRestriction && (inlineReplies.length >= 5) && (
                <Button
                  className="d-flex flex-grow mt-2 font-style font-weight-500 text-primary-500 add-comment-btn rounded-0"
                  variant="plain"
                  style={{ height: '36px' }}
                  data-testid="add-comment-2"
                  onClick={shouldShowEmailConfirmation || contentCreationRateLimited
                    ? openRestrictionDialogue : handleAddCommentReply}
                >
                  {intl.formatMessage(messages.addComment)}
                </Button>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

Comment.propTypes = {
  commentId: PropTypes.string.isRequired,
  marginBottom: PropTypes.bool,
  showFullThread: PropTypes.bool,
  openRestrictionDialogue: PropTypes.func.isRequired,
};

Comment.defaultProps = {
  marginBottom: false,
  showFullThread: true,
};

export default React.memo(withPostingRestrictions(Comment));
