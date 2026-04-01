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
import { selectUserHasModerationPrivileges } from '../data/selectors';
import NoResults from '../posts/NoResults';
import {
  learnersLoadingStatus,
  selectAllBannedUsers,
  selectAllLearners,
  selectLearnerNextPage,
  selectLearnerSorting,
  selectUsernameSearch,
} from './data/selectors';
import { setUsernameSearch } from './data/slices';
import { fetchBannedUsers, fetchLearners } from './data/thunks';
import AllOtherLearnersSection from './learner/AllOtherLearnersSection';
import BannedUsersSection from './learner/BannedUsersSection';
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
  const learners = useSelector(selectAllLearners);
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const allBannedUsers = useSelector(selectAllBannedUsers);

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

  const renderLearnersList = useMemo(() => {
    if (loadingStatus === RequestStatus.SUCCESSFUL) {
      return learners.map((learner) => (
        <LearnerCard learner={learner} key={learner.username} />
      ));
    }
    return null;
  }, [loadingStatus, learners]);

  const renderLoadingAndPagination = useMemo(() => {
    if (loadingStatus === RequestStatus.IN_PROGRESS) {
      return (
        <div className="d-flex justify-content-center p-4">
          <Spinner animation="border" variant="primary" size="lg" />
        </div>
      );
    }
    if (nextPage && loadingStatus === RequestStatus.SUCCESSFUL) {
      return (
        <Button onClick={() => loadPage()} variant="primary" size="md" data-testid="load-more-learners">
          {intl.formatMessage(messages.loadMore)}
        </Button>
      );
    }
    return null;
  }, [loadingStatus, nextPage, loadPage, intl]);

  return (
    <div className="d-flex flex-column border-right border-light-400">
      {!usernameSearch && <LearnerFilterBar /> }
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
        {/* Banned users section - only shown when not searching */}
        {!usernameSearch && userHasModerationPrivileges && enableDiscussionBan && (
          <>
            <BannedUsersSection
              title={intl.formatMessage(messages.bannedUsers)}
              users={allBannedUsers}
              infoIconId="banned-users-info"
            />
            {/* Placeholder for Muted course-wide section */}
            {/* <BannedUsersSection
              title={intl.formatMessage(messages.mutedCourseWide)}
              users={[]}
              infoIconId="muted-course-wide-info"
            /> */}
          </>
        )}
        {/* All other learners section - collapsible */}
        {!usernameSearch && userHasModerationPrivileges ? (
          (learners.length > 0 || loadingStatus === RequestStatus.IN_PROGRESS) && (
            <AllOtherLearnersSection title={intl.formatMessage(messages.allOtherLearners)}>
              <>
                {renderLearnersList}
                {renderLoadingAndPagination}
              </>
            </AllOtherLearnersSection>
          )
        ) : (
          <>
            {renderLearnersList}
            {renderLoadingAndPagination}
          </>
        )}
        { usernameSearch !== '' && learners.length === 0 && loadingStatus === RequestStatus.SUCCESSFUL && <NoResults />}
      </div>
    </div>
  );
};

export default LearnersView;
