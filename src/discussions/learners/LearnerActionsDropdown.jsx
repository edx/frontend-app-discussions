import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';

import {
  Button, Dropdown, Icon, IconButton, ModalPopup, useToggle,
} from '@openedx/paragon';
import { ChevronRight, MoreHoriz } from '@openedx/paragon/icons';

import { useIntl } from '@edx/frontend-platform/i18n';

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
  const [submenuOpen, setSubmenuOpen] = useState(null);
  const [submenuTarget, setSubmenuTarget] = useState(null);
  const submenuRef = useRef({});
  const actions = useLearnerActions(userHasBulkDeletePrivileges, learnerBanInfo, contentStatus);

  // Cleanup refs when actions change to prevent memory leaks
  useEffect(() => {
    const currentActionIds = new Set(actions.filter(a => a.submenu).map(a => a.id));
    const storedRefs = Object.keys(submenuRef.current);

    // Remove refs for actions that no longer exist
    storedRefs.forEach(refId => {
      if (!currentActionIds.has(refId)) {
        delete submenuRef.current[refId];
      }
    });

    // Cleanup function to clear all refs on unmount
    return () => {
      submenuRef.current = {};
    };
  }, [actions]);

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
    setSubmenuOpen(null);
    setSubmenuTarget(null);
  }, [close]);

  const handleSubmenuToggle = useCallback((actionId, ref) => {
    if (submenuOpen === actionId) {
      setSubmenuOpen(null);
      setSubmenuTarget(null);
    } else {
      setSubmenuOpen(actionId);
      setSubmenuTarget(ref);
    }
  }, [submenuOpen]);

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
          container={document.body}
        >
          <div
            className="bg-white shadow d-flex flex-column mt-1"
            data-testid="learner-actions-dropdown-modal-popup"
          >
            {actions.map(action => (
              <React.Fragment key={action.id}>
                {action.submenu ? (
                  <>
                    <Dropdown.Item
                      as={Button}
                      variant="tertiary"
                      size="inline"
                      onClick={() => handleSubmenuToggle(action.id, submenuRef.current[action.id])}
                      className="d-flex justify-content-between align-items-center actions-dropdown-item"
                      data-testid={action.id}
                      ref={el => { submenuRef.current[action.id] = el; }}
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
                      <Icon
                        src={ChevronRight}
                        className="icon-size-20"
                      />
                    </Dropdown.Item>
                    {submenuOpen === action.id && (
                      <ModalPopup
                        onClose={() => setSubmenuOpen(null)}
                        positionRef={submenuTarget}
                        isOpen={submenuOpen === action.id}
                        placement="right-start"
                        container={document.body}
                      >
                        <div
                          className="bg-white shadow d-flex flex-column"
                          data-testid={`submenu-${action.id}`}
                        >
                          {action.submenu.map(subAction => (
                            <Dropdown.Item
                              key={subAction.id}
                              as={Button}
                              variant="tertiary"
                              size="inline"
                              disabled={subAction.disabled}
                              onClick={() => {
                                if (!subAction.disabled) {
                                  close();
                                  setSubmenuOpen(null);
                                  handleActions(subAction.action);
                                }
                              }}
                              className="d-flex justify-content-start actions-dropdown-item"
                              data-testid={subAction.id}
                            >
                              <span className="font-weight-normal">
                                {subAction.label.defaultMessage}
                              </span>
                            </Dropdown.Item>
                          ))}
                        </div>
                      </ModalPopup>
                    )}
                  </>
                ) : (
                  <Dropdown.Item
                    as={Button}
                    variant="tertiary"
                    size="inline"
                    onClick={() => {
                      close();
                      handleActions(action.action);
                    }}
                    className="d-flex justify-content-start actions-dropdown-item"
                    data-testid={action.id}
                  >
                    <Icon
                      src={action.icon}
                      className="icon-size-24"
                    />
                    <span className="font-weight-normal ml-2">
                      {action.label.defaultMessage}
                    </span>
                  </Dropdown.Item>
                )}
              </React.Fragment>
            ))}
          </div>
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
