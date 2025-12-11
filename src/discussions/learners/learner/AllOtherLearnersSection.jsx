import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Collapsible, Icon } from '@openedx/paragon';
import { ExpandLess, ExpandMore } from '@openedx/paragon/icons';

const AllOtherLearnersSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible.Advanced
      open={isOpen}
      onToggle={setIsOpen}
      className="border-bottom border-light-400"
    >
      <Collapsible.Trigger className="collapsible-trigger border-0 py-3 px-4 d-flex align-items-center justify-content-between">
        <span className="font-weight-500">{title}</span>
        <Collapsible.Visible whenClosed>
          <Icon src={ExpandMore} />
        </Collapsible.Visible>
        <Collapsible.Visible whenOpen>
          <Icon src={ExpandLess} />
        </Collapsible.Visible>
      </Collapsible.Trigger>
      <Collapsible.Body className="collapsible-body px-0">
        {children}
      </Collapsible.Body>
    </Collapsible.Advanced>
  );
};

AllOtherLearnersSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

AllOtherLearnersSection.defaultProps = {
  children: null,
};

export default AllOtherLearnersSection;
