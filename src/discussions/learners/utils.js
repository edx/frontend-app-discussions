import { useMemo } from 'react';

import { Delete } from '@openedx/paragon/icons';

import { useIntl } from '@edx/frontend-platform/i18n';

import { ReactComponent as Undelete } from '../../assets/undelete.svg';
import { ContentActions } from '../../data/constants';
import messages from './messages';

export const LEARNER_ACTIONS_LIST = [
  {
    id: 'delete-course-posts',
    action: ContentActions.DELETE_COURSE_POSTS,
    icon: Delete,
    label: messages.deleteCoursePosts,
  },
  {
    id: 'delete-org-posts',
    action: ContentActions.DELETE_ORG_POSTS,
    icon: Delete,
    label: messages.deleteOrgPosts,
  },
  {
    id: 'restore-course-posts',
    action: ContentActions.RESTORE_COURSE_POSTS,
    icon: Undelete,
    label: messages.restoreCoursePosts,
  },
  {
    id: 'restore-org-posts',
    action: ContentActions.RESTORE_ORG_POSTS,
    icon: Undelete,
    label: messages.restoreOrgPosts,
  },
];

export function useLearnerActions(userHasBulkDeletePrivileges = false) {
  const intl = useIntl();

  const actions = useMemo(() => {
    if (!userHasBulkDeletePrivileges) {
      return [];
    }
    return LEARNER_ACTIONS_LIST.map(action => ({
      ...action,
      label: {
        id: action.label.id,
        defaultMessage: intl.formatMessage(action.label),
      },
    }));
  }, [userHasBulkDeletePrivileges, intl]);

  return actions;
}

export function useLearnerActionsMenu(intl, userHasBulkDeletePrivileges = false) {
  const menuItems = useMemo(() => {
    if (!userHasBulkDeletePrivileges) {
      return [];
    }
    return [
      {
        id: 'delete-activity',
        icon: Delete,
        label: intl.formatMessage(messages.deleteActivity),
        submenu: [
          {
            id: 'delete-course-posts',
            action: ContentActions.DELETE_COURSE_POSTS,
            label: intl.formatMessage(messages.deleteCoursePosts),
          },
          {
            id: 'delete-org-posts',
            action: ContentActions.DELETE_ORG_POSTS,
            label: intl.formatMessage(messages.deleteOrgPosts),
          },
        ],
      },
      {
        id: 'restore-activity',
        icon: Undelete,
        label: intl.formatMessage(messages.restoreActivity),
        submenu: [
          {
            id: 'restore-course-posts',
            action: ContentActions.RESTORE_COURSE_POSTS,
            label: intl.formatMessage(messages.restoreCoursePosts),
          },
          {
            id: 'restore-org-posts',
            action: ContentActions.RESTORE_ORG_POSTS,
            label: intl.formatMessage(messages.restoreOrgPosts),
          },
        ],
      },
    ];
  }, [userHasBulkDeletePrivileges, intl]);

  return menuItems;
}
