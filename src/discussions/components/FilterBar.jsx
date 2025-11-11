import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Badge, Button, Spinner } from '@openedx/paragon';
import { DeleteOutline, RestoreOutline } from '@openedx/paragon/icons';
import classNames from 'classnames';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';

const FilterBar = ({
  isDeletedView,
  setIsDeletedView,
  selectedThreadIds = [],
  onBulkAction,
  isLoading = false,
}) => {
  const intl = useIntl();
  const [pendingAction, setPendingAction] = useState(null);

  const handleBulkSoftDelete = async () => {
    if (selectedThreadIds.length === 0) { return; }

    setPendingAction('soft-delete');
    try {
      await onBulkAction('soft-delete', selectedThreadIds);
    } finally {
      setPendingAction(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedThreadIds.length === 0) { return; }

    setPendingAction('restore');
    try {
      await onBulkAction('restore', selectedThreadIds);
    } finally {
      setPendingAction(null);
    }
  };

  const hasSelectedThreads = selectedThreadIds.length > 0;

  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      {/* Filter Toggle Buttons */}
      <div
        className="d-flex gap-3"
        data-testid="filter-bar"
      >
        <Button
          variant={isDeletedView ? 'outline-primary' : 'primary'}
          size="sm"
          onClick={() => setIsDeletedView(false)}
          data-testid="active-threads-button"
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {intl.formatMessage(messages.activeThreads)}
        </Button>
        <Button
          variant={isDeletedView ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => setIsDeletedView(true)}
          data-testid="deleted-threads-button"
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {intl.formatMessage(messages.deletedThreads)}
        </Button>

        {isLoading && (
          <Spinner
            animation="border"
            size="sm"
            className="ms-2"
            screenReaderText={intl.formatMessage(messages.loadingThreads)}
          />
        )}
      </div>

      {/* Bulk Actions */}
      {hasSelectedThreads && onBulkAction && (
        <div className="d-flex align-items-center gap-3">
          <Badge variant="secondary">
            {intl.formatMessage(messages.selectedCount, { count: selectedThreadIds.length })}
          </Badge>

          {!isDeletedView && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleBulkSoftDelete}
              disabled={pendingAction === 'soft-delete'}
              iconBefore={DeleteOutline}
              className={classNames({
                'opacity-50': pendingAction === 'soft-delete',
              })}
              data-testid="bulk-delete-button"
            >
              {pendingAction === 'soft-delete' ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  {intl.formatMessage(messages.deleting)}
                </>
              ) : (
                intl.formatMessage(messages.deleteSelected)
              )}
            </Button>
          )}

          {isDeletedView && (
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleBulkRestore}
              disabled={pendingAction === 'restore'}
              iconBefore={RestoreOutline}
              className={classNames({
                'opacity-50': pendingAction === 'restore',
              })}
              data-testid="bulk-restore-button"
            >
              {pendingAction === 'restore' ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  {intl.formatMessage(messages.restoring)}
                </>
              ) : (
                intl.formatMessage(messages.restoreSelected)
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

FilterBar.propTypes = {
  isDeletedView: PropTypes.bool.isRequired,
  setIsDeletedView: PropTypes.func.isRequired,
  selectedThreadIds: PropTypes.arrayOf(PropTypes.string),
  onBulkAction: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default FilterBar;
