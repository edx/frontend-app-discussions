import React from 'react';

import { render, screen } from '@testing-library/react';

import { IntlProvider } from '@edx/frontend-platform/i18n';

import { BAN_SCOPES } from './data/constants';
import AuditTrailInfo from './AuditTrailInfo';

const mockIntl = {
  locale: 'en',
};

const renderWithIntl = (component) => render(
  <IntlProvider locale={mockIntl.locale}>
    {component}
  </IntlProvider>,
);

describe('AuditTrailInfo', () => {
  it('renders correctly with course-wide ban', () => {
    const props = {
      bannedByUsername: 'moderator1',
      bannedAt: '2025-12-10T15:30:00Z',
      scope: BAN_SCOPES.COURSE,
    };

    renderWithIntl(<AuditTrailInfo {...props} />);

    expect(screen.getByTestId('audit-trail-info')).toBeInTheDocument();
    expect(screen.getByText(/Audit trail info/i)).toBeInTheDocument();
    expect(screen.getByText(/Banned by moderator1/i)).toBeInTheDocument();
    expect(screen.getByText(/course-wide/i)).toBeInTheDocument();
    expect(screen.getByText(/Visible to staff only/i)).toBeInTheDocument();
  });

  it('renders correctly with org-wide ban', () => {
    const props = {
      bannedByUsername: 'admin',
      bannedAt: '2025-12-10T15:30:00Z',
      scope: BAN_SCOPES.ORGANIZATION,
    };

    renderWithIntl(<AuditTrailInfo {...props} />);

    expect(screen.getByTestId('audit-trail-info')).toBeInTheDocument();
    expect(screen.getByText(/Banned by admin/i)).toBeInTheDocument();
    expect(screen.getByText(/org-wide/i)).toBeInTheDocument();
  });

  it('returns null when bannedByUsername is missing', () => {
    const props = {
      bannedByUsername: null,
      bannedAt: '2025-12-10T15:30:00Z',
      scope: BAN_SCOPES.COURSE,
    };

    const { container } = renderWithIntl(<AuditTrailInfo {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when bannedAt is missing', () => {
    const props = {
      bannedByUsername: 'moderator1',
      bannedAt: null,
      scope: BAN_SCOPES.COURSE,
    };

    const { container } = renderWithIntl(<AuditTrailInfo {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('formats date and time in viewer timezone', () => {
    const props = {
      bannedByUsername: 'moderator1',
      bannedAt: '2025-12-10T15:30:00Z',
      scope: BAN_SCOPES.COURSE,
    };

    renderWithIntl(<AuditTrailInfo {...props} />);

    // The component should display the date and time
    const auditTrailInfo = screen.getByTestId('audit-trail-info');
    expect(auditTrailInfo).toBeInTheDocument();
    expect(auditTrailInfo.textContent).toMatch(/on.*at/);
  });
});
