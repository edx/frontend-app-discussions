import React from 'react';

import { render, screen } from '@testing-library/react';

import { AvatarOutlineAndLabelColors } from '../../data/constants';
import DeletedByBanner from './DeletedByBanner';

const mockAuthorLabel = jest.fn(() => <div data-testid="author-label" />);

jest.mock('./AuthorLabel', () => props => mockAuthorLabel(props));

describe('DeletedByBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders delete icon, message, and author label', () => {
    render(
      <DeletedByBanner
        deletedBy="moderator-user"
        deletedByLabel="staff"
        message="Deleted by"
      />,
    );

    expect(document.querySelector('.deleted-content-icon')).toBeInTheDocument();
    expect(screen.getByText('Deleted by')).toBeInTheDocument();
    expect(screen.getByTestId('author-label')).toBeInTheDocument();
  });

  it('passes contract props to AuthorLabel including optional postData', () => {
    const postData = { learner_status: 'new' };

    render(
      <DeletedByBanner
        deletedBy="moderator-user"
        deletedByLabel="staff"
        message="Deleted by"
        postData={postData}
      />,
    );

    expect(mockAuthorLabel).toHaveBeenCalledWith(expect.objectContaining({
      author: 'moderator-user',
      authorLabel: 'staff',
      labelColor: AvatarOutlineAndLabelColors.staff && `text-${AvatarOutlineAndLabelColors.staff}`,
      linkToProfile: true,
      postOrComment: true,
      singleLine: true,
      postData,
    }));
  });
});
