import React, {
  useCallback, useContext, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';

import { Avatar, Badge, useToggle } from '@openedx/paragon';
import { useDispatch, useSelector } from 'react-redux';
import * as timeago from 'timeago.js';

import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import HTMLLoader from '../../../../components/HTMLLoader';
import { AvatarOutlineAndLabelColors, ContentActions } from '../../../../data/constants';
import {
  ActionsDropdown, AlertBanner, AuthorLabel, Confirmation,
} from '../../../common';
import DiscussionContext from '../../../common/context';
import timeLocale from '../../../common/time-locale';
import { ContentTypes } from '../../../data/constants';
import { useAlertBannerVisible } from '../../../data/hooks';
import { selectAuthorAvatar, selectThread } from '../../../posts/data/selectors';
import { fetchThread } from '../../../posts/data/thunks';
import { selectCommentOrResponseById } from '../../data/selectors';
import { editComment } from '../../data/thunks';
import messages from '../../messages';
import CommentEditor from './CommentEditor';

const Reply = ({ responseId }) => {
  timeago.register('time-locale', timeLocale);
  const commentData = useSelector(selectCommentOrResponseById(responseId));
  const {
    id, abuseFlagged, author, authorLabel, endorsed, lastEdit, closed, closedBy,
    closeReason, createdAt, threadId, parentId, rawBody, renderedBody, editByLabel, closedByLabel, isDeleted,
  } = useSelector(selectCommentOrResponseById(responseId));
  const intl = useIntl();
  const dispatch = useDispatch();
  const { courseId } = useContext(DiscussionContext);
  // Get the post's isDeleted state for priority rules
  const post = useSelector(selectThread(threadId));
  const postIsDeleted = post?.isDeleted || false;
  const [isEditing, setEditing] = useState(false);
  const [isDeleting, showDeleteConfirmation, hideDeleteConfirmation] = useToggle(false);
  const [isRestoring, showRestoreConfirmation, hideRestoreConfirmation] = useToggle(false);
  const [isReporting, showReportConfirmation, hideReportConfirmation] = useToggle(false);
  const colorClass = AvatarOutlineAndLabelColors[authorLabel];
  const hasAnyAlert = useAlertBannerVisible({
    author,
    abuseFlagged,
    lastEdit,
    closed,
  });
  const authorAvatar = useSelector(selectAuthorAvatar(author));

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

  const handleEditContent = useCallback(() => {
    setEditing(true);
  }, []);

  const handleReplyEndorse = useCallback(() => {
    dispatch(editComment(id, { endorsed: !endorsed }));
  }, [endorsed, id]);

  const handleAbusedFlag = useCallback(() => {
    if (abuseFlagged) {
      dispatch(editComment(id, { flagged: !abuseFlagged }));
    } else {
      showReportConfirmation();
    }
  }, [abuseFlagged, id, showReportConfirmation]);

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
        await dispatch(fetchThread(threadId, courseId));
      }
    } catch (error) {
      logError(error);
    }
    hideRestoreConfirmation();
  }, [id, courseId, threadId, dispatch, hideRestoreConfirmation]);

  const handleCloseEditor = useCallback(() => {
    setEditing(false);
  }, []);

  const actionHandlers = useMemo(() => ({
    [ContentActions.EDIT_CONTENT]: handleEditContent,
    [ContentActions.ENDORSE]: handleReplyEndorse,
    [ContentActions.SOFT_DELETE]: handleSoftDelete,
    [ContentActions.RESTORE]: handleRestore,
    [ContentActions.REPORT]: handleAbusedFlag,
  }), [handleEditContent, handleReplyEndorse, handleSoftDelete, handleRestore, handleAbusedFlag]);

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
      {hasAnyAlert && (
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
          <div className="d-flex flex-row justify-content-between flex-wrap">
            <div className="d-flex align-items-center flex-wrap">
              <AuthorLabel
                author={author}
                authorLabel={authorLabel}
                labelColor={colorClass && `text-${colorClass}`}
                linkToProfile
                postCreatedAt={createdAt}
                postOrComment
              />
              {isDeleted && !postIsDeleted && (
                <Badge
                  variant="light"
                  data-testid="deleted-reply-badge"
                  className="font-weight-500 ml-2 bg-light-400 text-dark"
                >
                  {intl.formatMessage(messages.deletedComment)}
                  <span className="sr-only">{' '}deleted comment</span>
                </Badge>
              )}
            </div>
          </div>
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
