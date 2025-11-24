import React, {
  useCallback, useRef, useState,
} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import {
  Button, Dropdown, Icon, IconButton, ModalPopup, useToggle,
} from '@openedx/paragon';
import { ChevronRight, MoreHoriz } from '@openedx/paragon/icons';

import { useIntl } from '@edx/frontend-platform/i18n';

import { useLearnerActionsMenu } from './utils';

const LearnerActionsDropdown = ({
  actionHandlers,
  dropDownIconSize,
  userHasBulkDeletePrivileges,
}) => {
  const buttonRef = useRef();
  const intl = useIntl();
  const [isOpen, open, close] = useToggle(false);
  const [target, setTarget] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuItems = useLearnerActionsMenu(intl, userHasBulkDeletePrivileges);

  const handleActions = useCallback((action) => {
    const actionFunction = actionHandlers[action];
    if (actionFunction) {
      actionFunction();
      close();
    }
  }, [actionHandlers, close]);

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
        {isOpen && ReactDOM.createPortal(
          <ModalPopup
            onClose={onCloseModal}
            positionRef={target}
            isOpen={isOpen}
            placement="bottom-start"
            style={{ zIndex: 9998 }}
          >
            <div
              className="bg-white shadow d-flex flex-column mt-1"
              data-testid="learner-actions-dropdown-modal-popup"
              style={{ position: 'relative', zIndex: 9998 }}
            >
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className="position-relative"
                  onMouseEnter={() => setActiveSubmenu(item.id)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                  style={{ zIndex: 2 }}
                >
                  <Dropdown.Item
                    as={Button}
                    variant="tertiary"
                    size="inline"
                    className="d-flex justify-content-between align-items-center actions-dropdown-item"
                    data-testid={item.id}
                  >
                    <div className="d-flex align-items-center">
                      <Icon
                        src={item.icon}
                        className="icon-size-24"
                      />
                      <span className="font-weight-normal ml-2">
                        {item.label}
                      </span>
                    </div>
                    <Icon
                      src={ChevronRight}
                      className="icon-size-16"
                    />
                  </Dropdown.Item>
                  {activeSubmenu === item.id && (
                    <div
                      className="bg-white learner-submenu-container"
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        minWidth: 300,
                        maxWidth: 360,
                        zIndex: 9999,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: '1px solid var(--pgn-color-light-400)',
                        overflow: 'visible',
                      }}
                    >
                      {item.submenu.map(subItem => (
                        <Dropdown.Item
                          key={subItem.id}
                          as={Button}
                          variant="tertiary"
                          size="inline"
                          onClick={() => handleActions(subItem.action)}
                          className="d-flex justify-content-start actions-dropdown-item"
                          data-testid={subItem.id}
                        >
                          <span className="font-weight-normal">
                            {subItem.label}
                          </span>
                        </Dropdown.Item>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ModalPopup>,
          document.body,
        )}
      </div>
    </>
  );
};

LearnerActionsDropdown.propTypes = {
  actionHandlers: PropTypes.objectOf(PropTypes.func).isRequired,
  dropDownIconSize: PropTypes.bool,
  userHasBulkDeletePrivileges: PropTypes.bool,
};

LearnerActionsDropdown.defaultProps = {
  dropDownIconSize: false,
  userHasBulkDeletePrivileges: false,
};

export default LearnerActionsDropdown;
