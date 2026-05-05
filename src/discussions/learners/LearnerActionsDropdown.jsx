import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button, Dropdown, Icon, IconButton, ModalPopup, useToggle,
} from '@openedx/paragon';
import { ChevronLeft, ChevronRight, MoreHoriz } from '@openedx/paragon/icons';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';
import { useLearnerActions } from './utils';

const LearnerActionsDropdown = ({
  actionHandlers,
  dropDownIconSize,
  userHasBulkDeletePrivileges,
  learnerBanInfo,
  contentStatus,
}) => {
  const buttonRef = useRef();
  const intl = useIntl();
  const [isOpen, open, close] = useToggle(false);
  const [target, setTarget] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const actions = useLearnerActions(userHasBulkDeletePrivileges, learnerBanInfo, contentStatus);

  const handleActions = useCallback((action) => {
    const actionFunction = actionHandlers[action];
    if (actionFunction) {
      actionFunction();
    }
  }, [actionHandlers]);

  const onClickButton = useCallback((event) => {
    event.preventDefault();
    setTarget(buttonRef.current);
    open();
  }, [open]);

  const onCloseModal = useCallback(() => {
    close();
    setTarget(null);
    setActiveSubmenu(null);
  }, [close]);

  const renderMenuItem = useCallback((action) => (
    <Dropdown.Item
      key={action.id}
      as={Button}
      variant="tertiary"
      size="inline"
      onClick={() => {
        if (action.submenu) {
          setActiveSubmenu(action.id);
        } else {
          close();
          handleActions(action.action);
        }
      }}
      className="d-flex justify-content-start actions-dropdown-item"
      data-testid={action.id}
      disabled={action.disabled}
    >
      <div className="d-flex align-items-center">
        <Icon
          src={action.icon}
          className="icon-size-24"
        />
        <span className="font-weight-normal ml-2">
          {action.label.defaultMessage}
        </span>
      </div>
      {action.submenu && (
        <Icon src={ChevronRight} className="icon-size-20 ml-auto" />
      )}
    </Dropdown.Item>
  ), [close, handleActions]);

  const renderSubmenu = useCallback((parentAction) => (
    <>
      <Dropdown.Item
        as={Button}
        variant="tertiary"
        size="inline"
        onClick={() => setActiveSubmenu(null)}
        className="d-flex align-items-center actions-dropdown-item"
        data-testid="submenu-back"
      >
        <Icon src={ChevronLeft} className="icon-size-20" />
        <span className="font-weight-normal ml-2">
          {intl.formatMessage(messages.backToMenu)}
        </span>
      </Dropdown.Item>
      <Dropdown.Divider />
      {parentAction.submenu.map(subAction => (
        <Dropdown.Item
          key={subAction.id}
          as={Button}
          variant="tertiary"
          size="inline"
          disabled={subAction.disabled}
          onClick={() => {
            if (!subAction.disabled) {
              close();
              setActiveSubmenu(null);
              handleActions(subAction.action);
            }
          }}
          className="d-flex justify-content-start actions-dropdown-item pl-4"
          data-testid={subAction.id}
        >
          <span className="font-weight-normal">
            {subAction.label.defaultMessage}
          </span>
        </Dropdown.Item>
      ))}
    </>
  ), [close, handleActions, intl]);

  const activeParentAction = useMemo(() => (
    activeSubmenu ? actions.find(action => action.id === activeSubmenu) : null
  ), [actions, activeSubmenu]);

  const dropdownContent = (
    <div
      className="bg-white shadow d-flex flex-column mt-1"
      data-testid="learner-actions-dropdown-modal-popup"
    >
      {activeParentAction ? (
        renderSubmenu(activeParentAction)
      ) : (
        actions.map(action => (
          <React.Fragment key={action.id}>
            {renderMenuItem(action)}
          </React.Fragment>
        ))
      )}
    </div>
  );

  return (
    <>
      <IconButton
        onClick={onClickButton}
        alt={intl.formatMessage({ id: 'discussions.learner.actions.alt', defaultMessage: 'Actions menu' })}
        src={MoreHoriz}
        iconAs={Icon}
        size="sm"
        ref={buttonRef}
        iconClassNames={dropDownIconSize ? 'dropdown-icon-dimensions' : ''}
      />
      <div className="actions-dropdown">
        <ModalPopup
          onClose={onCloseModal}
          positionRef={target}
          isOpen={isOpen}
          placement="bottom-start"
        >
          {dropdownContent}
        </ModalPopup>
      </div>
    </>
  );
};

LearnerActionsDropdown.propTypes = {
  actionHandlers: PropTypes.objectOf(PropTypes.func).isRequired,
  dropDownIconSize: PropTypes.bool,
  userHasBulkDeletePrivileges: PropTypes.bool,
  learnerBanInfo: PropTypes.shape({
    isAuthorBanned: PropTypes.bool,
    authorBanScope: PropTypes.string,
  }),
  contentStatus: PropTypes.string,
};

LearnerActionsDropdown.defaultProps = {
  dropDownIconSize: false,
  userHasBulkDeletePrivileges: false,
  learnerBanInfo: {},
  contentStatus: undefined,
};

export default LearnerActionsDropdown;
