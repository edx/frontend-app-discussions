import React, {
  useCallback, useContext, useEffect, useMemo,
} from 'react';

import { Button, Spinner } from '@openedx/paragon';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useIntl } from '@edx/frontend-platform/i18n';

import SearchInfo from '../../components/SearchInfo';
import { RequestStatus } from '../../data/constants';
import DiscussionContext from '../common/context';
import {
  selectConfigLoadingStatus,
  selectUserHasModerationPrivileges,
  selectUserIsGroupTa,
  selectUserIsStaff,
} from '../data/selectors';
import { fetchMutedUsersThunk } from '../data/thunks';
import NoResults from '../posts/NoResults';
import {
  learnersLoadingStatus,
  selectAllBannedUsers,
  selectAllLearners,
  selectBannedUsersStatus,
  selectCourseWideMutedUsers,
  selectLearnerNextPage,
  selectLearnerSorting,
  selectPersonalMutedUsers,
  selectUsernameSearch,
} from './data/selectors';
import { setUsernameSearch } from './data/slices';
import {
  fetchBannedUsers, fetchLearners,
} from './data/thunks';
// import AllOtherLearnersSection from './learner/AllOtherLearnersSection';
// import BannedUsersSection from './learner/BannedUsersSection';
import { LearnerCard, LearnerFilterBar } from './learner';
import messages from './messages';

const LearnersView = () => {
  const intl = useIntl();
  const { courseId } = useParams();
  const { enableDiscussionBan } = useContext(DiscussionContext);
  const dispatch = useDispatch();
  const orderBy = useSelector(selectLearnerSorting());
  const nextPage = useSelector(selectLearnerNextPage());
  const loadingStatus = useSelector(learnersLoadingStatus());
  const usernameSearch = useSelector(selectUsernameSearch());
  const courseConfigLoadingStatus = useSelector(selectConfigLoadingStatus);
  const learners = useSelector(selectAllLearners);
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const allBannedUsers = useSelector(selectAllBannedUsers);
  const bannedUsersStatus = useSelector(selectBannedUsersStatus);
  const isUserGroupTA = useSelector(selectUserIsGroupTa);
  const userIsStaff = useSelector(selectUserIsStaff);

  // Check if user has any discussion moderation privileges
  // Course Staff/Admin are explicitly excluded - they behave like learners
  const isUserStaffOrModerator = userIsStaff || isUserGroupTA || userHasModerationPrivileges;
  // const forumMutedUsers = useSelector(selectForumMutedUsers());

  // // Add muted users selectors using the learners state where the data is stored
  const personalMutedUsers = useSelector(selectPersonalMutedUsers());
  const courseWideMutedUsers = useSelector(selectCourseWideMutedUsers());

  const muteStatus = useSelector(state => state.learners?.mutedUsers?.status || RequestStatus.IDLE);

  // State for managing section expansion
  const [isBannedExpanded, setIsBannedExpanded] = React.useState(false);
  const [isMutedCourseWideExpanded, setIsMutedCourseWideExpanded] = React.useState(false);
  const [isMutedForMeExpanded, setIsMutedForMeExpanded] = React.useState(false);
  const [isMutedExpanded, setIsMutedExpanded] = React.useState(false);

  // Check if there are any banned or muted users
  const hasBannedUsers = allBannedUsers && allBannedUsers.length > 0;
  const hasPersonalMutedUsers = personalMutedUsers && personalMutedUsers.length > 0;
  const hasCourseWideMutedUsers = courseWideMutedUsers && courseWideMutedUsers.length > 0;
  const hasAnyMutedUsers = hasPersonalMutedUsers || hasCourseWideMutedUsers;

  useEffect(() => {
    if (usernameSearch) {
      dispatch(fetchLearners(courseId, { orderBy, usernameSearch }));
    } else {
      dispatch(fetchLearners(courseId, { orderBy }));
    }
    // Fetch banned users if user has moderation privileges and ban feature is enabled
    if (userHasModerationPrivileges && enableDiscussionBan && !usernameSearch) {
      dispatch(fetchBannedUsers(courseId));
    }
    // Always fetch muted posts and muted users when the component loads
    dispatch(fetchMutedUsersThunk(courseId));
  }, [courseId, orderBy, usernameSearch, userHasModerationPrivileges, enableDiscussionBan]);

  const loadPage = useCallback(async () => {
    if (nextPage) {
      dispatch(fetchLearners(courseId, {
        orderBy,
        page: nextPage,
        usernameSearch,
      }));
    }
  }, [courseId, orderBy, nextPage, usernameSearch]);

  const handleOnClear = useCallback(() => {
    dispatch(setUsernameSearch(''));
  }, []);

  const renderMutedUsersList = useCallback((users, isCourseWide = false) => {
    if (!users || users.length === 0) {
      return null;
    }

    // Convert users array to learner objects format for LearnerCard
    const mutedLearners = users.map((user, index) => {
      // Handle different input formats: string username, user object, or ID
      let username;
      let userData = {};

      if (typeof user === 'string') {
        username = user;
      } else if (typeof user === 'object' && user !== null) {
        username = user.username || user.mutedUser?.username;
        userData = user;
      } else {
        // Fallback for user ID
        username = `User${user}`;
      }

      if (!username) {
        // Try to create a fallback username
        username = `MutedUser${index + 1}`;
      }

      // Find matching learner from the main learners list
      const existingLearner = learners.find(learner => learner.username === username);

      if (existingLearner) {
        // Use existing learner data
        return {
          ...existingLearner,
          isMuted: true,
          muteScope: isCourseWide ? 'course' : 'personal',
        };
      }

      // Create minimal learner object for users not in main list
      return {
        username,
        isMuted: true,
        muteScope: isCourseWide ? 'course' : 'personal',
        abuseFlagged: userData.abuseFlagged || 0,
        replies: userData.replies || 0,
        threads: userData.threads || 0,
        lastActivityAt: userData.lastActivityAt || new Date().toISOString(),
        // Add profile data if available
        profileImage: userData.profileImage || null,
        // Indicate this is a muted user for styling purposes
        displayName: userData.displayName || username,
      };
    }).filter(learner => learner !== null);

    return (
      <div className="list-group list-group-flush learner" role="list">
        {mutedLearners.map((learner) => (
          <LearnerCard learner={learner} key={learner.username} />
        ))}
      </div>
    );
  }, [learners]);

  const renderBannedUsersList = useCallback((users) => {
    if (!users || users.length === 0) {
      return null;
    }

    // Convert banned users array to learner objects format for LearnerCard
    const bannedLearners = users.map((user, index) => {
      // Handle different input formats: user object
      let username;
      let userData = {};

      if (typeof user === 'object' && user !== null) {
        username = user.username || user.bannedUser?.username;
        userData = user;
      } else if (typeof user === 'string') {
        username = user;
      } else {
        // Fallback for user ID
        username = `User${user}`;
      }

      if (!username) {
        // Try to create a fallback username
        username = `BannedUser${index + 1}`;
      }

      // Find matching learner from the main learners list
      const existingLearner = learners.find(learner => learner.username === username);

      if (existingLearner) {
        // Use existing learner data
        return {
          ...existingLearner,
          isBanned: true,
          banScope: userData.scope || 'course',
          bannedBy: userData.bannedByUsername,
          bannedAt: userData.bannedAt,
        };
      }

      // Create minimal learner object for users not in main list
      return {
        username,
        isBanned: true,
        banScope: userData.scope || 'course',
        bannedBy: userData.bannedByUsername,
        bannedAt: userData.bannedAt,
        abuseFlagged: userData.abuseFlagged || 0,
        replies: userData.replies || 0,
        threads: userData.threads || 0,
        lastActivityAt: userData.lastActivityAt || userData.bannedAt || new Date().toISOString(),
        // Add profile data if available
        profileImage: userData.profileImage || null,
        displayName: userData.displayName || username,
      };
    }).filter(learner => learner !== null);

    return (
      <div className="list-group list-group-flush learner" role="list">
        {bannedLearners.map((learner) => (
          <LearnerCard learner={learner} key={learner.username} />
        ))}
      </div>
    );
  }, [learners]);

  const renderLearnersList = useMemo(() => {
    if (courseConfigLoadingStatus === RequestStatus.SUCCESSFUL) {
      // Extract usernames from muted user objects for filtering
      const personalMutedUsernames = personalMutedUsers.map(user => (typeof user === 'string' ? user : (user.username || user.mutedUser?.username))).filter(Boolean);
      const courseWideMutedUsernames = courseWideMutedUsers.map(user => (typeof user === 'string' ? user : (user.username || user.mutedUser?.username))).filter(Boolean);

      // Filter out users that are muted by the current user
      const allMutedUsernames = [...personalMutedUsernames, ...courseWideMutedUsernames];
      const unmutedLearners = learners.filter(
        learner => !allMutedUsernames.includes(learner.username),
      );

      return unmutedLearners.map((learner) => (
        <LearnerCard learner={learner} key={learner.username} />
      ));
    }
    return null;
  }, [courseConfigLoadingStatus, learners, personalMutedUsers, courseWideMutedUsers]);

  return (
    <div
      className="d-flex flex-column border-right border-light-400"
    >
      {!usernameSearch && <LearnerFilterBar />}
      <div className="border-bottom border-light-400" />
      {usernameSearch && (
        <SearchInfo
          text={usernameSearch}
          count={learners.length}
          loadingStatus={loadingStatus}
          onClear={handleOnClear}
        />
      )}
      <div className="list-group list-group-flush learner" role="list">
        {learners.length > 0 && !usernameSearch && (
          <>
            {/* Top divider */}
            <div style={{
              height: '5px',
              alignSelf: 'stretch',
              background: 'var(--Light-400, #EAE6E5)',
            }}
            />

            {/* Conditional sections based on user role */}
            {isUserStaffOrModerator ? (
              <>
                {/* Staff-only sections */}
                {/* Muted course-wide section - only show if there are course-wide muted users */}
                {hasCourseWideMutedUsers && (
                  <>
                    <div
                      className="d-flex align-items-center border-bottom border-light-400"
                      style={{
                        padding: '14px 18px 14px 24px',
                        gap: '10px',
                        alignSelf: 'stretch',
                        background: '#FFF',
                        cursor: 'pointer',
                      }}
                      onClick={() => setIsMutedCourseWideExpanded(!isMutedCourseWideExpanded)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsMutedCourseWideExpanded(!isMutedCourseWideExpanded);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isMutedCourseWideExpanded}
                      aria-label="Toggle course-wide muted users section"
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        gap: '2px',
                        flex: '1 0 0',
                      }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        >
                          <span
                            className="text-center"
                            style={{
                              color: 'var(--Primary-500, #00262B)',
                              fontSize: '14px',
                              fontStyle: 'normal',
                              fontWeight: '600',
                              lineHeight: '24px',
                            }}
                          >
                            {intl.formatMessage(messages.mutedCourseWide)}
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{
                              width: '16px',
                              height: '16px',
                              aspectRatio: '1/1',
                            }}
                          >
                            <path d="M7.33325 4.66683H8.66658V6.00016H7.33325V4.66683ZM7.33325 7.3335H8.66658V11.3335H7.33325V7.3335ZM7.99992 1.3335C4.31992 1.3335 1.33325 4.32016 1.33325 8.00016C1.33325 11.6802 4.31992 14.6668 7.99992 14.6668C11.6799 14.6668 14.6666 11.6802 14.6666 8.00016C14.6666 4.32016 11.6799 1.3335 7.99992 1.3335ZM7.99992 13.3335C5.05992 13.3335 2.66659 10.9402 2.66659 8.00016C2.66659 5.06016 5.05992 2.66683 7.99992 2.66683C10.9399 2.66683 13.3333 5.06016 13.3333 8.00016C13.3333 10.9402 10.9399 13.3335 7.99992 13.3335Z" fill="#00262B" />
                          </svg>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        padding: '6px',
                        alignItems: 'center',
                        gap: '10px',
                        borderRadius: '44px',
                      }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{
                            width: '16px',
                            height: '16px',
                            aspectRatio: '1/1',
                            transform: isMutedCourseWideExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <path d="M4 6L8 10L12 6" stroke="#00262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Muted course-wide learners list */}
                    {isMutedCourseWideExpanded && (
                      <div className="bg-light-100">
                        {muteStatus === RequestStatus.IN_PROGRESS && (
                          <div className="p-3 text-center">
                            <Spinner size="small" />
                          </div>
                        )}
                        {muteStatus !== RequestStatus.IN_PROGRESS && (
                          renderMutedUsersList(courseWideMutedUsers, true)
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{
                      height: '5px',
                      alignSelf: 'stretch',
                      background: 'var(--Light-400, #EAE6E5)',
                    }}
                    />
                  </>
                )}

                {/* Muted (for me) section - only show if there are personally muted users */}
                {hasPersonalMutedUsers && (
                  <div
                    className="d-flex align-items-center border-bottom border-light-400"
                    style={{
                      padding: '14px 18px 14px 24px',
                      gap: '10px',
                      alignSelf: 'stretch',
                      background: '#FFF',
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsMutedForMeExpanded(!isMutedForMeExpanded)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsMutedForMeExpanded(!isMutedForMeExpanded);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isMutedForMeExpanded}
                    aria-label="Toggle personally muted users section"
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      gap: '2px',
                      flex: '1 0 0',
                    }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      >
                        <span
                          className="text-center"
                          style={{
                            color: 'var(--Primary-500, #00262B)',
                            fontSize: '14px',
                            fontStyle: 'normal',
                            fontWeight: '600',
                            lineHeight: '24px',
                          }}
                        >
                          {intl.formatMessage(messages.mutedForMe)}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{
                            width: '16px',
                            height: '16px',
                            aspectRatio: '1/1',
                          }}
                        >
                          <path d="M7.33325 4.66683H8.66658V6.00016H7.33325V4.66683ZM7.33325 7.3335H8.66658V11.3335H7.33325V7.3335ZM7.99992 1.3335C4.31992 1.3335 1.33325 4.32016 1.33325 8.00016C1.33325 11.6802 4.31992 14.6668 7.99992 14.6668C11.6799 14.6668 14.6666 11.6802 14.6666 8.00016C14.6666 4.32016 11.6799 1.3335 7.99992 1.3335ZM7.99992 13.3335C5.05992 13.3335 2.66659 10.9402 2.66659 8.00016C2.66659 5.06016 5.05992 2.66683 7.99992 2.66683C10.9399 2.66683 13.3333 5.06016 13.3333 8.00016C13.3333 10.9402 10.9399 13.3335 7.99992 13.3335Z" fill="#00262B" />
                        </svg>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      padding: '6px',
                      alignItems: 'center',
                      gap: '10px',
                      borderRadius: '44px',
                    }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{
                          width: '16px',
                          height: '16px',
                          aspectRatio: '1/1',
                          transform: isMutedForMeExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <path d="M4 6L8 10L12 6" stroke="#00262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Muted (for me) learners list */}
                {hasPersonalMutedUsers && isMutedForMeExpanded && (
                  <div className="bg-light-100">
                    {muteStatus === RequestStatus.IN_PROGRESS && (
                      <div className="p-3 text-center">
                        <Spinner size="small" />
                      </div>
                    )}
                    {muteStatus !== RequestStatus.IN_PROGRESS && (
                      renderMutedUsersList(personalMutedUsers, false)
                    )}
                  </div>
                )}

                {/* Divider after muted section - only show if there are personally muted users */}
                {hasPersonalMutedUsers && (
                  <div style={{
                    height: '5px',
                    alignSelf: 'stretch',
                    background: 'var(--Light-400, #EAE6E5)',
                  }}
                  />
                )}

                {/* Banned section - only show if there are banned users */}
                {hasBannedUsers && (
                  <>
                    <div
                      className="d-flex align-items-center border-bottom border-light-400"
                      style={{
                        padding: '14px 18px 14px 24px',
                        gap: '10px',
                        alignSelf: 'stretch',
                        background: '#FFF',
                        cursor: 'pointer',
                      }}
                      onClick={() => setIsBannedExpanded(!isBannedExpanded)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsBannedExpanded(!isBannedExpanded);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isBannedExpanded}
                      aria-label="Toggle banned users section"
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        gap: '2px',
                        flex: '1 0 0',
                      }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        >
                          <span
                            className="text-center"
                            style={{
                              color: 'var(--Primary-500, #00262B)',
                              fontSize: '14px',
                              fontStyle: 'normal',
                              fontWeight: '600',
                              lineHeight: '24px',
                            }}
                          >
                            {intl.formatMessage(messages.learnerBanBannerBanned)}
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{
                              width: '16px',
                              height: '16px',
                              aspectRatio: '1/1',
                            }}
                          >
                            <path d="M7.33325 4.66683H8.66658V6.00016H7.33325V4.66683ZM7.33325 7.3335H8.66658V11.3335H7.33325V7.3335ZM7.99992 1.3335C4.31992 1.3335 1.33325 4.32016 1.33325 8.00016C1.33325 11.6802 4.31992 14.6668 7.99992 14.6668C11.6799 14.6668 14.6666 11.6802 14.6666 8.00016C14.6666 4.32016 11.6799 1.3335 7.99992 1.3335ZM7.99992 13.3335C5.05992 13.3335 2.66659 10.9402 2.66659 8.00016C2.66659 5.06016 5.05992 2.66683 7.99992 2.66683C10.9399 2.66683 13.3333 5.06016 13.3333 8.00016C13.3333 10.9402 10.9399 13.3335 7.99992 13.3335Z" fill="#00262B" />
                          </svg>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        padding: '6px',
                        alignItems: 'center',
                        gap: '10px',
                        borderRadius: '44px',
                      }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{
                            width: '16px',
                            height: '16px',
                            aspectRatio: '1/1',
                            transform: isBannedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <path d="M4 6L8 10L12 6" stroke="#00262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Banned learners list */}
                    {isBannedExpanded && (
                      <div className="bg-light-100">
                        {bannedUsersStatus === RequestStatus.IN_PROGRESS && (
                          <div className="p-3 text-center">
                            <Spinner size="small" />
                          </div>
                        )}
                        {bannedUsersStatus !== RequestStatus.IN_PROGRESS && (
                          renderBannedUsersList(allBannedUsers)
                        )}
                      </div>
                    )}

                    {/* Divider - only show if there are no muted users coming after */}
                    {!hasAnyMutedUsers && (
                      <div style={{
                        height: '5px',
                        alignSelf: 'stretch',
                        background: 'var(--Light-400, #EAE6E5)',
                      }}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Learner-only section */}
                {/* Muted section - only show if there are personally muted users */}
                {hasPersonalMutedUsers && (
                  <div
                    className="d-flex align-items-center border-bottom border-light-400"
                    style={{
                      padding: '14px 18px 14px 24px',
                      gap: '10px',
                      alignSelf: 'stretch',
                      background: '#FFF',
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsMutedExpanded(!isMutedExpanded)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsMutedExpanded(!isMutedExpanded);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isMutedExpanded}
                    aria-label="Toggle muted users section"
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      gap: '2px',
                      flex: '1 0 0',
                    }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      >
                        <span
                          className="text-center"
                          style={{
                            // color: 'var(--Primary-500, #00262B)',
                            fontSize: '14px',
                            fontStyle: 'normal',
                            fontWeight: '600',
                            lineHeight: '24px',
                          }}
                        >
                          {intl.formatMessage(messages.muted)}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{
                            width: '16px',
                            height: '16px',
                            aspectRatio: '1/1',
                          }}
                        >
                          <path d="M7.33325 4.66683H8.66658V6.00016H7.33325V4.66683ZM7.33325 7.3335H8.66658V11.3335H7.33325V7.3335ZM7.99992 1.3335C4.31992 1.3335 1.33325 4.32016 1.33325 8.00016C1.33325 11.6802 4.31992 14.6668 7.99992 14.6668C11.6799 14.6668 14.6666 11.6802 14.6666 8.00016C14.6666 4.32016 11.6799 1.3335 7.99992 1.3335ZM7.99992 13.3335C5.05992 13.3335 2.66659 10.9402 2.66659 8.00016C2.66659 5.06016 5.05992 2.66683 7.99992 2.66683C10.9399 2.66683 13.3333 5.06016 13.3333 8.00016C13.3333 10.9402 10.9399 13.3335 7.99992 13.3335Z" fill="#00262B" />
                        </svg>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      padding: '6px',
                      alignItems: 'center',
                      gap: '10px',
                      borderRadius: '44px',
                    }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{
                          width: '16px',
                          height: '16px',
                          aspectRatio: '1/1',
                          transform: isMutedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <path d="M4 6L8 10L12 6" stroke="#00262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Muted learners list */}
                {hasPersonalMutedUsers && isMutedExpanded && (
                  <div>
                    {muteStatus === RequestStatus.IN_PROGRESS && (
                      <div className="p-3 text-center">
                        <Spinner size="small" />
                      </div>
                    )}
                    {muteStatus !== RequestStatus.IN_PROGRESS && (
                      // Show only personal muted users for learners (users they personally muted)
                      renderMutedUsersList(personalMutedUsers, false)
                    )}
                  </div>
                )}
              </>
            )}

            {/* Divider - only show if there are muted or banned users */}
            {(hasAnyMutedUsers || hasBannedUsers) && (
              <div style={{
                height: '5px',
                alignSelf: 'stretch',
                background: 'var(--Light-400, #EAE6E5)',
              }}
              />
            )}

            {/* All other learners section - only show heading if there are any muted or banned users */}
            {(hasAnyMutedUsers || hasBannedUsers) && (
              <div
                className="d-flex align-items-center border-bottom border-light-400"
                style={{
                  padding: '14px 18px 14px 24px',
                  gap: '10px',
                  alignSelf: 'stretch',
                  background: '#FFF',
                }}
              >
                <span
                  className="text-center"
                  style={{
                    color: 'var(--Primary-500, #00262B)',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: '600',
                    lineHeight: '24px',
                  }}
                >
                  {intl.formatMessage(messages.allOtherLearners)}
                </span>
              </div>
            )}
          </>
        )}
        {renderLearnersList}
        {loadingStatus === RequestStatus.IN_PROGRESS ? (
          <div className="d-flex justify-content-center p-4">
            <Spinner animation="border" variant="primary" size="lg" />
          </div>
        ) : (
          nextPage && loadingStatus === RequestStatus.SUCCESSFUL && (
            <Button onClick={() => loadPage()} variant="primary" size="md" data-testid="load-more-learners">
              {intl.formatMessage(messages.loadMore)}
            </Button>
          )
        )}
        {usernameSearch !== '' && learners.length === 0 && loadingStatus === RequestStatus.SUCCESSFUL && <NoResults />}
      </div>
    </div>
  );
};

export default LearnersView;
