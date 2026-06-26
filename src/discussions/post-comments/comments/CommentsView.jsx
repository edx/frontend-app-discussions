import React, {
  useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';

import { Button, Spinner } from '@openedx/paragon';
import { useDispatch, useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';

import { PostsStatusFilter, ThreadType } from '../../../data/constants';
import DiscussionContext from '../../common/context';
import withPostingRestrictions from '../../common/withPostingRestrictions';
import { useUserPostingEnabled } from '../../data/hooks';
import {
  selectContentCreationRateLimited,
  selectIsUserBanned,
  selectShouldShowEmailConfirmation,
} from '../../data/selectors';
import { isLastElementOfList } from '../../utils';
import { usePostComments } from '../data/hooks';
import {
  selectCommentSortOrder,
} from '../data/selectors';
import { fetchBatchCommentResponses } from '../data/thunks';
import messages from '../messages';
import PostCommentsContext from '../postCommentsContext';
import { Comment, ResponseEditor } from './comment';

const CommentsView = ({ threadType, openRestrictionDialogue }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [addingResponse, setAddingResponse] = useState(false);
  const { isClosed, includeMuted: includeMutedFromContext } = useContext(PostCommentsContext);
  const { learnerUsername } = useContext(DiscussionContext);
  const isUserPrivilegedInPostingRestriction = useUserPostingEnabled();
  const shouldShowEmailConfirmation = useSelector(selectShouldShowEmailConfirmation);
  const contentCreationRateLimited = useSelector(selectContentCreationRateLimited);
  const isUserBanned = useSelector(selectIsUserBanned);
  const sortedOrder = useSelector(selectCommentSortOrder);
  const commentsById = useSelector(state => state.comments.commentsById);

  const postFilter = useSelector(state => state.learners?.postFilter);
  const showDeleted = Boolean(
    learnerUsername && postFilter?.contentStatus === PostsStatusFilter.DELETED,
  );

  // Check if any author is muted
  const personalMutedUsers = useSelector(state => state.learners?.mutedUsers?.personal || []);
  const courseWideMutedUsers = useSelector(state => state.learners?.mutedUsers?.course || []);

  const {
    endorsedCommentsIds,
    unEndorsedCommentsIds,
    hasMorePages,
    isLoading,
    handleLoadMoreResponses,
  } = usePostComments(threadType);

  // Memoize to prevent new array reference on every render
  const allVisibleResponseIds = useMemo(
    () => [...endorsedCommentsIds, ...unEndorsedCommentsIds],
    [endorsedCommentsIds, unEndorsedCommentsIds],
  );

  // Track which parent IDs we've already fetched to avoid duplicate batch calls
  const fetchedBatchRef = useRef(null);

  useEffect(() => {
    if (allVisibleResponseIds.length === 0) {
      return undefined;
    }

    const parentIdsWithChildren = allVisibleResponseIds.filter((commentId) => {
      const comment = commentsById[commentId];
      return comment && comment.childCount > 0;
    });

    if (parentIdsWithChildren.length === 0) {
      return undefined;
    }

    // Skip if we already fetched for this exact set of parent IDs
    const batchKey = parentIdsWithChildren.sort().join(',');
    if (fetchedBatchRef.current === batchKey) {
      return undefined;
    }
    fetchedBatchRef.current = batchKey;

    const abortController = new AbortController();

    // Debounce: wait 50ms for all responses to finish rendering
    const timer = setTimeout(() => {
      const authorsOfParents = parentIdsWithChildren.map(id => commentsById[id]?.author).filter(Boolean);
      const anyAuthorMuted = authorsOfParents.some(
        author => personalMutedUsers.includes(author) || courseWideMutedUsers.includes(author),
      );
      const shouldIncludeMuted = includeMutedFromContext || anyAuthorMuted;

      dispatch(fetchBatchCommentResponses(parentIdsWithChildren, {
        reverseOrder: sortedOrder,
        includeMuted: shouldIncludeMuted,
        showDeleted,
        signal: abortController.signal,
      }));
    }, 50);

    return () => {
      clearTimeout(timer);
      abortController.abort();
      // Reset ref so refetch happens if deps actually change
      if (fetchedBatchRef.current === batchKey) {
        fetchedBatchRef.current = null;
      }
    };
  }, [
    allVisibleResponseIds.join(','),
    sortedOrder,
    showDeleted,
    includeMutedFromContext,
  ]);

  const handleAddResponse = useCallback(() => {
    if (shouldShowEmailConfirmation || contentCreationRateLimited) {
      openRestrictionDialogue();
    } else {
      setAddingResponse(true);
    }
  }, [shouldShowEmailConfirmation, openRestrictionDialogue, contentCreationRateLimited]);

  const handleCloseResponseEditor = useCallback(() => {
    setAddingResponse(false);
  }, []);

  const handleDefinition = useCallback((message, commentsLength) => (
    <div
      className="comment-line line-height-24 mx-4 my-14px text-gray-700 font-style"
      role="heading"
      aria-level="2"
    >
      {intl.formatMessage(message, { num: commentsLength })}
    </div>
  ), []);

  const handleComments = useCallback((postCommentsIds) => (
    <div className="mx-4" role="list">
      {postCommentsIds.map((commentId) => (
        <Comment
          commentId={commentId}
          key={commentId}
          marginBottom={isLastElementOfList(postCommentsIds, commentId)}
          skipChildFetch
        />
      ))}
    </div>
  ), [hasMorePages, isLoading, handleLoadMoreResponses]);

  return (
    ((hasMorePages && isLoading) || !isLoading) && (
      <>
        {endorsedCommentsIds.length > 0 && (
          <>
            {handleDefinition(messages.endorsedResponseCount, endorsedCommentsIds.length)}
            {handleComments(endorsedCommentsIds)}
          </>
        )}
        {handleDefinition(messages.responseCount, unEndorsedCommentsIds.length)}
        {unEndorsedCommentsIds.length > 0 && handleComments(unEndorsedCommentsIds)}
        {hasMorePages && !isLoading && (!!unEndorsedCommentsIds.length || !!endorsedCommentsIds.length) && (
          <Button
            onClick={handleLoadMoreResponses}
            variant="link"
            block="true"
            className="px-4 mt-3 border-0 line-height-24 py-0 mb-2 font-style font-weight-500"
            data-testid="load-more-comments"
          >
            {intl.formatMessage(messages.loadMoreResponses)}
          </Button>
        )}
        {isLoading && (
          <div className="mb-2 mt-3 d-flex justify-content-center">
            <Spinner animation="border" variant="primary" className="spinner-dimensions" />
          </div>
        )}
        {(isUserPrivilegedInPostingRestriction && (!!unEndorsedCommentsIds.length || !!endorsedCommentsIds.length)
          && !isClosed && !isUserBanned) && (
            <div className="mx-4">
              {!addingResponse && (
                <Button
                  variant="plain"
                  block="true"
                  className="card mb-4 px-0 border-0 py-10px mt-2 font-style font-weight-500
                    line-height-24 text-primary-500 bg-white"
                  onClick={handleAddResponse}
                  data-testid="add-response"
                >
                  {intl.formatMessage(messages.addResponse)}
                </Button>
              )}
              <ResponseEditor
                addWrappingDiv
                addingResponse={addingResponse}
                handleCloseEditor={handleCloseResponseEditor}
              />
            </div>
        )}
      </>
    )
  );
};

CommentsView.propTypes = {
  threadType: PropTypes.oneOf([
    ThreadType.DISCUSSION, ThreadType.QUESTION,
  ]).isRequired,
  openRestrictionDialogue: PropTypes.func.isRequired,
};

export default React.memo(withPostingRestrictions(CommentsView));
