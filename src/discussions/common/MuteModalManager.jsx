import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import {
  ActionRow,
  Button,
  ModalDialog,
} from '@openedx/paragon';
import { useDispatch, useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';

import {
  muteAndReportUserThunk, muteUserThunk, unmuteUserThunk,
} from '../data/thunks';

/**
 * Universal Mute Modal Manager
 *
 * Handles mute/unmute modal functionality for Post, Comment, and Reply components.
 * Provides learner mute modals (with mute + report options) and unmute modals.
 * Staff/moderators use submenu actions instead of modals.
 *
 * Features:
 * - Learner mute modal with mute + report options
 * - Unmute modal for learners
 * - Reusable across different content types
 */
const MuteModalManager = ({
  showLearnerMuteModal,
  showUnmuteModal,
  onCloseLearnerMuteModal,
  onCloseUnmuteModal,
  username,
  contentId,
  messages,
}) => {
  const dispatch = useDispatch();
  const intl = useIntl();

  // Get muted users data from the learners state (where it's actually stored)
  const learnersMutedUsers = useSelector(state => state.learners?.mutedUsers);
  const mutedUsersByUsername = learnersMutedUsers?.byUsername || {};
  const courseWideMutedUsernames = learnersMutedUsers?.course || [];

  // Fallback: also check config state
  const configMutedUsers = useSelector(state => state.config.mutedUsers || []);
  const configCourseWideMutedUsers = useSelector(state => state.config.courseWideMutedUsers || []);

  // Learner mute handlers
  const handleLearnerMute = useCallback(async () => {
    await dispatch(muteUserThunk(username, false));
    onCloseLearnerMuteModal();
  }, [dispatch, username, onCloseLearnerMuteModal]);

  const handleLearnerMuteAndReport = useCallback(async () => {
    await dispatch(muteAndReportUserThunk(username, contentId));
    onCloseLearnerMuteModal();
  }, [dispatch, username, contentId, onCloseLearnerMuteModal]);

  // Unmute handler
  const handleUnmute = useCallback(async () => {
    // Determine if this is a course-wide mute
    let actualIsCourseWide = false;

    // First, check the learners state (primary source of truth)
    if (mutedUsersByUsername[username]) {
      const mutedUser = mutedUsersByUsername[username];
      actualIsCourseWide = mutedUser.scope === 'course';
    } else if (courseWideMutedUsernames.includes(username)) {
      // Check course-wide list
      actualIsCourseWide = true;
    } else if (configMutedUsers.length > 0) {
      // Fallback: check config state
      const mutedUser = configMutedUsers.find(u => u.username === username);
      if (mutedUser) {
        actualIsCourseWide = mutedUser.scope === 'course';
      }
    } else if (configCourseWideMutedUsers.includes(username)) {
      actualIsCourseWide = true;
    }

    await dispatch(unmuteUserThunk(username, actualIsCourseWide));
    onCloseUnmuteModal();
  }, [
    dispatch,
    username,
    onCloseUnmuteModal,
    mutedUsersByUsername,
    courseWideMutedUsernames,
    configMutedUsers,
    configCourseWideMutedUsers,
  ]);

  return (
    <>
      {/* Learner Mute Modal */}
      <ModalDialog
        isOpen={showLearnerMuteModal}
        onClose={onCloseLearnerMuteModal}
        hasCloseButton={false}
        zIndex={5000}
      >
        <ModalDialog.Header>
          <ModalDialog.Title>
            {intl.formatMessage(messages.learnerMuteTitle)}
          </ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          <p>{intl.formatMessage(messages.learnerMuteDescription, { username })}</p>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <ModalDialog.CloseButton variant="tertiary">
              Cancel
            </ModalDialog.CloseButton>
            <Button variant="primary" onClick={handleLearnerMute}>
              {intl.formatMessage(messages.learnerMuteButton)}
            </Button>
            <Button variant="danger" onClick={handleLearnerMuteAndReport}>
              {intl.formatMessage(messages.learnerMuteAndReportButton)}
            </Button>
          </ActionRow>
        </ModalDialog.Footer>
      </ModalDialog>

      {/* Unmute Modal for Learners */}
      <ModalDialog
        isOpen={showUnmuteModal}
        onClose={onCloseUnmuteModal}
        hasCloseButton={false}
        zIndex={5000}
      >
        <ModalDialog.Header>
          <ModalDialog.Title>
            {intl.formatMessage(messages.unmuteTitle)}
          </ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          <p>{intl.formatMessage(messages.unmuteDescription, { username })}</p>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <ModalDialog.CloseButton variant="tertiary">
              Cancel
            </ModalDialog.CloseButton>
            <Button variant="danger" onClick={handleUnmute}>
              {intl.formatMessage(messages.unmuteButton)}
            </Button>
          </ActionRow>
        </ModalDialog.Footer>
      </ModalDialog>
    </>
  );
};

MuteModalManager.propTypes = {
  showLearnerMuteModal: PropTypes.bool.isRequired,
  showUnmuteModal: PropTypes.bool.isRequired,
  onCloseLearnerMuteModal: PropTypes.func.isRequired,
  onCloseUnmuteModal: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  contentId: PropTypes.string.isRequired,
  messages: PropTypes.shape({
    learnerMuteTitle: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
    learnerMuteDescription: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
    learnerMuteButton: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
    learnerMuteAndReportButton: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
    unmuteTitle: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
    unmuteDescription: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
    unmuteButton: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default MuteModalManager;
