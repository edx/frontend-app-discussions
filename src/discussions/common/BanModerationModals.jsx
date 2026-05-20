import React from 'react';
import PropTypes from 'prop-types';

import { useIntl } from '@edx/frontend-platform/i18n';

import discussionMessages from '../messages';
import DeleteWithBanConfirmation from '../posts/post/DeleteWithBanConfirmation';
import Confirmation from './Confirmation';

const noop = () => null;

/**
 * Reusable component that renders all ban/unban/delete moderation modals
 * Used by Post and Comment components to reduce code duplication
 */
const BanModerationModals = ({
  author,
  activeModal,
  onClose,
  onDeleteWithBan,
  onDeleteUserCourse,
  onDeleteUserOrg,
  onUndeleteUserCourse,
  onUndeleteUserOrg,
  onBanCourse,
  onBanOrg,
  onUnbanCourse,
  onUnbanOrg,
  isProcessing,
  enableDiscussionBan,
  showBanCheckboxOnDelete,
  deleteTitle,
  deleteDescription,
  deleteConfirmText,
}) => {
  const intl = useIntl();

  return (
    <>
      {/* Single content delete with ban option */}
      <DeleteWithBanConfirmation
        isOpen={activeModal === 'delete'}
        title={deleteTitle}
        description={deleteDescription}
        onClose={onClose}
        confirmAction={onDeleteWithBan}
        closeButtonVariant="tertiary"
        confirmButtonVariant="danger"
        confirmButtonText={deleteConfirmText}
        showBanCheckbox={showBanCheckboxOnDelete && enableDiscussionBan}
        banCheckboxLabel={intl.formatMessage(discussionMessages.banUserCheckbox)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Delete all user content - Course scope */}
      <DeleteWithBanConfirmation
        isOpen={activeModal === 'deleteUserCourse'}
        title={intl.formatMessage(discussionMessages.deleteUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.deleteUserCourseDescription, { username: author })}
        onClose={onClose}
        confirmAction={onDeleteUserCourse}
        closeButtonVariant="tertiary"
        confirmButtonVariant="danger"
        confirmButtonText={deleteConfirmText}
        showBanCheckbox={showBanCheckboxOnDelete && enableDiscussionBan}
        banCheckboxLabel={intl.formatMessage(discussionMessages.banUserCheckbox)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Delete all user content - Organization scope */}
      <DeleteWithBanConfirmation
        isOpen={activeModal === 'deleteUserOrg'}
        title={intl.formatMessage(discussionMessages.deleteUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.deleteUserOrgDescription, { username: author })}
        onClose={onClose}
        confirmAction={onDeleteUserOrg}
        closeButtonVariant="tertiary"
        confirmButtonVariant="danger"
        confirmButtonText={deleteConfirmText}
        showBanCheckbox={showBanCheckboxOnDelete && enableDiscussionBan}
        banCheckboxLabel={intl.formatMessage(discussionMessages.banUserOrgCheckbox)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Undelete user content - Course scope */}
      <Confirmation
        isOpen={activeModal === 'undeleteUserCourse'}
        title={intl.formatMessage(discussionMessages.undeleteUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.undeleteUserCourseDescription, { username: author })}
        onClose={onClose}
        confirmAction={onUndeleteUserCourse}
        closeButtonVariant="tertiary"
        confirmButtonText={intl.formatMessage(discussionMessages.undeleteButtonText)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Undelete user content - Organization scope */}
      <Confirmation
        isOpen={activeModal === 'undeleteUserOrg'}
        title={intl.formatMessage(discussionMessages.undeleteUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.undeleteUserOrgDescription, { username: author })}
        onClose={onClose}
        confirmAction={onUndeleteUserOrg}
        closeButtonVariant="tertiary"
        confirmButtonText={intl.formatMessage(discussionMessages.undeleteButtonText)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Ban user - Course scope */}
      <Confirmation
        isOpen={activeModal === 'banCourse'}
        title={intl.formatMessage(discussionMessages.banUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.banUserCourseDescription, { username: author })}
        onClose={onClose}
        confirmAction={onBanCourse}
        closeButtonVariant="tertiary"
        confirmButtonVariant="danger"
        confirmButtonText={intl.formatMessage(discussionMessages.banButtonText)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Ban user - Organization scope */}
      <Confirmation
        isOpen={activeModal === 'banOrg'}
        title={intl.formatMessage(discussionMessages.banUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.banUserOrgDescription, { username: author })}
        onClose={onClose}
        confirmAction={onBanOrg}
        closeButtonVariant="tertiary"
        confirmButtonVariant="danger"
        confirmButtonText={intl.formatMessage(discussionMessages.banButtonText)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Unban user - Course scope */}
      <Confirmation
        isOpen={activeModal === 'unbanCourse'}
        title={intl.formatMessage(discussionMessages.unbanUserCourseTitle)}
        description={intl.formatMessage(discussionMessages.unbanUserCourseDescription, { username: author })}
        onClose={onClose}
        confirmAction={onUnbanCourse}
        closeButtonVariant="tertiary"
        confirmButtonVariant="primary"
        confirmButtonText={intl.formatMessage(discussionMessages.unbanButtonText)}
        isConfirmButtonPending={isProcessing}
      />

      {/* Unban user - Organization scope */}
      <Confirmation
        isOpen={activeModal === 'unbanOrg'}
        title={intl.formatMessage(discussionMessages.unbanUserOrgTitle)}
        description={intl.formatMessage(discussionMessages.unbanUserOrgDescription, { username: author })}
        onClose={onClose}
        confirmAction={onUnbanOrg}
        closeButtonVariant="tertiary"
        confirmButtonVariant="primary"
        confirmButtonText={intl.formatMessage(discussionMessages.unbanButtonText)}
        isConfirmButtonPending={isProcessing}
      />
    </>
  );
};

BanModerationModals.propTypes = {
  author: PropTypes.string.isRequired,
  activeModal: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDeleteWithBan: PropTypes.func,
  onDeleteUserCourse: PropTypes.func,
  onDeleteUserOrg: PropTypes.func,
  onUndeleteUserCourse: PropTypes.func,
  onUndeleteUserOrg: PropTypes.func,
  onBanCourse: PropTypes.func,
  onBanOrg: PropTypes.func,
  onUnbanCourse: PropTypes.func,
  onUnbanOrg: PropTypes.func,
  isProcessing: PropTypes.bool,
  enableDiscussionBan: PropTypes.bool,
  showBanCheckboxOnDelete: PropTypes.bool,
  // Custom messages for single delete modal (used when modal is active)
  deleteTitle: PropTypes.string,
  deleteDescription: PropTypes.string,
  deleteConfirmText: PropTypes.string,
};

BanModerationModals.defaultProps = {
  activeModal: null,
  onDeleteWithBan: noop,
  onDeleteUserCourse: noop,
  onDeleteUserOrg: noop,
  onUndeleteUserCourse: noop,
  onUndeleteUserOrg: noop,
  onBanCourse: noop,
  onBanOrg: noop,
  onUnbanCourse: noop,
  onUnbanOrg: noop,
  isProcessing: false,
  enableDiscussionBan: false,
  showBanCheckboxOnDelete: false,
  deleteTitle: '',
  deleteDescription: '',
  deleteConfirmText: '',
};

export default BanModerationModals;
