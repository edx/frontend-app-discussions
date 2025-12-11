import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import messages from '../messages';
import BannedUserBanner from './BannedUserBanner';

describe('BannedUserBanner', () => {
  it('renders as an ARIA alert and announces politely', () => {
    render(
      <IntlProvider locale="en">
        <BannedUserBanner />
      </IntlProvider>,
    );

    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveTextContent(messages.bannedUserBannerMessage.defaultMessage);
  });
});
