import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { Button, useToggle } from '@openedx/paragon';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import HTMLLoader from '../../../../components/HTMLLoader';
import {
  banUser, bulkDeleteUserPosts, unbanUser,
} from '../../../../data/api/moderation';
import { ContentActions, EndorsementStatus } from '../../../../data/constants';
import {
  AlertBanner,
  AutoSpamAlertBanner,
  BanModerationModals,
  Confirmation,
  EndorsedAlertBanner,
} from '../../../common';
import DiscussionContext from '../../../common/context';
import HoverCard from '../../../common/HoverCard';
import withPostingRestrictions from '../../../common/withPostingRestrictions';
import { ContentTypes } from '../../../data/constants';
import { useUserPostingEnabled } from '../../../data/hooks';
import {
  selectContentCreationRateLimited,
  selectIsUserBanned,
  selectShouldShowEmailConfirmation,
  selectUserHasModerationPrivileges,
} from '../../../data/selectors';
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
import {
  editComment,
  fetchCommentResponses,
  performRestoreComment,
  removeComment,
} from '../../data/thunks';
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
    editByLabel, closedByLabel, users: postUsers, is_spam: isSpam,
  } = comment;
  const intl = useIntl();
  const hasChildren = childCount > 0;
  const isNested = Boolean(parentId);
  const dispatch = useDispatch();
  const { courseId, enableDiscussionBan } = useContext(DiscussionContext);
  const { isClosed } = useContext(PostCommentsContext);
  const [isEditing, setEditing] = useState(false);
  const [isReplying, setReplying] = useState(false);

  // Modal type constants
  const MODAL_TYPES = {
    DELETE: 'delete',
    DELETE_USER: 'deleteUser',
    BAN: 'ban',
    UNBAN: 'unban',
    REPORT: 'report',
  };

  // Scope constants
  const SCOPES = {
    COURSE: 'course',
    ORGANIZATION: 'organization',
  };

  // Consolidated modal state management
  const [activeModal, setActiveModal] = useState({ type: null, scope: null });

  // Unified modal control functions
  const showModal = useCallback((type, scope = null) => {
    setActiveModal({ type, scope });
  }, []);

  const hideModal = useCallback(() => {
    setActiveModal({ type: null, scope: null });
  }, []);

  // Keep separate toggles for delete/report modals (not handled by BanModerationModals)
  const [isDeleting, showDeleteConfirmation, hideDeleteConfirmation] = useToggle(false);
  const [isRestoring, showRestoreConfirmation, hideRestoreConfirmation] = useToggle(false);
  const [isReporting, showReportConfirmation, hideReportConfirmation] = useToggle(false);

  // Compute modal state string for BanModerationModals component
  const getActiveModalString = () => {
    if (activeModal.type === MODAL_TYPES.DELETE_USER) {
      return activeModal.scope === SCOPES.COURSE ? 'deleteUserCourse' : 'deleteUserOrg';
    }
    if (activeModal.type === MODAL_TYPES.BAN) {
      return activeModal.scope === SCOPES.COURSE ? 'banCourse' : 'banOrg';
    }
    if (activeModal.type === MODAL_TYPES.UNBAN) {
      return activeModal.scope === SCOPES.COURSE ? 'unbanCourse' : 'unbanOrg';
    }
    return null;
  };

  const inlineReplies = useSelector(selectCommentResponses(id));
  const inlineRepliesIds = useSelector(selectCommentResponsesIds(id));
  const hasMorePages = useSelector(selectCommentHasMorePages(id));
  const currentPage = useSelector(selectCommentCurrentPage(id));
  const sortedOrder = useSelector(selectCommentSortOrder);
  const hasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const actions = useActions(ContentTypes.COMMENT, id, hasModerationPrivileges);
  const isUserPrivilegedInPostingRestriction = useUserPostingEnabled();
  const shouldShowEmailConfirmation = useSelector(selectShouldShowEmailConfirmation);
  const contentCreationRateLimited = useSelector(selectContentCreationRateLimited);
  const isUserBanned = useSelector(selectIsUserBanned);
  // If isSpam is not provided in the API response, default to false
  const isSpamFlagged = isSpam || false;
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
    // Optimistic update - instant UI feedback
    await dispatch(editComment(id, { endorsed: !endorsed }));
  }, [id, endorsed]);

  const handleAbusedFlag = useCallback(() => {
    if (abuseFlagged) {
      dispatch(editComment(id, { flagged: !abuseFlagged }));
    } else {
      showReportConfirmation();
    }
  }, [abuseFlagged, id, showReportConfirmation]);

  const handleDeleteConfirmation = useCallback(() => {
    dispatch(removeComment(id));
    hideDeleteConfirmation();
  }, [id, hideDeleteConfirmation]);

  const handleReportConfirmation = useCallback(() => {
    dispatch(editComment(id, { flagged: !abuseFlagged }));
    hideReportConfirmation();
  }, [abuseFlagged, id, hideReportConfirmation]);

  const handleCommentLike = useCallback(async () => {
    await dispatch(editComment(id, { voted: !voted }));
  }, [id, voted]);

  const handleRestore = useCallback(() => {
    showRestoreConfirmation();
  }, [showRestoreConfirmation]);

  const handleRestoreConfirmation = useCallback(async () => {
    const result = await dispatch(performRestoreComment(id, courseId));
    if (result && !result.success) {
      logError(`Failed to restore comment: ${result.error || 'Unknown error'}`);
    }
    hideRestoreConfirmation();
  }, [id, courseId, dispatch, hideRestoreConfirmation]);

  // Bulk delete/ban handlers
  const handleDeleteUserCourseConfirmation = useCallback(async (shouldBan) => {
    // Defensive check - author must be defined
    if (!author) {
      logError('Bulk delete operation attempted without author');
      hideModal();
      return;
    }
    try {
      // Only ban if flag is enabled (defensive check)
      await bulkDeleteUserPosts(courseId, author, 'course', shouldBan && enableDiscussionBan);
      hideModal();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error during bulk delete (course): ${errorMsg}`);
    }
  }, [author, courseId, threadId, dispatch, hideModal, enableDiscussionBan]);

  const handleDeleteUserOrgConfirmation = useCallback(async (shouldBan) => {
    // Defensive check - author must be defined
    if (!author) {
      logError('Bulk delete operation attempted without author');
      hideModal();
      return;
    }
    try {
      // Only ban if flag is enabled (defensive check)
      await bulkDeleteUserPosts(courseId, author, 'organization', shouldBan && enableDiscussionBan);
      hideModal();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error during bulk delete (org): ${errorMsg}`);
    }
  }, [author, courseId, threadId, dispatch, hideModal, enableDiscussionBan]);

  const handleBanCourseConfirmation = useCallback(async () => {
    // Defensive check - feature must be enabled
    if (!enableDiscussionBan) {
      logError('Ban operation attempted with feature disabled');
      hideModal();
      return;
    }
    // Defensive check - author must be defined
    if (!author) {
      logError('Ban operation attempted without author');
      hideModal();
      return;
    }
    try {
      await banUser(courseId, author, 'course', 'Banned from course discussions');
      hideModal();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error banning user (course): ${errorMsg}`);
    }
  }, [author, courseId, threadId, dispatch, hideModal, enableDiscussionBan]);

  const handleBanOrgConfirmation = useCallback(async () => {
    // Defensive check - feature must be enabled
    if (!enableDiscussionBan) {
      logError('Ban operation attempted with feature disabled');
      hideModal();
      return;
    }
    // Defensive check - author must be defined
    if (!author) {
      logError('Ban operation attempted without author');
      hideModal();
      return;
    }
    try {
      await banUser(courseId, author, 'organization', 'Banned from organization discussions');
      hideModal();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error banning user (org): ${errorMsg}`);
    }
  }, [author, courseId, threadId, dispatch, hideModal, enableDiscussionBan]);

  const handleUnbanCourseConfirmation = useCallback(async () => {
    // Defensive check - feature must be enabled
    if (!enableDiscussionBan) {
      logError('Unban operation attempted with feature disabled');
      hideModal();
      return;
    }
    // Defensive check - author must be defined
    if (!author) {
      logError('Unban operation attempted without author');
      hideModal();
      return;
    }
    try {
      await unbanUser(courseId, author, 'course', 'Unbanned from course discussions');
      hideModal();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error unbanning user (course): ${errorMsg}`);
    }
  }, [author, courseId, threadId, dispatch, hideModal, enableDiscussionBan]);

  const handleUnbanOrgConfirmation = useCallback(async () => {
    // Defensive check - feature must be enabled
    if (!enableDiscussionBan) {
      logError('Unban operation attempted with feature disabled');
      hideModal();
      return;
    }
    // Defensive check - author must be defined
    if (!author) {
      logError('Unban operation attempted without author');
      hideModal();
      return;
    }
    try {
      await unbanUser(courseId, author, 'organization', 'Unbanned from organization discussions');
      hideModal();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error unbanning user (org): ${errorMsg}`);
    }
  }, [author, courseId, threadId, dispatch, hideModal, enableDiscussionBan]);

  const actionHandlers = useMemo(() => ({
    [ContentActions.EDIT_CONTENT]: handleEditContent,
    [ContentActions.ENDORSE]: handleCommentEndorse,
    [ContentActions.DELETE]: showDeleteConfirmation,
    [ContentActions.RESTORE]: handleRestore,
    [ContentActions.DELETE_POST]: showDeleteConfirmation,
    [ContentActions.DELETE_USER_COURSE]: () => showModal(MODAL_TYPES.DELETE_USER, SCOPES.COURSE),
    [ContentActions.DELETE_USER_ORG]: () => showModal(MODAL_TYPES.DELETE_USER, SCOPES.ORGANIZATION),
    [ContentActions.BAN_COURSE]: () => showModal(MODAL_TYPES.BAN, SCOPES.COURSE),
    [ContentActions.BAN_ORG]: () => showModal(MODAL_TYPES.BAN, SCOPES.ORGANIZATION),
    [ContentActions.UNBAN_COURSE]: () => showModal(MODAL_TYPES.UNBAN, SCOPES.COURSE),
    [ContentActions.UNBAN_ORG]: () => showModal(MODAL_TYPES.UNBAN, SCOPES.ORGANIZATION),
    [ContentActions.REPORT]: handleAbusedFlag,
  }), [
    handleEditContent,
    handleCommentEndorse,
    showDeleteConfirmation,
    handleRestore,
    showModal,
    handleAbusedFlag,
  ]);

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
          title={intl.formatMessage(messages.deleteResponseTitle)}
          description={intl.formatMessage(messages.deleteResponseDescription)}
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
        <BanModerationModals
          author={author}
          activeModal={getActiveModalString()}
          onClose={hideModal}
          onDeleteUserCourse={handleDeleteUserCourseConfirmation}
          onDeleteUserOrg={handleDeleteUserOrgConfirmation}
          onBanCourse={handleBanCourseConfirmation}
          onBanOrg={handleBanOrgConfirmation}
          onUnbanCourse={handleUnbanCourseConfirmation}
          onUnbanOrg={handleUnbanOrgConfirmation}
          enableDiscussionBan={enableDiscussionBan}
          showBanCheckboxOnDelete={false}
        />
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
            handleResponseCommentButton={shouldShowEmailConfirmation || contentCreationRateLimited || isUserBanned
              ? openRestrictionDialogue : handleAddCommentButton}
            addResponseCommentButtonMessage={intl.formatMessage(messages.addComment)}
            onLike={handleCommentLike}
            voted={voted}
            following={following}
            endorseIcons={endorseIcons}
            isUserBanned={isUserBanned}
          />
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
          <AutoSpamAlertBanner autoSpamFlagged={isSpamFlagged} />
          <CommentHeader
            author={author}
            authorLabel={authorLabel}
            abuseFlagged={abuseFlagged}
            closed={closed}
            createdAt={createdAt}
            lastEdit={lastEdit}
            postUsers={postUsers}
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
                disabled={isUserBanned}
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
              !isClosed && isUserPrivilegedInPostingRestriction && !isUserBanned && (inlineReplies.length >= 5) && (
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
