import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Avatar, useToggle } from '@openedx/paragon';
import { DeleteOutline } from '@openedx/paragon/icons';
import { useDispatch, useSelector } from 'react-redux';
import * as timeago from 'timeago.js';

import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import HTMLLoader from '../../../../components/HTMLLoader';
import {
  banUser, bulkDeleteUserPosts, unbanUser,
} from '../../../../data/api/moderation';
import { AvatarOutlineAndLabelColors, ContentActions } from '../../../../data/constants';
import {
  ActionsDropdown, AlertBanner, AuthorLabel, AutoSpamAlertBanner, Confirmation, MuteModalManager,
} from '../../../common';
import DiscussionContext from '../../../common/context';
import timeLocale from '../../../common/time-locale';
import { ContentTypes } from '../../../data/constants';
import { useAlertBannerVisible } from '../../../data/hooks';
import {
  selectIsUserBanned,
} from '../../../data/selectors';
import { muteUserThunk, unmuteUserThunk } from '../../../data/thunks';
import discussionMessages from '../../../messages';
import { selectAuthorAvatar } from '../../../posts/data/selectors';
import { fetchThread } from '../../../posts/data/thunks';
import DeleteWithBanConfirmation from '../../../posts/post/DeleteWithBanConfirmation';
import postMessages from '../../../posts/post/messages';
import {
  selectCommentOrResponseById,
} from '../../data/selectors';
import { editComment, removeComment } from '../../data/thunks';
import messages from '../../messages';
import CommentEditor from './CommentEditor';

const Reply = ({ responseId }) => {
  timeago.register('time-locale', timeLocale);
  const commentData = useSelector(selectCommentOrResponseById(responseId));
  const {
    id, abuseFlagged, author, authorLabel, endorsed, lastEdit, closed, closedBy,
    closeReason, createdAt, threadId, parentId, rawBody, renderedBody, editByLabel,
    closedByLabel, isDeleted, deletedBy, deletedByLabel, is_spam: isSpam,
  } = commentData;
  const intl = useIntl();
  const dispatch = useDispatch();
  const { courseId, enableDiscussionBan } = React.useContext(DiscussionContext);
  const [isEditing, setEditing] = useState(false);
  const [isDeleting, showDeleteConfirmation, hideDeleteConfirmation] = useToggle(false);
  const [isRestoring, showRestoreConfirmation, hideRestoreConfirmation] = useToggle(false);
  const [isDeletingUserCourse, showDeleteUserCourseConfirmation, hideDeleteUserCourseConfirmation] = useToggle(false);
  const [isDeletingUserOrg, showDeleteUserOrgConfirmation, hideDeleteUserOrgConfirmation] = useToggle(false);
  const [isBanningCourse, showBanCourseConfirmation, hideBanCourseConfirmation] = useToggle(false);
  const [isBanningOrg, showBanOrgConfirmation, hideBanOrgConfirmation] = useToggle(false);
  const [isUnbanningCourse, showUnbanCourseConfirmation, hideUnbanCourseConfirmation] = useToggle(false);
  const [isUnbanningOrg, showUnbanOrgConfirmation, hideUnbanOrgConfirmation] = useToggle(false);
  const [isReporting, showReportConfirmation, hideReportConfirmation] = useToggle(false);
  const isUserBanned = useSelector(selectIsUserBanned);
  const [isLearnerMuting, showLearnerMuteModal, hideLearnerMuteModal] = useToggle(false);
  const [isLearnerUnmuting, showLearnerUnmuteModal, hideLearnerUnmuteModal] = useToggle(false);
  const [isMutingPersonal, showMutePersonalConfirmation, hideMutePersonalConfirmation] = useToggle(false);
  const [isMutingCoursewide, showMuteCourseConfirmation, hideMuteCourseConfirmation] = useToggle(false);
  const [isUnmutingPersonal, showUnmutePersonalConfirmation, hideUnmutePersonalConfirmation] = useToggle(false);
  const [isUnmutingCoursewide, showUnmuteCourseConfirmation, hideUnmuteCourseConfirmation] = useToggle(false);
  const colorClass = AvatarOutlineAndLabelColors[authorLabel];
  const isSpamFlagged = isSpam || false;
  const hasAnyAlert = useAlertBannerVisible({
    author,
    abuseFlagged,
    lastEdit,
    closed,
  });
  const authorAvatar = useSelector(selectAuthorAvatar(author));

  const handleDeleteConfirmation = useCallback(() => {
    dispatch(removeComment(id));
    hideDeleteConfirmation();
  }, [id, hideDeleteConfirmation]);

  const handleReportConfirmation = useCallback(() => {
    dispatch(editComment(id, { flagged: !abuseFlagged }));
    hideReportConfirmation();
  }, [abuseFlagged, id, hideReportConfirmation]);

  const handleEditContent = useCallback(() => {
    setEditing(true);
  }, []);

  const handleReplyEndorse = useCallback(() => {
    dispatch(editComment(id, { endorsed: !endorsed }));
  }, [endorsed, id]);

  const handleRestore = useCallback(() => {
    showRestoreConfirmation();
  }, [showRestoreConfirmation]);

  const handleRestoreConfirmation = useCallback(async () => {
    try {
      const { performRestoreComment } = await import('../../data/thunks');
      const result = await dispatch(performRestoreComment(id, courseId));
      // Check if restore failed and log the error
      if (result && !result.success) {
        logError(`Failed to restore comment: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      logError(error);
    }
    hideRestoreConfirmation();
  }, [id, courseId, threadId, dispatch, hideRestoreConfirmation]);

  const handleAbusedFlag = useCallback(() => {
    if (abuseFlagged) {
      dispatch(editComment(id, { flagged: !abuseFlagged }));
    } else {
      showReportConfirmation();
    }
  }, [abuseFlagged, id, showReportConfirmation]);

  const handleCloseEditor = useCallback(() => {
    setEditing(false);
  }, []);

  const handleDeleteUserCourseConfirmation = useCallback(async (shouldBan) => {
    try {
      // Only ban if flag is enabled (defensive check)
      await bulkDeleteUserPosts(courseId, author, 'course', shouldBan && enableDiscussionBan);
      hideDeleteUserCourseConfirmation();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      logError(error);
    }
  }, [author, courseId, threadId, hideDeleteUserCourseConfirmation, enableDiscussionBan]);

  const handleDeleteUserOrgConfirmation = useCallback(async (shouldBan) => {
    try {
      // Only ban if flag is enabled (defensive check)
      await bulkDeleteUserPosts(courseId, author, 'organization', shouldBan && enableDiscussionBan);
      hideDeleteUserOrgConfirmation();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      logError(error);
    }
  }, [author, courseId, threadId, hideDeleteUserOrgConfirmation, enableDiscussionBan]);

  const handleBanCourseConfirmation = useCallback(async (reason) => {
    try {
      await banUser(courseId, author, 'course', reason || 'Banned from course discussions');
      hideBanCourseConfirmation();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      logError(error);
    }
  }, [author, courseId, threadId, dispatch, hideBanCourseConfirmation]);

  const handleBanOrgConfirmation = useCallback(async (reason) => {
    try {
      await banUser(courseId, author, 'organization', reason || 'Banned from organization discussions');
      hideBanOrgConfirmation();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      logError(error);
    }
  }, [author, courseId, threadId, dispatch, hideBanOrgConfirmation]);

  const handleUnbanCourseConfirmation = useCallback(async (reason) => {
    try {
      await unbanUser(courseId, author, 'course', reason || 'Unbanned from course discussions');
      hideUnbanCourseConfirmation();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      logError(error);
    }
  }, [author, courseId, threadId, dispatch, hideUnbanCourseConfirmation]);

  const handleUnbanOrgConfirmation = useCallback(async (reason) => {
    try {
      await unbanUser(courseId, author, 'organization', reason || 'Unbanned from organization discussions');
      hideUnbanOrgConfirmation();
      dispatch(fetchThread(threadId, courseId));
    } catch (error) {
      logError(error);
    }
  }, [author, courseId, threadId, dispatch, hideUnbanOrgConfirmation]);

  // Mute modal handler - only for learners (staff use submenu)
  const showMuteModal = useCallback(() => {
    showLearnerMuteModal();
  }, [showLearnerMuteModal]);

  const showUnmuteModalHandler = useCallback(() => {
    showLearnerUnmuteModal();
  }, [showLearnerUnmuteModal]);

  // Staff submenu action handlers - show confirmation modals like ban/delete
  const handleMutePersonal = useCallback(() => {
    showMutePersonalConfirmation();
  }, [showMutePersonalConfirmation]);

  const handleMuteCoursewide = useCallback(() => {
    showMuteCourseConfirmation();
  }, [showMuteCourseConfirmation]);

  const handleUnmutePersonal = useCallback(() => {
    showUnmutePersonalConfirmation();
  }, [showUnmutePersonalConfirmation]);

  const handleUnmuteCoursewide = useCallback(() => {
    showUnmuteCourseConfirmation();
  }, [showUnmuteCourseConfirmation]);

  // Mute/Unmute confirmation handlers
  const handleMutePersonalConfirmation = useCallback(() => {
    dispatch(muteUserThunk(author, false));
    hideMutePersonalConfirmation();
  }, [dispatch, author, hideMutePersonalConfirmation]);

  const handleMuteCourseConfirmation = useCallback(() => {
    dispatch(muteUserThunk(author, true));
    hideMuteCourseConfirmation();
  }, [dispatch, author, hideMuteCourseConfirmation]);

  const handleUnmutePersonalConfirmation = useCallback(() => {
    dispatch(unmuteUserThunk(author, false));
    hideUnmutePersonalConfirmation();
  }, [dispatch, author, hideUnmutePersonalConfirmation]);

  const handleUnmuteCourseConfirmation = useCallback(() => {
    dispatch(unmuteUserThunk(author, true));
    hideUnmuteCourseConfirmation();
  }, [dispatch, author, hideUnmuteCourseConfirmation]);

  const actionHandlers = useMemo(() => ({
    [ContentActions.EDIT_CONTENT]: handleEditContent,
    [ContentActions.ENDORSE]: handleReplyEndorse,
    [ContentActions.DELETE]: showDeleteConfirmation,
    [ContentActions.RESTORE]: handleRestore,
    [ContentActions.DELETE_POST]: showDeleteConfirmation,
    [ContentActions.DELETE_USER_COURSE]: showDeleteUserCourseConfirmation,
    [ContentActions.DELETE_USER_ORG]: showDeleteUserOrgConfirmation,
    [ContentActions.BAN_COURSE]: showBanCourseConfirmation,
    [ContentActions.BAN_ORG]: showBanOrgConfirmation,
    [ContentActions.UNBAN_COURSE]: showUnbanCourseConfirmation,
    [ContentActions.UNBAN_ORG]: showUnbanOrgConfirmation,
    [ContentActions.REPORT]: handleAbusedFlag,
    [ContentActions.MUTE_USER]: showMuteModal,
    [ContentActions.UNMUTE_USER]: showUnmuteModalHandler,
    [ContentActions.MUTE_PERSONAL]: handleMutePersonal,
    [ContentActions.MUTE_COURSEWIDE]: handleMuteCoursewide,
    [ContentActions.UNMUTE_PERSONAL]: handleUnmutePersonal,
    [ContentActions.UNMUTE_COURSEWIDE]: handleUnmuteCoursewide,
  }), [
    handleEditContent,
    handleReplyEndorse,
    showDeleteConfirmation,
    handleRestore,
    showDeleteUserCourseConfirmation,
    showDeleteUserOrgConfirmation,
    showBanCourseConfirmation,
    showBanOrgConfirmation,
    showUnbanCourseConfirmation,
    showUnbanOrgConfirmation,
    handleAbusedFlag,
    showMuteModal,
    showUnmuteModalHandler,
    handleMutePersonal,
    handleMuteCoursewide,
    handleUnmutePersonal,
    handleUnmuteCoursewide,
  ]);

  return (
    <div className="d-flex flex-column mt-2.5 " data-testid={`reply-${id}`} role="listitem">
      <Confirmation
        isOpen={isDeleting}
        title={intl.formatMessage(messages.deleteCommentTitle)}
        description={intl.formatMessage(messages.deleteCommentDescription)}
        onClose={hideDeleteConfirmation}
        confirmAction={handleDeleteConfirmation}
        closeButtonVariant="tertiary"
        confirmButtonText={intl.formatMessage(messages.deleteConfirmationDelete)}
      />
      <Confirmation
        isOpen={isRestoring}
        title={intl.formatMessage(messages.undeleteCommentTitle)}
        description={intl.formatMessage(messages.undeleteCommentDescription)}
        onClose={hideRestoreConfirmation}
        confirmAction={handleRestoreConfirmation}
        closeButtonVariant="tertiary"
      />
      {!abuseFlagged && (
        <Confirmation
          isOpen={isReporting}
          title={intl.formatMessage(messages.reportCommentTitle)}
          description={intl.formatMessage(messages.reportCommentDescription)}
          onClose={hideReportConfirmation}
          confirmAction={handleReportConfirmation}
          confirmButtonVariant="danger"
        />
      )}
      <DeleteWithBanConfirmation
        isOpen={isDeletingUserCourse}
        title={intl.formatMessage(discussionMessages.deleteUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.deleteUserCourseDescription, { username: author })}
        onClose={hideDeleteUserCourseConfirmation}
        confirmAction={handleDeleteUserCourseConfirmation}
        showBanCheckbox={enableDiscussionBan}
        banCheckboxLabel={intl.formatMessage(discussionMessages.banUserCheckbox)}
      />
      <DeleteWithBanConfirmation
        isOpen={isDeletingUserOrg}
        title={intl.formatMessage(discussionMessages.deleteUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.deleteUserOrgDescription, { username: author })}
        onClose={hideDeleteUserOrgConfirmation}
        confirmAction={handleDeleteUserOrgConfirmation}
        showBanCheckbox={enableDiscussionBan}
        banCheckboxLabel={intl.formatMessage(discussionMessages.banUserOrgCheckbox)}
      />
      <Confirmation
        isOpen={isBanningCourse}
        title={intl.formatMessage(discussionMessages.banUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.banUserCourseDescription, { username: author })}
        onClose={hideBanCourseConfirmation}
        confirmAction={() => handleBanCourseConfirmation()}
        confirmButtonVariant="danger"
        confirmButtonText={intl.formatMessage(discussionMessages.banButtonText)}
      />
      <Confirmation
        isOpen={isBanningOrg}
        title={intl.formatMessage(discussionMessages.banUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.banUserOrgDescription, { username: author })}
        onClose={hideBanOrgConfirmation}
        confirmAction={() => handleBanOrgConfirmation()}
        confirmButtonVariant="danger"
        confirmButtonText={intl.formatMessage(discussionMessages.banButtonText)}
      />
      <Confirmation
        isOpen={isUnbanningCourse}
        title={intl.formatMessage(discussionMessages.unbanUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.unbanUserCourseDescription, { username: author })}
        onClose={hideUnbanCourseConfirmation}
        confirmAction={() => handleUnbanCourseConfirmation()}
        confirmButtonVariant="primary"
        confirmButtonText={intl.formatMessage(discussionMessages.unbanButtonText)}
      />
      <Confirmation
        isOpen={isUnbanningOrg}
        title={intl.formatMessage(discussionMessages.unbanUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.unbanUserOrgDescription, { username: author })}
        onClose={hideUnbanOrgConfirmation}
        confirmAction={() => handleUnbanOrgConfirmation()}
        confirmButtonVariant="primary"
        confirmButtonText={intl.formatMessage(discussionMessages.unbanButtonText)}
      />
      {/* Mute Modal Manager - handles learner mute modal only */}
      <MuteModalManager
        showLearnerMuteModal={isLearnerMuting}
        showUnmuteModal={isLearnerUnmuting}
        onCloseLearnerMuteModal={hideLearnerMuteModal}
        onCloseUnmuteModal={hideLearnerUnmuteModal}
        username={author}
        contentId={id}
        messages={postMessages}
      />
      {/* Staff Mute Confirmation Modals */}
      <Confirmation
        isOpen={isMutingPersonal}
        title={intl.formatMessage(discussionMessages.mutePersonal)}
        description={intl.formatMessage(
          { id: 'discussions.mute.personal.confirm', defaultMessage: 'Are you sure you want to mute {username}? Their discussion activity will be hidden from you.' },
          { username: author },
        )}
        onClose={hideMutePersonalConfirmation}
        confirmAction={handleMutePersonalConfirmation}
        confirmButtonVariant="danger"
        confirmButtonText={intl.formatMessage(discussionMessages.muteAction)}
      />
      <Confirmation
        isOpen={isMutingCoursewide}
        title={intl.formatMessage(discussionMessages.muteCoursewide)}
        description={intl.formatMessage(
          { id: 'discussions.mute.coursewide.confirm', defaultMessage: 'Are you sure you want to mute {username} course-wide? Their discussion activity will be hidden from all learners.' },
          { username: author },
        )}
        onClose={hideMuteCourseConfirmation}
        confirmAction={handleMuteCourseConfirmation}
        confirmButtonVariant="danger"
        confirmButtonText={intl.formatMessage(discussionMessages.muteAction)}
      />
      <Confirmation
        isOpen={isUnmutingPersonal}
        title={intl.formatMessage(discussionMessages.unmutePersonal)}
        description={intl.formatMessage(
          { id: 'discussions.unmute.personal.confirm', defaultMessage: 'Are you sure you want to unmute {username}? Their discussion activity will become visible to you.' },
          { username: author },
        )}
        onClose={hideUnmutePersonalConfirmation}
        confirmAction={handleUnmutePersonalConfirmation}
        confirmButtonVariant="primary"
        confirmButtonText={intl.formatMessage(discussionMessages.unmuteAction)}
      />
      <Confirmation
        isOpen={isUnmutingCoursewide}
        title={intl.formatMessage(discussionMessages.unmuteCoursewide)}
        description={intl.formatMessage(
          { id: 'discussions.unmute.coursewide.confirm', defaultMessage: 'Are you sure you want to unmute {username} course-wide? Their discussion activity will become visible to all learners.' },
          { username: author },
        )}
        onClose={hideUnmuteCourseConfirmation}
        confirmAction={handleUnmuteCourseConfirmation}
        confirmButtonVariant="primary"
        confirmButtonText={intl.formatMessage(discussionMessages.unmuteAction)}
      />
      {
        hasAnyAlert && (
          <div className="d-flex">
            <div className="d-flex invisible">
              <Avatar />
            </div>
            <div className="w-100">
              <AlertBanner
                author={author}
                abuseFlagged={abuseFlagged}
                closed={closed}
                closedBy={closedBy}
                closeReason={closeReason}
                lastEdit={lastEdit}
                editByLabel={editByLabel}
                closedByLabel={closedByLabel}
                postData={commentData}
              />
            </div>
          </div>
        )
      }
      {
        isSpamFlagged && (
          <div className="d-flex">
            <div className="d-flex invisible">
              <Avatar />
            </div>
            <div className="w-100">
              <AutoSpamAlertBanner autoSpamFlagged={isSpamFlagged} />
            </div>
          </div>
        )
      }
      {isDeleted && deletedBy && (
        <div className="d-flex">
          <div className="d-flex invisible">
            <Avatar />
          </div>
          <div className="w-100">
            <div className="alert alert-info px-3 shadow-none mb-1 py-10px bg-light-200 d-flex align-items-start">
              <DeleteOutline className="mr-2 text-dark-500 flex-shrink-0 deleted-content-icon" />
              <div className="d-flex align-items-center flex-wrap text-gray-700 font-style">
                {intl.formatMessage(messages.deletedBy)}
                <span className="ml-1">
                  <AuthorLabel
                    author={deletedBy}
                    authorLabel={deletedByLabel}
                    labelColor={AvatarOutlineAndLabelColors[deletedByLabel] && `text-${AvatarOutlineAndLabelColors[deletedByLabel]}`}
                    linkToProfile
                    postOrComment
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex">
        <div className="d-flex mr-3 mt-2.5">
          <Avatar
            className={`ml-0.5 mt-0.5 border-0 ${colorClass ? `outline-${colorClass}` : 'outline-anonymous'}`}
            alt={author}
            src={authorAvatar?.imageUrlSmall}
            style={{
              width: '32px',
              height: '32px',
            }}
          />
        </div>
        <div
          className="bg-light-300 pl-4 pt-2.5 pr-2.5 pb-10px flex-fill"
          style={{ borderRadius: '0rem 0.375rem 0.375rem', maxWidth: 'calc(100% - 50px)' }}
        >
          <div className="d-flex flex-row justify-content-between">
            <AuthorLabel
              author={author}
              authorLabel={authorLabel}
              labelColor={colorClass && `text-${colorClass}`}
              linkToProfile
              postCreatedAt={createdAt}
              postOrComment
              postData={commentData}
            />
            <div className="ml-auto d-flex">
              <ActionsDropdown
                actionHandlers={actionHandlers}
                contentType={ContentTypes.COMMENT}
                iconSize="inline"
                id={id}
                disabled={isUserBanned}
              />
            </div>
          </div>
          {isEditing ? (
            <CommentEditor
              comment={{
                id,
                threadId,
                parentId,
                rawBody,
                author,
                lastEdit,
              }}
              onCloseEditor={handleCloseEditor}
            />
          ) : (
            <HTMLLoader
              componentId="reply"
              htmlNode={renderedBody}
              cssClassName="html-loader text-break font-style text-primary-500"
              testId={id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

Reply.propTypes = {
  responseId: PropTypes.string.isRequired,
};

export default React.memo(Reply);
