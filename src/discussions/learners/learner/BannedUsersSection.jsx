import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Collapsible, Icon, OverlayTrigger, Tooltip,
} from '@openedx/paragon';
import { ExpandLess, ExpandMore, InfoOutline } from '@openedx/paragon/icons';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';
import BannedUserCard from './BannedUserCard';

const BannedUsersSection = ({ title, users, infoIconId }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(true);

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <Collapsible.Advanced
      open={isOpen}
      onToggle={setIsOpen}
      className="border-bottom border-light-400"
    >
      <Collapsible.Trigger className="collapsible-trigger border-0 py-3 px-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <span className="font-weight-500">{title}</span>
          {infoIconId && (
            <OverlayTrigger
              placement="right"
              overlay={(
                <Tooltip id={infoIconId}>
                  {intl.formatMessage(messages.bannedUsersTooltip)}
                </Tooltip>
              )}
            >
              <Icon
                src={InfoOutline}
                className="ml-2 text-gray-500"
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                data-testid={infoIconId}
              />
            </OverlayTrigger>
          )}
        </div>
        <Collapsible.Visible whenClosed>
          <Icon src={ExpandMore} />
        </Collapsible.Visible>
        <Collapsible.Visible whenOpen>
          <Icon src={ExpandLess} />
        </Collapsible.Visible>
      </Collapsible.Trigger>
      <Collapsible.Body className="collapsible-body px-0">
        <div className="list-group list-group-flush">
          {users.map((user) => (
            <BannedUserCard key={user.id || user.username} user={user} />
          ))}
        </div>
      </Collapsible.Body>
    </Collapsible.Advanced>
  );
};

BannedUsersSection.propTypes = {
  title: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string.isRequired,
    email: PropTypes.string,
    scope: PropTypes.string,
    bannedAt: PropTypes.string,
    bannedByUsername: PropTypes.string,
  })).isRequired,
  infoIconId: PropTypes.string,
};

BannedUsersSection.defaultProps = {
  infoIconId: null,
};

export default BannedUsersSection;
