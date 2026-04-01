import React, {
  useCallback, useContext, useEffect, useMemo, useState,
} from 'react';

import {
  Button, Icon, IconButton, Spinner,
} from '@openedx/paragon';
import { ArrowBack, Block, Institution } from '@openedx/paragon/icons';
import capitalize from 'lodash/capitalize';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { useIntl } from '@edx/frontend-platform/i18n';

import {
  ContentActions,
  RequestStatus,
  Routes,
} from '../../data/constants';
import useDispatchWithState from '../../data/hooks';
import { Confirmation } from '../common';
import DiscussionContext from '../common/context';
import {
  selectUserHasBulkDeletePrivileges,
  selectUserHasModerationPrivileges,
  selectUserIsStaff,
} from '../data/selectors';
import discussionMessages from '../messages';
import usePostList from '../posts/data/hooks';
import {
  selectAllThreadsIds,
  selectThreadNextPage,
  threadsLoadingStatus,
} from '../posts/data/selectors';
import { clearPostsPages } from '../posts/data/slices';
import { fetchThread } from '../posts/data/thunks';
import NoResults from '../posts/NoResults';
import { PostLink } from '../posts/post';
import DeleteWithBanConfirmation from '../posts/post/DeleteWithBanConfirmation';
import { discussionsPath } from '../utils';
import { BAN_SCOPES, BulkDeleteType } from './data/constants';
import {
  learnersLoadingStatus,
  selectBannedUsers,
  selectBulkDeleteStats,
  selectCourseWideMutedUsers,
  selectPersonalMutedUsers,
} from './data/selectors';
import {
  banUser,
  deleteUserActivity,
  deleteUserPosts,
  fetchBannedUsers,
  fetchUserPosts,
  unbanUser,
  undeleteUserPosts,
} from './data/thunks';
import LearnerPostFilterBar from './learner-post-filter-bar/LearnerPostFilterBar';
import LearnerActionsDropdown from './LearnerActionsDropdown';
import messages from './messages';

// Modal type constants
const MODAL_TYPES = {
  DELETE: 'delete',
  RESTORE: 'restore',
  BAN: 'ban',
  UNBAN: 'unban',
  DELETE_USER: 'deleteUser',
};

const LearnerPostsView = () => {
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authenticatedUser = getAuthenticatedUser();

  const [bulkDeleting, dispatchDelete] = useDispatchWithState();
  const postsIds = useSelector(selectAllThreadsIds);
  const loadingStatus = useSelector(threadsLoadingStatus());
  const learnerLoadingStatus = useSelector(learnersLoadingStatus());
  const postFilter = useSelector(state => state.learners.postFilter);
  const {
    courseId, learnerUsername: username, postId, enableDiscussionBan,
  } = useContext(DiscussionContext);
  const nextPage = useSelector(selectThreadNextPage());
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const userIsStaff = useSelector(selectUserIsStaff);
  const userHasBulkDeletePrivileges = useSelector(selectUserHasBulkDeletePrivileges);
  // Only show bulk actions to users with actual moderation privileges (not Course Staff/Admin)
  const canAccessBulkActions = userHasModerationPrivileges && userHasBulkDeletePrivileges;
  const personalMutedUsers = useSelector(selectPersonalMutedUsers());
  const courseWideMutedUsers = useSelector(selectCourseWideMutedUsers());
  const bulkDeleteStats = useSelector(selectBulkDeleteStats());
  const bannedUsers = useSelector(selectBannedUsers);
  const sortedPostsIds = usePostList(postsIds, username);
  const [activeModal, setActiveModal] = useState({ type: null, scope: null });
  const [isDeletingCourseOrOrg, setIsDeletingCourseOrOrg] = useState(BulkDeleteType.COURSE);
  const [isRestoringCourseOrOrg, setIsRestoringCourseOrOrg] = useState(BulkDeleteType.COURSE);
  const [isLoadingRestoreData, setIsLoadingRestoreData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Unified modal control functions
  const showModal = useCallback((type, scope = null) => {
    setActiveModal({ type, scope });
  }, []);

  const hideModal = useCallback(() => {
    setActiveModal({ type: null, scope: null });
  }, []);

  // Computed modal state
  const isDeleting = activeModal.type === MODAL_TYPES.DELETE;
  const isRestoring = activeModal.type === MODAL_TYPES.RESTORE;
  const isBanningCourse = activeModal.type === MODAL_TYPES.BAN && activeModal.scope === BAN_SCOPES.COURSE;
  const isBanningOrg = activeModal.type === MODAL_TYPES.BAN && activeModal.scope === BAN_SCOPES.ORGANIZATION;
  const isUnbanningCourse = activeModal.type === MODAL_TYPES.UNBAN && activeModal.scope === BAN_SCOPES.COURSE;
  const isUnbanningOrg = activeModal.type === MODAL_TYPES.UNBAN && activeModal.scope === BAN_SCOPES.ORGANIZATION;
  const isDeletingUserCourse = (
    activeModal.type === MODAL_TYPES.DELETE_USER && activeModal.scope === BAN_SCOPES.COURSE
  );
  const isDeletingUserOrg = (
    activeModal.type === MODAL_TYPES.DELETE_USER && activeModal.scope === BAN_SCOPES.ORGANIZATION
  );

  const loadMorePosts = useCallback((pageNum = undefined) => {
    // Check if the specific learner whose posts we're viewing is muted
    const personalMutedUsernames = personalMutedUsers.map(user => (typeof user === 'string' ? user : (user.username || user.mutedUser?.username))).filter(Boolean);
    const courseWideMutedUsernames = courseWideMutedUsers.map(user => (typeof user === 'string' ? user : (user.username || user.mutedUser?.username))).filter(Boolean);

    const isUserMuted = personalMutedUsernames.includes(username)
      || courseWideMutedUsernames.includes(username);

    const params = {
      author: username,
      page: pageNum,
      filters: postFilter,
      orderBy: postFilter.orderBy,
      countFlagged: (userHasModerationPrivileges || userIsStaff) || undefined,
      includeMuted: isUserMuted, // Only include muted content if viewing a muted user's posts
    };

    dispatch(fetchUserPosts(courseId, params));
  }, [
    courseId, postFilter, username, userHasModerationPrivileges, userIsStaff,
    personalMutedUsers, courseWideMutedUsers,
  ]);

  const handleShowDeleteConfirmation = useCallback(async (courseOrOrg) => {
    setIsDeletingCourseOrOrg(courseOrOrg);
    showModal(MODAL_TYPES.DELETE);
    await dispatch(deleteUserPosts(courseId, username, courseOrOrg, false));
  }, [courseId, username, showModal, dispatch]);

  const handleDeletePosts = useCallback(async (courseOrOrg) => {
    await dispatchDelete(deleteUserPosts(courseId, username, courseOrOrg, true));
    dispatch(clearPostsPages());
    loadMorePosts();
    hideModal();
    // If viewing a post, refresh it to show deleted state
    if (postId) {
      await dispatch(fetchThread(postId, courseId));
    } else {
      // Navigate back to learners list after deletion
      navigate({ ...discussionsPath(Routes.LEARNERS.PATH, { courseId })(location) });
    }
  }, [courseId, username, hideModal, dispatchDelete, navigate, location, postId, dispatch, loadMorePosts]);

  const handleShowRestoreConfirmation = useCallback(async (courseOrOrg) => {
    setIsRestoringCourseOrOrg(courseOrOrg);
    setIsLoadingRestoreData(true);
    showModal(MODAL_TYPES.RESTORE);
    await dispatch(undeleteUserPosts(courseId, username, courseOrOrg, false));
    setIsLoadingRestoreData(false);
  }, [courseId, username, showModal, dispatch]);

  const handleRestorePosts = useCallback(async (courseOrOrg) => {
    await dispatch(undeleteUserPosts(courseId, username, courseOrOrg, true));
    hideModal();
    // If viewing a post, refresh it to show restored state
    if (postId) {
      await dispatch(fetchThread(postId, courseId));
    }
    // Navigate back to learners list after restoration
    navigate({ ...discussionsPath(Routes.LEARNERS.PATH, { courseId })(location) });
  }, [courseId, username, hideModal, dispatch, navigate, location, postId]);

  const handleBanUser = useCallback(async (scope) => {
    // Defensive check - feature must be enabled
    if (!enableDiscussionBan) {
      hideModal();
      return;
    }
    // Defensive check - username must be defined
    if (!username) {
      hideModal();
      return;
    }
    setIsProcessing(true);
    await dispatch(banUser(courseId, username, scope));
    hideModal();
    setIsProcessing(false);
  }, [courseId, username, dispatch, hideModal, enableDiscussionBan]);

  const handleUnbanUser = useCallback(async (scope) => {
    // Defensive check - feature must be enabled
    if (!enableDiscussionBan) {
      hideModal();
      return;
    }
    // Defensive check - username must be defined
    if (!username) {
      hideModal();
      return;
    }
    setIsProcessing(true);
    await dispatch(unbanUser(courseId, username, scope));
    hideModal();
    setIsProcessing(false);
  }, [courseId, username, dispatch, hideModal, enableDiscussionBan]);

  const handleDeleteActivity = useCallback(async (scope, shouldBan = false) => {
    setIsProcessing(true);
    // Only ban if flag is enabled (defensive check)
    await dispatch(deleteUserActivity(courseId, username, scope, shouldBan && enableDiscussionBan));
    hideModal();
    // Refresh the posts list after deletion
    loadMorePosts(1);
    setIsProcessing(false);
  }, [courseId, username, dispatch, enableDiscussionBan, loadMorePosts, hideModal]);

  const actionHandlers = useMemo(() => ({
    [ContentActions.DELETE_COURSE_POSTS]: () => handleShowDeleteConfirmation(BulkDeleteType.COURSE),
    [ContentActions.DELETE_ORG_POSTS]: () => handleShowDeleteConfirmation(BulkDeleteType.ORG),
    [ContentActions.RESTORE_COURSE_POSTS]: () => handleShowRestoreConfirmation(BulkDeleteType.COURSE),
    [ContentActions.RESTORE_ORG_POSTS]: () => handleShowRestoreConfirmation(BulkDeleteType.ORG),
    [ContentActions.BAN_COURSE]: () => showModal(MODAL_TYPES.BAN, BAN_SCOPES.COURSE),
    [ContentActions.BAN_ORG]: () => showModal(MODAL_TYPES.BAN, BAN_SCOPES.ORGANIZATION),
    [ContentActions.UNBAN_COURSE]: () => showModal(MODAL_TYPES.UNBAN, BAN_SCOPES.COURSE),
    [ContentActions.UNBAN_ORG]: () => showModal(MODAL_TYPES.UNBAN, BAN_SCOPES.ORGANIZATION),
    [ContentActions.DELETE_USER_COURSE]: () => showModal(MODAL_TYPES.DELETE_USER, BAN_SCOPES.COURSE),
    [ContentActions.DELETE_USER_ORG]: () => showModal(MODAL_TYPES.DELETE_USER, BAN_SCOPES.ORGANIZATION),
  }), [handleShowDeleteConfirmation, handleShowRestoreConfirmation, showModal]);

  const learnerBanInfo = useMemo(() => {
    // Find the current learner in the bannedUsers list
    const bannedUser = bannedUsers.find(user => user.username === username && user.isActive);
    if (bannedUser) {
      return {
        isAuthorBanned: true,
        authorBanScope: bannedUser.scope,
        bannedByUsername: bannedUser.bannedByUsername,
        bannedAt: bannedUser.bannedAt,
      };
    }
    return {
      isAuthorBanned: false,
      authorBanScope: null,
      bannedByUsername: null,
      bannedAt: null,
    };
  }, [bannedUsers, username]);

  const postInstances = useMemo(() => (
    sortedPostsIds?.map((threadId, idx) => (
      <PostLink
        postId={threadId}
        idx={idx}
        key={threadId}
        showDivider={(sortedPostsIds.length - 1) !== idx}
      />
    ))
  ), [sortedPostsIds]);

  useEffect(() => {
    dispatch(clearPostsPages());
    loadMorePosts();
    // Fetch banned users list to show ban banner if this user is banned
    if (userHasModerationPrivileges && enableDiscussionBan) {
      dispatch(fetchBannedUsers(courseId));
    }
  }, [courseId, postFilter, username, userHasModerationPrivileges, enableDiscussionBan]);

  return (
    <div className="discussion-posts d-flex flex-column">
      {learnerBanInfo.isAuthorBanned && enableDiscussionBan && (
        <div className="bg-danger-100 border-bottom border-danger-300 px-3 py-2 d-flex flex-column align-items-center justify-content-center">
          <div className="d-flex align-items-center">
            <Icon src={Block} className="text-danger learner-ban-banner-icon" />
            <span className="text-danger font-weight-bold learner-ban-banner-text">
              {intl.formatMessage(messages.learnerBanBannerBanned)}
            </span>
            <span className="text-danger font-weight-bold learner-ban-banner-text">
              {intl.formatMessage(messages.auditTrailBanScope, { scope: learnerBanInfo.authorBanScope })}
            </span>

            {learnerBanInfo.bannedByUsername && (
              <>
                <span className="text-danger font-weight-bold learner-ban-banner-by">
                  {intl.formatMessage(messages.learnerBanBannerBy)}
                </span>
                <span className="text-warning-700 font-weight-bold learner-ban-banner-by">
                  {learnerBanInfo.bannedByUsername}
                </span>
                <Icon src={Institution} className="text-warning-700 learner-ban-banner-staff-icon" />
                <span className="text-warning-700 font-weight-bold">
                  {intl.formatMessage(messages.learnerBanBannerStaff)}
                </span>
              </>
            )}
          </div>

          <div className="text-muted small mt-1">
            {learnerBanInfo.bannedAt && new Date(learnerBanInfo.bannedAt).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </div>
        </div>
      )}

      <div className="discussion-posts d-flex flex-column">
        <div className="row d-flex align-items-center justify-content-between px-2.5">
          <div className="col-1">
            <IconButton
              src={ArrowBack}
              iconAs={Icon}
              style={{ padding: '18px' }}
              size="inline"
              onClick={() => navigate({ ...discussionsPath(Routes.LEARNERS.PATH, { courseId })(location) })}
              alt={intl.formatMessage(messages.back)}
            />
          </div>
          <div className=" col-auto text-primary-500 font-style font-weight-bold py-2.5">
            {intl.formatMessage(messages.activityForLearner, { username: capitalize(username) })}
          </div>
          {canAccessBulkActions && username !== authenticatedUser?.username ? (
            <div className="col-2">
              <LearnerActionsDropdown
                id={username}
                actionHandlers={actionHandlers}
                userHasBulkDeletePrivileges={canAccessBulkActions}
                learnerBanInfo={learnerBanInfo}
                contentStatus={postFilter?.contentStatus}
                dropDownIconSize
              />
            </div>
          )
            : (<div style={{ padding: '18px' }} />)}
        </div>
        <div className="bg-light-400 border border-light-300" />
        <LearnerPostFilterBar />
        <div className="border-bottom border-light-400" />
        <div className="list-group list-group-flush">
          {postInstances}
          {loadingStatus !== RequestStatus.IN_PROGRESS && sortedPostsIds?.length === 0 && <NoResults />}
          {loadingStatus === RequestStatus.IN_PROGRESS ? (
            <div className="d-flex justify-content-center p-4">
              <Spinner animation="border" variant="primary" size="lg" />
            </div>
          ) : (
            nextPage && loadingStatus === RequestStatus.SUCCESSFUL && (
              <Button onClick={() => loadMorePosts(nextPage)} variant="primary" size="md" data-testid="load-more-posts">
                {intl.formatMessage(messages.loadMore)}
              </Button>
            )
          )}
        </div>
        <Confirmation
          isOpen={isDeleting}
          title={intl.formatMessage(messages.deletePostsTitle)}
          description={intl.formatMessage(messages.deletePostsDescription, {
            count: bulkDeleteStats.threadCount + bulkDeleteStats.commentCount,
            bulkType: isDeletingCourseOrOrg,
          })}
          onClose={hideModal}
          confirmAction={() => handleDeletePosts(isDeletingCourseOrOrg)}
          confirmButtonText={intl.formatMessage(messages.deletePostsConfirm)}
          confirmButtonVariant="danger"
          isDataLoading={!(learnerLoadingStatus === RequestStatus.SUCCESSFUL)}
          isConfirmButtonPending={bulkDeleting}
          pendingConfirmButtonText={intl.formatMessage(messages.deletePostConfirmPending)}
        />
        <Confirmation
          isOpen={isRestoring}
          title={intl.formatMessage(messages.restorePostsTitle)}
          description={intl.formatMessage(messages.restorePostsDescription, {
            count: bulkDeleteStats.threadCount + bulkDeleteStats.commentCount,
            bulkType: isRestoringCourseOrOrg,
          })}
          onClose={hideModal}
          confirmAction={() => handleRestorePosts(isRestoringCourseOrOrg)}
          confirmButtonText={intl.formatMessage(messages.restorePostsConfirm)}
          confirmButtonVariant="primary"
          isDataLoading={isLoadingRestoreData}
        />
        <DeleteWithBanConfirmation
          isOpen={isDeletingUserCourse}
          title={intl.formatMessage(discussionMessages.deleteUserCourseTitle)}
          description={intl.formatMessage(discussionMessages.deleteUserCourseDescription, { username })}
          onClose={hideModal}
          confirmAction={(shouldBan) => handleDeleteActivity(BAN_SCOPES.COURSE, shouldBan)}
          closeButtonVariant="tertiary"
          confirmButtonVariant="danger"
          confirmButtonText={intl.formatMessage(messages.deleteConfirmationDelete)}
          showBanCheckbox={enableDiscussionBan}
          banCheckboxLabel={intl.formatMessage(discussionMessages.banUserCheckbox)}
          isConfirmButtonPending={isProcessing}
        />
        <DeleteWithBanConfirmation
          isOpen={isDeletingUserOrg}
          title={intl.formatMessage(discussionMessages.deleteUserOrgTitle)}
          description={intl.formatMessage(discussionMessages.deleteUserOrgDescription, { username })}
          onClose={hideModal}
          confirmAction={(shouldBan) => handleDeleteActivity(BAN_SCOPES.ORGANIZATION, shouldBan)}
          closeButtonVariant="tertiary"
          confirmButtonVariant="danger"
          confirmButtonText={intl.formatMessage(messages.deleteConfirmationDelete)}
          showBanCheckbox={enableDiscussionBan}
          banCheckboxLabel={intl.formatMessage(discussionMessages.banUserOrgCheckbox)}
          isConfirmButtonPending={isProcessing}
        />
        <Confirmation
          isOpen={isBanningCourse}
          title={intl.formatMessage(discussionMessages.banUserCourseTitle)}
          description={intl.formatMessage(discussionMessages.banUserCourseDescription, { username })}
          onClose={hideModal}
          confirmAction={() => handleBanUser(BAN_SCOPES.COURSE)}
          closeButtonVariant="tertiary"
          confirmButtonVariant="danger"
          confirmButtonText={intl.formatMessage(discussionMessages.banButtonText)}
          isConfirmButtonPending={isProcessing}
        />
        <Confirmation
          isOpen={isBanningOrg}
          title={intl.formatMessage(discussionMessages.banUserOrgTitle)}
          description={intl.formatMessage(discussionMessages.banUserOrgDescription, { username })}
          onClose={hideModal}
          confirmAction={() => handleBanUser(BAN_SCOPES.ORGANIZATION)}
          closeButtonVariant="tertiary"
          confirmButtonVariant="danger"
          confirmButtonText={intl.formatMessage(discussionMessages.banButtonText)}
          isConfirmButtonPending={isProcessing}
        />
        <Confirmation
          isOpen={isUnbanningCourse}
          title={intl.formatMessage(discussionMessages.unbanUserCourseTitle)}
          description={intl.formatMessage(discussionMessages.unbanUserCourseDescription, { username })}
          onClose={hideModal}
          confirmAction={() => handleUnbanUser(BAN_SCOPES.COURSE)}
          closeButtonVariant="tertiary"
          confirmButtonVariant="primary"
          confirmButtonText={intl.formatMessage(discussionMessages.unbanButtonText)}
          isConfirmButtonPending={isProcessing}
        />
        <Confirmation
          isOpen={isUnbanningOrg}
          title={intl.formatMessage(discussionMessages.unbanUserOrgTitle)}
          description={intl.formatMessage(discussionMessages.unbanUserOrgDescription, { username })}
          onClose={hideModal}
          confirmAction={() => handleUnbanUser(BAN_SCOPES.ORGANIZATION)}
          closeButtonVariant="tertiary"
          confirmButtonVariant="primary"
          confirmButtonText={intl.formatMessage(discussionMessages.unbanButtonText)}
          isConfirmButtonPending={isProcessing}
        />
      </div>

    </div>
  );
};

export default LearnerPostsView;
