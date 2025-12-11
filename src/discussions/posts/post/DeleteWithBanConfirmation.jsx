import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  ActionRow,
  Form,
  ModalDialog,
  Spinner,
  StatefulButton,
} from '@openedx/paragon';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../../messages';

const DeleteWithBanConfirmation = ({
  isOpen,
  title,
  description,
  boldDescription,
  onClose,
  confirmAction,
  closeButtonVariant,
  confirmButtonState,
  confirmButtonVariant,
  confirmButtonText,
  isDataLoading,
  isConfirmButtonPending,
  pendingConfirmButtonText,
  closeButtonText,
  showBanCheckbox,
  banCheckboxLabel,
}) => {
  const intl = useIntl();
  const [banUser, setBanUser] = useState(false);

  const handleConfirm = () => {
    confirmAction(banUser);
  };

  const handleClose = () => {
    setBanUser(false);
    onClose();
  };

  return (
    <ModalDialog title={title} isOpen={isOpen} hasCloseButton={false} onClose={handleClose} zIndex={5000}>
      {isDataLoading && !isConfirmButtonPending ? (
        <ModalDialog.Body>
          <div className="d-flex justify-content-center p-4">
            <Spinner animation="border" variant="primary" size="lg" />
          </div>
        </ModalDialog.Body>
      ) : (
        <>
          <ModalDialog.Header>
            <ModalDialog.Title>
              {title}
            </ModalDialog.Title>
          </ModalDialog.Header>
          <ModalDialog.Body>
            <div style={{ whiteSpace: 'pre-line' }}>
              {description}
            </div>
            {boldDescription && <p className="font-weight-bold pt-2 mb-0">{boldDescription}</p>}
            {showBanCheckbox && (
              <div className="mt-3">
                <Form.Checkbox
                  checked={banUser}
                  onChange={(e) => setBanUser(e.target.checked)}
                >
                  {banCheckboxLabel || intl.formatMessage(messages.banUserCheckbox)}
                </Form.Checkbox>
              </div>
            )}
          </ModalDialog.Body>
          <ModalDialog.Footer>
            <ActionRow>
              <ModalDialog.CloseButton variant={closeButtonVariant} onClick={handleClose}>
                {closeButtonText || intl.formatMessage(messages.confirmationCancel)}
              </ModalDialog.CloseButton>
              {confirmAction && (
                <StatefulButton
                  labels={{
                    default: confirmButtonText || intl.formatMessage(messages.confirmationConfirm),
                    pending: pendingConfirmButtonText || confirmButtonText
                      || intl.formatMessage(messages.confirmationConfirm),
                  }}
                  state={isConfirmButtonPending ? 'pending' : confirmButtonState}
                  variant={confirmButtonVariant}
                  onClick={handleConfirm}
                />
              )}
            </ActionRow>
          </ModalDialog.Footer>
        </>
      )}
    </ModalDialog>
  );
};

DeleteWithBanConfirmation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  confirmAction: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  boldDescription: PropTypes.string,
  closeButtonVariant: PropTypes.string,
  confirmButtonVariant: PropTypes.string,
  confirmButtonText: PropTypes.string,
  isDataLoading: PropTypes.bool,
  isConfirmButtonPending: PropTypes.bool,
  pendingConfirmButtonText: PropTypes.string,
  closeButtonText: PropTypes.string,
  confirmButtonState: PropTypes.string,
  showBanCheckbox: PropTypes.bool,
  banCheckboxLabel: PropTypes.string,
};

DeleteWithBanConfirmation.defaultProps = {
  closeButtonVariant: 'default',
  confirmButtonVariant: 'primary',
  confirmButtonText: '',
  boldDescription: '',
  isDataLoading: false,
  isConfirmButtonPending: false,
  pendingConfirmButtonText: '',
  closeButtonText: '',
  confirmButtonState: 'default',
  showBanCheckbox: false,
  banCheckboxLabel: '',
};

export default React.memo(DeleteWithBanConfirmation);
