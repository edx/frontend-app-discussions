import React, {
  useCallback, useContext, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';

import { Hyperlink, useToggle } from '@openedx/paragon';
import classNames from 'classnames';
import { toString } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import HTMLLoader from '../../../components/HTMLLoader';
import {
  banUser, bulkDeleteUserPosts, bulkUndeleteUserPosts, unbanUser,
} from '../../../data/api/moderation';
import { ContentActions, getFullUrl } from '../../../data/constants';
import { selectorForUnitSubsection, selectTopicContext } from '../../../data/selectors';
import {
  AlertBanner, AutoSpamAlertBanner, BanModerationModals, Confirmation, DeletedByBanner, MuteModalManager,
} from '../../common';
import DiscussionContext from '../../common/context';
import HoverCard from '../../common/HoverCard';
import withPostingRestrictions from '../../common/withPostingRestrictions';
import { ContentTypes } from '../../data/constants';
import {
  selectContentCreationRateLimited,
  selectIsUserBanned,
  selectShouldShowEmailConfirmation,
  selectUserCanBanAtCourseLevel,
  selectUserHasModerationPrivileges,
} from '../../data/selectors';
import { muteUserThunk, unmuteUserThunk } from '../../data/thunks';
import discussionMessages from '../../messages';
import { selectTopic } from '../../topics/data/selectors';
import { getAuthorRoles, truncatePath } from '../../utils';
import { selectThread } from '../data/selectors';
import {
  fetchThread,
  removeThread,
  updateExistingThread,
} from '../data/thunks';
import ClosePostReasonModal from './ClosePostReasonModal';
import messages from './messages';
import PostFooter from './PostFooter';
import PostHeader from './PostHeader';

// Modal type constants
const MODAL_TYPES = {
  DELETE: 'delete',
  DELETE_USER: 'deleteUser',
  UNDELETE_USER: 'undeleteUser',
  BAN: 'ban',
  UNBAN: 'unban',
  RESTORE: 'restore',
  REPORT: 'report',
  CLOSE: 'close',
  MUTE: 'mute',
  UNMUTE: 'unmute',
};

// Scope constants
const SCOPES = {
  COURSE: 'course',
  ORGANIZATION: 'organization',
};

const Post = ({ handleAddResponseButton, openRestrictionDialogue }) => {
  const { enableInContextSidebar, postId, courseId } = useContext(DiscussionContext);

  const threadData = useSelector(selectThread(postId));
  const {
    topicId,
    abuseFlagged,
    closed,
    pinned,
    voted,
    hasEndorsed,
    following,
    closedBy,
    voteCount,
    groupId,
    groupName,
    closeReason,
    authorLabel: rawAuthorLabel,
    authorLabels,
    type: postType,
    author,
    title,
    createdAt,
    renderedBody,
    lastEdit,
    editByLabel,
    closedByLabel,
    users: postUsers,
    isDeleted,
    deletedBy,
    deletedByLabel,
    is_spam: isSpam,
  } = threadData;

  // Prefer the new authorLabels array when available; fall back to the legacy string.
  // This keeps a single variable flowing through the entire component tree.
  const authorLabel = (authorLabels && authorLabels.length > 0) ? authorLabels : rawAuthorLabel;

  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const topic = useSelector(selectTopic(topicId));
  const getTopicSubsection = useSelector(selectorForUnitSubsection);
  const topicContext = useSelector(selectTopicContext(topicId));
  // const [isDeleting, showDeleteConfirmation, hideDeleteConfirmation] = useToggle(false);
  // const [isRestoring, showRestoreConfirmation, hideRestoreConfirmation] = useToggle(false);
  // Mute modal states (learner only - staff use submenu with confirmation)
  const [isLearnerMuting, showLearnerMuteModal, hideLearnerMuteModal] = useToggle(false);
  const [isLearnerUnmuting, showLearnerUnmuteModal, hideLearnerUnmuteModal] = useToggle(false);
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const canBanAtCourseLevel = useSelector(selectUserCanBanAtCourseLevel);
  const userRoles = useSelector(state => state.config.userRoles);
  const isGlobalStaff = useSelector(state => state.config.isUserAdmin);

  // Compute shouldShowBanOption per authority table
  const userIsAdmin = (userRoles || []).includes('Administrator');
  const userIsModerator = (userRoles || []).includes('Moderator');
  const userHasDiscussionRole = userIsAdmin || userIsModerator;

  // Check target user's role badges (authorLabel can be comma-separated for multi-role users)
  const targetRoles = getAuthorRoles(authorLabel);

  const targetIsGlobalStaff = targetRoles.includes('Global Staff')
    || targetRoles.includes('Staff');

  const targetIsDiscussionAdmin = targetRoles.includes('Administrator');

  const targetIsDiscussionModerator = targetRoles.includes('Moderator');

  const targetHasPrivilegedRole = targetIsGlobalStaff
    || targetIsDiscussionAdmin
    || targetIsDiscussionModerator;

  let shouldShowBanOption = true;

  // Global Staff without discussion role cannot ban privileged users
  if (
    isGlobalStaff
    && !userHasDiscussionRole
    && targetHasPrivilegedRole
  ) {
    shouldShowBanOption = false;
  }
  // Discussion Moderator cannot ban another Moderator or Admin
  if (userIsModerator && !userIsAdmin && (targetIsDiscussionModerator || targetIsDiscussionAdmin)) {
    shouldShowBanOption = false;
  }
  // Discussion Admin cannot ban another Admin
  if (userIsAdmin && targetIsDiscussionAdmin) {
    shouldShowBanOption = false;
  }

  const shouldShowEmailConfirmation = useSelector(selectShouldShowEmailConfirmation);
  const enableDiscussionBan = useSelector(state => state.config.enableDiscussionBan);
  const contentCreationRateLimited = useSelector(selectContentCreationRateLimited);
  const isUserBanned = useSelector(selectIsUserBanned);

  // Consolidated modal state management
  const [activeModal, setActiveModal] = useState({ type: null, scope: null });
  const [isProcessing, setIsProcessing] = useState(false);

  // Unified modal control functions
  const showModal = useCallback((type, scope = null) => {
    setActiveModal({ type, scope });
  }, []);

  const hideModal = useCallback(() => {
    setActiveModal({ type: null, scope: null });
  }, []);

  // Mute modal handler - only for learners (staff use submenu)
  const showMuteModal = useCallback(() => {
    showLearnerMuteModal();
  }, [showLearnerMuteModal]);

  const showUnmuteModalHandler = useCallback(() => {
    showLearnerUnmuteModal();
  }, [showLearnerUnmuteModal]);

  // Staff submenu action handlers - show confirmation modals like ban/delete
  const handleMutePersonal = useCallback(() => {
    showModal(MODAL_TYPES.MUTE, false);
  }, [showModal]);

  const handleMuteCoursewide = useCallback(() => {
    showModal(MODAL_TYPES.MUTE, true);
  }, [showModal]);

  const handleUnmutePersonal = useCallback(() => {
    showModal(MODAL_TYPES.UNMUTE, false);
  }, [showModal]);

  const handleUnmuteCoursewide = useCallback(() => {
    showModal(MODAL_TYPES.UNMUTE, true);
  }, [showModal]);

  // Mute/Unmute confirmation handlers
  const handleMuteConfirmation = useCallback(() => {
    const isCourseWide = activeModal.scope === true;
    dispatch(muteUserThunk(author, isCourseWide));
    hideModal();
  }, [dispatch, author, activeModal.scope, hideModal]);

  const handleUnmuteConfirmation = useCallback(() => {
    const isCourseWide = activeModal.scope === true;
    dispatch(unmuteUserThunk(author, isCourseWide));
    hideModal();
  }, [dispatch, author, activeModal.scope, hideModal]);

  // Computed modal states based on activeModal
  const isClosing = activeModal.type === MODAL_TYPES.CLOSE;
  const isReporting = activeModal.type === MODAL_TYPES.REPORT;
  const isRestoring = activeModal.type === MODAL_TYPES.RESTORE;
  const isMuting = activeModal.type === MODAL_TYPES.MUTE;
  const isUnmuting = activeModal.type === MODAL_TYPES.UNMUTE;

  // Compute modal state string for BanModerationModals component
  const getActiveModalString = () => {
    if (activeModal.type === MODAL_TYPES.DELETE) { return 'delete'; }
    if (activeModal.type === MODAL_TYPES.DELETE_USER) {
      return activeModal.scope === SCOPES.COURSE ? 'deleteUserCourse' : 'deleteUserOrg';
    }
    if (activeModal.type === MODAL_TYPES.UNDELETE_USER) {
      return activeModal.scope === SCOPES.COURSE ? 'undeleteUserCourse' : 'undeleteUserOrg';
    }
    if (activeModal.type === MODAL_TYPES.BAN) {
      return activeModal.scope === SCOPES.COURSE ? 'banCourse' : 'banOrg';
    }
    if (activeModal.type === MODAL_TYPES.UNBAN) {
      return activeModal.scope === SCOPES.COURSE ? 'unbanCourse' : 'unbanOrg';
    }
    return null;
  };

  // If isSpam is not provided in the API response, default to false
  const isSpamFlagged = isSpam || false;
  const displayPostFooter = following || voteCount || closed || (groupId && userHasModerationPrivileges);

  const handleDeleteConfirmation = useCallback(async (shouldBan) => {
    const basePath = truncatePath(location.pathname);

    if (shouldBan && enableDiscussionBan) {
      setIsProcessing(true);
      try {
        await banUser(courseId, author, 'course', 'User banned when deleting post');
      } catch (error) {
        const errorMsg = error?.message || String(error) || 'Unknown error';
        logError(`Error banning user: ${errorMsg}`);
      } finally {
        setIsProcessing(false);
      }
    }

    await dispatch(removeThread(postId));
    navigate({
      pathname: basePath,
      search: enableInContextSidebar && '?inContextSidebar',
    });
    hideModal();
  }, [enableInContextSidebar, postId, hideModal, courseId, author, enableDiscussionBan, dispatch]);

  const handleReportConfirmation = useCallback(() => {
    dispatch(updateExistingThread(postId, { flagged: !abuseFlagged }));
    hideModal();
  }, [abuseFlagged, postId, hideModal]);

  const handlePostContentEdit = useCallback(() => navigate({
    ...location,
    pathname: `${location.pathname}/edit`,
  }), [location.pathname]);

  const handlePostClose = useCallback(() => {
    if (closed) {
      dispatch(updateExistingThread(postId, { closed: false }));
    } else {
      showModal(MODAL_TYPES.CLOSE);
    }
  }, [closed, postId, showModal]);

  const handlePostCopyLink = useCallback(() => {
    navigator.clipboard.writeText(getFullUrl(`${courseId}/posts/${postId}`));
  }, [window.location.origin, postId, courseId]);

  const handlePostPin = useCallback(() => dispatch(
    updateExistingThread(postId, { pinned: !pinned }),
  ), [postId, pinned]);

  const handlePostLike = useCallback(() => {
    dispatch(updateExistingThread(postId, { voted: !voted }));
  }, [postId, voted]);

  const handlePostReport = useCallback(() => {
    if (abuseFlagged) {
      dispatch(updateExistingThread(postId, { flagged: !abuseFlagged }));
    } else {
      showModal(MODAL_TYPES.REPORT);
    }
  }, [abuseFlagged, postId, showModal]);

  const handleRestore = useCallback(() => {
    showModal(MODAL_TYPES.RESTORE);
  }, [showModal]);

  const handleRestoreConfirmation = useCallback(async () => {
    try {
      const { performRestoreThread } = await import('../data/thunks');
      const result = await dispatch(performRestoreThread(postId, courseId));
      // Check if restore failed and log the error
      if (result && !result.success) {
        logError(`Failed to restore thread: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      logError(error);
    }
    hideModal();
  }, [postId, courseId, dispatch, hideModal]);

  const handleDeleteUserCourseConfirmation = useCallback(async (shouldBan) => {
    // Defensive check - author must be defined
    if (!author) {
      logError('Bulk delete operation attempted without author');
      hideModal();
      return;
    }
    setIsProcessing(true);
    try {
      // Only ban if flag is enabled (defensive check)
      await bulkDeleteUserPosts(courseId, author, 'course', shouldBan && enableDiscussionBan);
      hideModal();
      dispatch(fetchThread(postId, courseId, false));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error during bulk delete (course): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, hideModal, postId, dispatch, enableDiscussionBan]);

  const handleDeleteUserOrgConfirmation = useCallback(async (shouldBan) => {
    // Defensive check - author must be defined
    if (!author) {
      logError('Bulk delete operation attempted without author');
      hideModal();
      return;
    }
    setIsProcessing(true);
    try {
      // Only ban if flag is enabled (defensive check)
      await bulkDeleteUserPosts(courseId, author, 'organization', shouldBan && enableDiscussionBan);
      hideModal();
      dispatch(fetchThread(postId, courseId, false));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error during bulk delete (org): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, hideModal, postId, dispatch, enableDiscussionBan]);

  const handleUndeleteUserCourseConfirmation = useCallback(async () => {
    setIsProcessing(true);
    try {
      await bulkUndeleteUserPosts(courseId, author, 'course');
      hideModal();
      // Optimistic - no refetch needed, undeletion handled by backend
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error during bulk undelete (course): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, hideModal]);

  const handleUndeleteUserOrgConfirmation = useCallback(async () => {
    setIsProcessing(true);
    try {
      await bulkUndeleteUserPosts(courseId, author, 'organization');
      hideModal();
      // Optimistic - no refetch needed, undeletion handled by backend
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error during bulk undelete (org): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, hideModal]);

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
    setIsProcessing(true);
    try {
      await banUser(courseId, author, 'course', 'Banned from course discussions');
      hideModal();
      dispatch(fetchThread(postId, courseId, false));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error banning user (course): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, postId, dispatch, hideModal, enableDiscussionBan]);

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
    setIsProcessing(true);
    try {
      await banUser(courseId, author, 'organization', 'Banned from organization discussions');
      hideModal();
      dispatch(fetchThread(postId, courseId, false));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error banning user (org): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, postId, dispatch, hideModal, enableDiscussionBan]);

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
    setIsProcessing(true);
    try {
      await unbanUser(courseId, author, 'course', 'Unbanned from course discussions');
      hideModal();
      dispatch(fetchThread(postId, courseId, false));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error unbanning user (course): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, postId, dispatch, hideModal, enableDiscussionBan]);

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
    setIsProcessing(true);
    try {
      await unbanUser(courseId, author, 'organization', 'Unbanned from organization discussions');
      hideModal();
      dispatch(fetchThread(postId, courseId, false));
    } catch (error) {
      const errorMsg = error?.message || String(error) || 'Unknown error';
      logError(`Error unbanning user (org): ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, author, postId, dispatch, hideModal, enableDiscussionBan]);

  const actionHandlers = useMemo(() => ({
    [ContentActions.EDIT_CONTENT]: handlePostContentEdit,
    [ContentActions.DELETE]: () => showModal(MODAL_TYPES.DELETE),
    [ContentActions.DELETE_POST]: () => showModal(MODAL_TYPES.DELETE),
    [ContentActions.DELETE_USER_COURSE]: () => showModal(MODAL_TYPES.DELETE_USER, SCOPES.COURSE),
    [ContentActions.DELETE_USER_ORG]: () => showModal(MODAL_TYPES.DELETE_USER, SCOPES.ORGANIZATION),
    [ContentActions.UNDELETE_USER_COURSE]: () => showModal(MODAL_TYPES.UNDELETE_USER, SCOPES.COURSE),
    [ContentActions.UNDELETE_USER_ORG]: () => showModal(MODAL_TYPES.UNDELETE_USER, SCOPES.ORGANIZATION),
    [ContentActions.BAN_COURSE]: () => showModal(MODAL_TYPES.BAN, SCOPES.COURSE),
    [ContentActions.BAN_ORG]: () => showModal(MODAL_TYPES.BAN, SCOPES.ORGANIZATION),
    [ContentActions.UNBAN_COURSE]: () => showModal(MODAL_TYPES.UNBAN, SCOPES.COURSE),
    [ContentActions.UNBAN_ORG]: () => showModal(MODAL_TYPES.UNBAN, SCOPES.ORGANIZATION),
    [ContentActions.RESTORE]: handleRestore,
    [ContentActions.CLOSE]: handlePostClose,
    [ContentActions.COPY_LINK]: handlePostCopyLink,
    [ContentActions.PIN]: handlePostPin,
    [ContentActions.REPORT]: handlePostReport,
    [ContentActions.MUTE_USER]: showMuteModal,
    [ContentActions.UNMUTE_USER]: showUnmuteModalHandler,
    [ContentActions.MUTE_PERSONAL]: handleMutePersonal,
    [ContentActions.MUTE_COURSEWIDE]: handleMuteCoursewide,
    [ContentActions.UNMUTE_PERSONAL]: handleUnmutePersonal,
    [ContentActions.UNMUTE_COURSEWIDE]: handleUnmuteCoursewide,
  }), [
    handlePostClose,
    handlePostContentEdit,
    handlePostCopyLink,
    handlePostPin,
    handlePostReport,
    showMuteModal,
    showUnmuteModalHandler,
    handleMutePersonal,
    handleMuteCoursewide,
    handleUnmutePersonal,
    handleUnmuteCoursewide,
    handleRestore,
    handleRestoreConfirmation,
    showModal,
  ]);

  const handleClosePostConfirmation = useCallback((closeReasonCode) => {
    dispatch(updateExistingThread(postId, { closed: true, closeReasonCode }));
    hideModal();
  }, [postId, hideModal]);

  const handlePostFollow = useCallback(() => {
    dispatch(updateExistingThread(postId, { following: !following }));
  }, [postId, following]);

  const getTopicCategoryName = useCallback(topicData => (
    topicData.usageKey ? getTopicSubsection(topicData.usageKey)?.displayName : topicData.categoryId
  ), [getTopicSubsection]);

  const getTopicInfo = useCallback(topicData => (
    getTopicCategoryName(topicData) ? `${getTopicCategoryName(topicData)} / ${topicData.name}` : `${topicData.name}`
  ), [getTopicCategoryName]);

  return (
    <div
      className="d-flex flex-column w-100 mw-100 post-card-comment overflow-auto"
      data-testid={`post-${postId}`}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex="0"
    >
      <BanModerationModals
        author={author}
        activeModal={getActiveModalString()}
        onClose={hideModal}
        onDeleteWithBan={handleDeleteConfirmation}
        onDeleteUserCourse={handleDeleteUserCourseConfirmation}
        onDeleteUserOrg={handleDeleteUserOrgConfirmation}
        onUndeleteUserCourse={handleUndeleteUserCourseConfirmation}
        onUndeleteUserOrg={handleUndeleteUserOrgConfirmation}
        onBanCourse={handleBanCourseConfirmation}
        onBanOrg={handleBanOrgConfirmation}
        onUnbanCourse={handleUnbanCourseConfirmation}
        onUnbanOrg={handleUnbanOrgConfirmation}
        isProcessing={isProcessing}
        enableDiscussionBan={enableDiscussionBan}
        showBanCheckboxOnDelete={shouldShowBanOption && canBanAtCourseLevel && enableDiscussionBan}
        deleteTitle={intl.formatMessage(messages.deletePostTitle)}
        deleteDescription={intl.formatMessage(messages.deletePostDescription)}
        deleteConfirmText={intl.formatMessage(messages.deleteConfirmationDelete)}
      />
      <Confirmation
        isOpen={isRestoring}
        title={intl.formatMessage(messages.undeletePostTitle)}
        description={intl.formatMessage(messages.undeletePostDescription)}
        onClose={hideModal}
        confirmAction={handleRestoreConfirmation}
        closeButtonVariant="tertiary"
      />
      {!abuseFlagged && (
        <Confirmation
          isOpen={isReporting}
          title={intl.formatMessage(messages.reportPostTitle)}
          description={intl.formatMessage(messages.reportPostDescription)}
          onClose={hideModal}
          confirmAction={handleReportConfirmation}
          confirmButtonVariant="danger"
        />
      )}
      {/* Mute Modal Manager - handles learner mute modal only */}
      <MuteModalManager
        showLearnerMuteModal={isLearnerMuting}
        showUnmuteModal={isLearnerUnmuting}
        onCloseLearnerMuteModal={hideLearnerMuteModal}
        onCloseUnmuteModal={hideLearnerUnmuteModal}
        username={author}
        contentId={postId}
        messages={messages}
      />
      {/* Staff Mute Confirmation Modal */}
      {isMuting && (
        <Confirmation
          isOpen={isMuting}
          title={intl.formatMessage(
            activeModal.scope === true
              ? discussionMessages.muteCoursewide
              : discussionMessages.mutePersonal,
          )}
          description={intl.formatMessage(
            activeModal.scope === true
              ? { id: 'discussions.mute.coursewide.confirm', defaultMessage: 'Are you sure you want to mute {username} course-wide? Their discussion activity will be hidden from all learners.' }
              : { id: 'discussions.mute.personal.confirm', defaultMessage: 'Are you sure you want to mute {username}? Their discussion activity will be hidden from you.' },
            { username: author },
          )}
          onClose={hideModal}
          confirmAction={handleMuteConfirmation}
          confirmButtonVariant="danger"
          confirmButtonText={intl.formatMessage(discussionMessages.muteAction)}
        />
      )}
      {/* Staff Unmute Confirmation Modal */}
      {isUnmuting && (
        <Confirmation
          isOpen={isUnmuting}
          title={intl.formatMessage(
            activeModal.scope === true
              ? discussionMessages.unmuteCoursewide
              : discussionMessages.unmutePersonal,
          )}
          description={intl.formatMessage(
            activeModal.scope === true
              ? { id: 'discussions.unmute.coursewide.confirm', defaultMessage: 'Are you sure you want to unmute {username} course-wide? Their discussion activity will become visible to all learners.' }
              : { id: 'discussions.unmute.personal.confirm', defaultMessage: 'Are you sure you want to unmute {username}? Their discussion activity will become visible to you.' },
            { username: author },
          )}
          onClose={hideModal}
          confirmAction={handleUnmuteConfirmation}
          confirmButtonVariant="primary"
          confirmButtonText={intl.formatMessage(discussionMessages.unmuteAction)}
        />
      )}
      <HoverCard
        id={postId}
        contentType={ContentTypes.POST}
        actionHandlers={actionHandlers}
        handleResponseCommentButton={shouldShowEmailConfirmation || contentCreationRateLimited
          ? openRestrictionDialogue : handleAddResponseButton}
        addResponseCommentButtonMessage={intl.formatMessage(messages.addResponse)}
        onLike={handlePostLike}
        onFollow={handlePostFollow}
        voted={voted}
        following={following}
        isDeleted={isDeleted}
        isUserBanned={isUserBanned}
      />
      {
        isDeleted && deletedBy && (
          <DeletedByBanner
            deletedBy={deletedBy}
            deletedByLabel={deletedByLabel}
            message={intl.formatMessage(messages.deletedBy)}
            postData={threadData}
          />
        )
      }
      <AlertBanner
        author={author}
        abuseFlagged={abuseFlagged}
        lastEdit={lastEdit}
        closed={closed}
        closedBy={closedBy}
        closeReason={closeReason}
        editByLabel={editByLabel}
        closedByLabel={closedByLabel}
        postData={threadData}
      />
      <AutoSpamAlertBanner autoSpamFlagged={isSpamFlagged} />
      <PostHeader
        abuseFlagged={abuseFlagged}
        author={author}
        authorLabel={authorLabel}
        closed={closed}
        createdAt={createdAt}
        hasEndorsed={hasEndorsed}
        lastEdit={lastEdit}
        postType={postType}
        title={title}
        postUsers={postUsers}
        postData={threadData}
      />
      <div className="d-flex mt-14px text-break font-style text-primary-500">
        <HTMLLoader htmlNode={renderedBody} componentId="post" cssClassName="html-loader w-100" testId={postId} />
      </div>
      {
        (topicContext || topic) && (
          <div
            className={classNames('mt-14px font-style', { 'w-100': enableInContextSidebar, 'mb-1': !displayPostFooter })}
            style={{ lineHeight: '20px' }}
          >
            <span className="text-gray-500" style={{ lineHeight: '20px' }}>
              {intl.formatMessage(messages.relatedTo)}{' '}
            </span>
            <Hyperlink
              target="_top"
              destination={topicContext ? (
                topicContext.unitLink
              ) : (
                `${getConfig().BASE_URL}/${courseId}/topics/${topicId}`
              )}
            >
              {(topicContext && !topic) ? (
                <span>
                  {topicContext.chapterName} / {topicContext.verticalName} / {topicContext.unitName}
                </span>
              ) : (
                getTopicInfo(topic)
              )}
            </Hyperlink>
          </div>
        )
      }
      {
        displayPostFooter && (
          <PostFooter
            id={postId}
            voteCount={voteCount}
            voted={voted}
            following={following}
            groupId={toString(groupId)}
            groupName={groupName}
            closed={closed}
            userHasModerationPrivileges={userHasModerationPrivileges}
            isUserBanned={isUserBanned}
          />
        )
      }
      <ClosePostReasonModal
        isOpen={isClosing}
        onCancel={hideModal}
        onConfirm={handleClosePostConfirmation}
      />
    </div>
  );
};

Post.propTypes = {
  handleAddResponseButton: PropTypes.func.isRequired,
  openRestrictionDialogue: PropTypes.func.isRequired,
};

export default React.memo(withPostingRestrictions(Post));
