import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button, Dropdown, Icon, IconButton, ModalPopup, useToggle,
} from '@openedx/paragon';
import { ChevronLeft, ChevronRight, MoreHoriz } from '@openedx/paragon/icons';
import { useSelector } from 'react-redux';

import { useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';

import { selectIsPostingEnabled, selectUserHasModerationPrivileges } from '../data/selectors';
import messages from '../messages';
import { useActions } from '../utils';

const ActionsDropdown = ({
  actionHandlers,
  contentType,
  disabled,
  dropDownIconSize,
  iconSize,
  id,
}) => {
  const buttonRef = useRef();
  const intl = useIntl();
  const [isOpen, open, close] = useToggle(false);
  const [target, setTarget] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const isPostingEnabled = useSelector(selectIsPostingEnabled);
  const hasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const actions = useActions(contentType, id, hasModerationPrivileges);

  // Check if we're in in-context sidebar mode
  const isInContextSidebar = useMemo(() => (
    typeof window !== 'undefined' && window.location.search.includes('inContextSidebar')
  ), []);

  const handleActions = useCallback((action) => {
    const actionFunction = actionHandlers[action];
    if (actionFunction) {
      actionFunction();
    } else {
      logError(`Unknown or unimplemented action ${action}`);
    }
  }, [actionHandlers]);

  // Find and remove edit action if in Posting is disabled.
  useMemo(() => {
    if (!isPostingEnabled) {
      actions.splice(actions.findIndex(action => action.id === 'edit'), 1);
    }
  }, [actions, isPostingEnabled]);

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
      disabled={action.disabled}
      onClick={() => {
        if (action.disabled) {
          return;
        }
        if (action.hasSubmenu) {
          setActiveSubmenu(action.id);
        } else {
          close();
          handleActions(action.action);
        }
      }}
      className="d-flex justify-content-start actions-dropdown-item"
      data-testid={action.id}
    >
      <div className="d-flex align-items-center">
        <Icon
          src={action.icon}
          className="icon-size-24"
        />
        <span className="font-weight-normal ml-2">
          {intl.formatMessage(action.label)}
        </span>
      </div>
      {action.hasSubmenu && (
        <Icon src={ChevronRight} className="icon-size-20 ml-2" />
      )}
      {action.hasChevron && (
        <Icon src={ChevronRight} className="icon-size-20 ml-auto" />
      )}
    </Dropdown.Item>
  ), [close, handleActions, intl]);

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
        <React.Fragment key={subAction.id}>
          <Dropdown.Item
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
              {intl.formatMessage(subAction.label)}
            </span>
          </Dropdown.Item>
        </React.Fragment>
      ))}
    </>
  ), [close, handleActions, intl]);

  const activeParentAction = useMemo(() => (
    activeSubmenu ? actions.find(action => action.id === activeSubmenu) : null
  ), [actions, activeSubmenu]);

  const dropdownContent = (
    <div
      className="bg-white shadow d-flex flex-column mt-1"
      data-testid="actions-dropdown-modal-popup"
    >
      {activeParentAction ? (
        renderSubmenu(activeParentAction)
      ) : (
        actions.map(action => (
          <React.Fragment key={action.id}>
            {(action.id === 'delete') && <Dropdown.Divider />}
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
        alt={intl.formatMessage(messages.actionsAlt)}
        src={MoreHoriz}
        iconAs={Icon}
        disabled={disabled}
        size={iconSize}
        ref={buttonRef}
        iconClassNames={dropDownIconSize ? 'dropdown-icon-dimensions' : ''}
      />
      <div className={`actions-dropdown ${isInContextSidebar ? 'in-context-sidebar' : ''}`}>
        <ModalPopup
          onClose={onCloseModal}
          positionRef={target}
          isOpen={isOpen}
          placement="bottom-end"
        >
          {dropdownContent}
        </ModalPopup>
      </div>
    </>
  );
};

ActionsDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  actionHandlers: PropTypes.objectOf(PropTypes.func).isRequired,
  iconSize: PropTypes.string,
  dropDownIconSize: PropTypes.bool,
  contentType: PropTypes.oneOf(['POST', 'COMMENT']).isRequired,
};

ActionsDropdown.defaultProps = {
  disabled: false,
  iconSize: 'sm',
  dropDownIconSize: false,
};

export default ActionsDropdown;
