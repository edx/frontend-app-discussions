import { useCallback, useContext, useMemo } from 'react';

import {
  Block, CheckCircle, CheckCircleOutline, Delete, Edit, InsertLink,
  Institution, Lock, LockOpen, Pin, RemoveCircleOutline, Report, School,
  Verified, VerifiedOutline,
} from '@openedx/paragon/icons';
import { getIn } from 'formik';
import { uniqBy } from 'lodash';
import { useSelector } from 'react-redux';
import {
  generatePath, matchPath, useLocation,
} from 'react-router-dom';

import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

import { ReactComponent as RestoreFromTrash } from '../assets/undelete.svg';
import { DENIED, LOADED } from '../components/NavigationBar/data/slice';
import {
  ContentActions, Routes, ThreadType,
} from '../data/constants';
import { ContentSelectors } from './data/constants';
import PostCommentsContext from './post-comments/postCommentsContext';
import { checkBanActionDisabled } from './utils/banUtils';
import messages from './messages';

export const isCourseStatusValid = (courseStatus) => [DENIED, LOADED].includes(courseStatus);

/**
 * Get HTTP Error status from generic error.
 * @param error Generic caught error.
 * @returns {number|null}
 */
export const getHttpErrorStatus = error => error?.customAttributes?.httpErrorStatus ?? error?.response?.status;

/**
 * Return true if a field has been modified and is no longer valid
 * @param {string} field Name of field
 * @param {{}} errors formik error object
 * @param {{}} touched formik touched object
 * @returns {boolean}
 */
export function isFormikFieldInvalid(field, {
  errors,
  touched,
}) {
  return Boolean(getIn(touched, field) && getIn(errors, field));
}

/**
 * Hook to return the path for the current comments page
 * @returns {string}
 */
export function useCommentsPagePath() {
  const location = useLocation();
  const { params: { page } } = matchPath({ path: Routes.COMMENTS.PAGE }, location.pathname);
  return Routes.COMMENTS.PAGES[page];
}

/**
 * Check if the provided comment or post supports the provided option.
 * @param {{editableFields:[string]}} content
 * @param {ContentActions} action
 * @param {boolean} hasModerationPrivileges - Whether user has moderation privileges
 * @param {string|null} contentType - Type of content (POST, COMMENT, etc.)
 * @param {boolean} isOwnContent - Whether current user is the author
 * @returns {boolean}
 */
export function checkPermissions(
  content,
  action,
  hasModerationPrivileges = false,
  contentType = null,
  isOwnContent = false,
) {
  // Handle both camelCase and snake_case from API
  const editableFields = content.editableFields || content.editable_fields || [];
  const canDelete = content.canDelete ?? content.can_delete ?? false;
  const { author } = content;

  if (editableFields.includes(action)) {
    return true;
  }
  // Both delete and restore actions check `content.canDelete`
  // BUT: only allow if user has moderation privileges OR is deleting their own content
  if (action === ContentActions.DELETE || action === ContentActions.RESTORE) {
    if (hasModerationPrivileges) {
      return canDelete;
    }
    // For anonymous posts (author and authorId are null), trust backend's canDelete
    // since backend already verifies authorship without exposing identity
    const isAnonymousPost = !author && !content.authorId;
    if (isAnonymousPost) {
      return canDelete;
    }
    // Non-moderators (including Course Staff/Admin) can only delete/restore their own content
    return canDelete && isOwnContent;
  }
  // Regular delete post - moderators can delete any content, others only their own
  if (action === ContentActions.DELETE_POST) {
    if (hasModerationPrivileges) {
      return true;
    }
    // For anonymous posts (author and authorId are null), trust backend's canDelete
    const isAnonymousPost = !author && !content.authorId;
    if (isAnonymousPost) {
      return canDelete;
    }
    // Non-moderators (including Course Staff/Admin) can only delete their own posts
    return canDelete && isOwnContent;
  }
  // Ban/unban actions: require moderation privileges AND prevent self-banning
  if (action === ContentActions.BAN_COURSE
    || action === ContentActions.BAN_ORG
    || action === ContentActions.UNBAN_COURSE
    || action === ContentActions.UNBAN_ORG) {
    const currentUser = getAuthenticatedUser()?.username;
    const isSelf = currentUser && author && currentUser === author;
    return hasModerationPrivileges && !isSelf;
  }
  // Bulk delete actions ONLY for users with moderation privileges (NOT Course Staff/Admin)
  if (action === ContentActions.DELETE_USER_COURSE
    || action === ContentActions.DELETE_USER_ORG
    || action === ContentActions.UNDELETE_USER_COURSE
    || action === ContentActions.UNDELETE_USER_ORG) {
    if (!hasModerationPrivileges) {
      return false; // Course Staff/Admin cannot bulk delete
    }
    const currentUser = getAuthenticatedUser()?.username;
    const isSelf = currentUser && author && currentUser === author;
    return !isSelf; // Moderators can bulk delete but not themselves
  }
  // For mute actions we check `content.canMute`
  if (action === ContentActions.MUTE_USER || action === ContentActions.UNMUTE_USER
      || action === ContentActions.MUTE_PERSONAL || action === ContentActions.MUTE_COURSEWIDE
      || action === ContentActions.MUTE_AND_REPORT || action === ContentActions.UNMUTE_PERSONAL
      || action === ContentActions.UNMUTE_COURSEWIDE) {
    return Boolean(content.canMute);
  }
  // Copy link action is only available for posts, not comments, and must be in editable fields
  if (action === ContentActions.COPY_LINK) {
    return contentType !== 'COMMENT' && editableFields.includes('copy_link');
  }
  // Report/unreport actions are available to everyone except self
  if (action === ContentActions.REPORT) {
    const currentUser = getAuthenticatedUser()?.username;
    const isSelf = currentUser && author && currentUser === author;
    return !isSelf;
  }
  // Pin/unpin actions are available to moderators and only for posts
  if (action === ContentActions.PIN) {
    return hasModerationPrivileges;
  }
  // Close/reopen actions are available to moderators and only for posts
  if (action === ContentActions.CLOSE) {
    return hasModerationPrivileges;
  }
  return false;
}

/**
 * List of all possible actions for comments or posts.
 *
 * * `id` is a unique id for each action.
 * * `action` is the action being performed. One action can
 *    have multiple mutually-exclusive entries (such as close/open)..
 * * `icon` is the icon component to show for the action.
 * * `label` is the translatable label message that can be passed to intl.
 * * `conditions` is the an object where the key and value represent the key and value that should match
 *    in the content/post.
 *    e.g. for {pinned:false} the action will show up if the content/post has post.pinned==false
 */
export const ACTIONS_LIST = [
  {
    id: 'copy-link',
    action: ContentActions.COPY_LINK,
    icon: InsertLink,
    label: messages.copyLink,
  },
  {
    id: 'edit',
    action: ContentActions.EDIT_CONTENT,
    icon: Edit,
    label: messages.editAction,
  },
  {
    id: 'pin',
    action: ContentActions.PIN,
    icon: Pin,
    label: messages.pinAction,
    conditions: { pinned: false },
  },
  {
    id: 'unpin',
    action: ContentActions.PIN,
    icon: Pin,
    label: messages.unpinAction,
    conditions: { pinned: true },
  },
  {
    id: 'endorse',
    action: ContentActions.ENDORSE,
    icon: VerifiedOutline,
    label: messages.endorseAction,
    conditions: {
      endorsed: false,
      postType: ThreadType.DISCUSSION,
    },
  },
  {
    id: 'unendorse',
    action: ContentActions.ENDORSE,
    icon: Verified,
    label: messages.unendorseAction,
    conditions: {
      endorsed: true,
      postType: ThreadType.DISCUSSION,
    },
  },
  {
    id: 'answer',
    action: ContentActions.ENDORSE,
    icon: CheckCircleOutline,
    label: messages.markAnsweredAction,
    conditions: {
      endorsed: false,
      postType: ThreadType.QUESTION,
    },
  },
  {
    id: 'unanswer',
    action: ContentActions.ENDORSE,
    icon: CheckCircle,
    label: messages.unmarkAnsweredAction,
    conditions: {
      endorsed: true,
      postType: ThreadType.QUESTION,
    },
  },
  {
    id: 'close',
    action: ContentActions.CLOSE,
    icon: Lock,
    label: messages.closeAction,
    conditions: { closed: false },
  },
  {
    id: 'reopen',
    action: ContentActions.CLOSE,
    icon: LockOpen,
    label: messages.reopenAction,
    conditions: { closed: true },
  },
  {
    id: 'report',
    action: ContentActions.REPORT,
    icon: Report,
    label: messages.reportAction,
    conditions: { abuseFlagged: false },
  },
  {
    id: 'unreport',
    action: ContentActions.REPORT,
    icon: Report,
    label: messages.unreportAction,
    conditions: { abuseFlagged: true },
  },
  {
    id: 'ban',
    icon: Block,
    label: messages.banAction,
    hasSubmenu: true,
    submenu: [
      {
        id: 'ban-course',
        action: ContentActions.BAN_COURSE,
        label: messages.banUserCourse,
        disabledConditions: { isAuthorBanned: true, $scope: 'course' },
      },
      {
        id: 'ban-org',
        action: ContentActions.BAN_ORG,
        label: messages.banUserOrg,
        disabledConditions: { isAuthorBanned: true, $scope: 'organization' },
      },
      {
        id: 'unban-course',
        action: ContentActions.UNBAN_COURSE,
        label: messages.unbanUserCourse,
        disabledConditions: { isAuthorBanned: false, $scope: 'course' },
      },
      {
        id: 'unban-org',
        action: ContentActions.UNBAN_ORG,
        label: messages.unbanUserOrg,
        disabledConditions: { isAuthorBanned: false, $scope: 'organization' },
      },
    ],
  },
  {
    id: 'mute',
    icon: RemoveCircleOutline,
    label: messages.muteAction,
    hasSubmenu: true,
    conditions: { canMute: true },
    submenu: [
      {
        id: 'mute-personal',
        action: ContentActions.MUTE_PERSONAL,
        label: messages.mutePersonal,
        disabledConditions: { isMutedPersonal: true },
      },
      {
        id: 'mute-coursewide',
        action: ContentActions.MUTE_COURSEWIDE,
        label: messages.muteCoursewide,
        disabledConditions: { isMutedCourseWide: true },
      },
      {
        id: 'unmute-personal',
        action: ContentActions.UNMUTE_PERSONAL,
        label: messages.unmutePersonal,
        disabledConditions: { isMutedPersonal: false },
      },
      {
        id: 'unmute-coursewide',
        action: ContentActions.UNMUTE_COURSEWIDE,
        label: messages.unmuteCoursewide,
        disabledConditions: { isMutedCourseWide: false },
      },
    ],
  },
  {
    id: 'delete',
    icon: Delete,
    label: messages.deleteAction,
    hasSubmenu: true,
    submenu: [
      {
        id: 'delete-post',
        action: ContentActions.DELETE_POST,
        label: messages.deletePost,
      },
      {
        id: 'delete-user-course',
        action: ContentActions.DELETE_USER_COURSE,
        label: messages.deleteUserCourse,
      },
      {
        id: 'delete-user-org',
        action: ContentActions.DELETE_USER_ORG,
        label: messages.deleteUserOrg,
      },
    ],
  },
  {
    id: 'restore',
    action: ContentActions.RESTORE,
    icon: RestoreFromTrash,
    label: messages.restoreAction,
    conditions: { canDelete: true, isDeleted: true },
  },
];

export function useActions(contentType, id, hasModerationPrivileges) {
  const { postType } = useContext(PostCommentsContext);
  const baseContent = useSelector(ContentSelectors[contentType](id));
  const enableDiscussionBan = useSelector(state => state.config.enableDiscussionBan);
  // Global Staff - has all permissions
  const isGlobalStaff = useSelector(state => state.config.isUserAdmin);
  // Discussion Admin/Moderator - has all discussion permissions
  const hasDiscussionModeratorPrivileges = useSelector(state => state.config.hasModerationPrivileges);
  // Group TA - has limited permissions within their group
  const isUserGroupTA = useSelector(state => state.config.isGroupTa);
  // Course Staff/Admin - NO discussion privileges (treated as learners)
  const currentUser = getAuthenticatedUser()?.username;
  const personalMutedUsers = useSelector(state => state.learners?.mutedUsers?.personal || []);
  const courseWideMutedUsers = useSelector(state => state.learners?.mutedUsers?.course || []);

  // Calculate if current user can mute the post author
  const canMute = useMemo(() => {
    // If canMute is already explicitly set in baseContent, use that value
    if (typeof baseContent?.canMute === 'boolean') {
      return baseContent.canMute;
    }

    if (!baseContent?.author) {
      return false;
    }

    // Users cannot mute themselves
    if (currentUser === baseContent.author) {
      return false;
    }

    // Only Global Staff, Discussion Moderators, and Group TAs can mute users
    // Course Staff/Admin are excluded
    if (isGlobalStaff || hasDiscussionModeratorPrivileges || isUserGroupTA) {
      // Check if post author is staff (this would need to come from post data)
      // For now, assume non-staff authors can be muted by privileged users
      return !baseContent.authorLabel
        || !['Staff', 'Moderator', 'Community TA'].includes(baseContent.authorLabel);
    }

    // Learners can mute other learners but not staff
    if (baseContent.authorLabel
      && ['Staff', 'Moderator', 'Community TA'].includes(baseContent.authorLabel)) {
      return false;
    }

    return true;
  }, [baseContent, isGlobalStaff, hasDiscussionModeratorPrivileges, isUserGroupTA, currentUser]);

  // Check if user is muted by the CURRENT logged-in user ONLY
  const muteState = useMemo(() => {
    if (!baseContent?.author) {
      return {
        isMuted: false,
        isMutedPersonal: false,
        isMutedCourseWide: false,
      };
    }

    // personalMutedUsers and courseWideMutedUsers are already scoped to the current viewer's permissions
    const isMutedInPersonal = personalMutedUsers.includes(baseContent.author);
    const isMutedInCourseWide = courseWideMutedUsers.includes(baseContent.author);
    const hasScopedMuteState = isMutedInPersonal || isMutedInCourseWide;

    // Fallback: if legacy isMuted exists but scoped arrays are empty, treat as both scopes
    // so unmute options are still accessible and no action is accidentally hidden.
    const isMutedFromContent = typeof baseContent?.isMuted === 'boolean' ? baseContent.isMuted : false;
    const shouldFallbackToUnknownScope = isMutedFromContent && !hasScopedMuteState;

    const isMutedPersonal = isMutedInPersonal || shouldFallbackToUnknownScope;
    const isMutedCourseWide = isMutedInCourseWide || shouldFallbackToUnknownScope;

    return {
      isMuted: isMutedPersonal || isMutedCourseWide,
      isMutedPersonal,
      isMutedCourseWide,
    };
  }, [baseContent, personalMutedUsers, courseWideMutedUsers]);

  const content = {
    ...baseContent,
    postType,
    canMute,
    ...muteState,
  };

  const checkConditions = useCallback((item, conditions) => (
    conditions
      ? Object.keys(conditions)
        .map(key => item[key] === conditions[key])
        .every(condition => condition === true)
      : true
  ), []);

  const isActionDisabled = useCallback((actionId, isDeleted) => (
    // For deleted items, disable all actions except 'copy-link' and 'restore'
    isDeleted && actionId !== 'copy-link' && actionId !== 'restore'
  ), []);

  const checkDisabled = useCallback((item, disabledConditions) => {
    if (!disabledConditions) {
      return false;
    }

    // Handle ban status with scope awareness using dedicated utility
    if ('isAuthorBanned' in disabledConditions) {
      return checkBanActionDisabled(item, disabledConditions);
    }

    // For other conditions, use standard equality check
    return Object.keys(disabledConditions)
      .map(key => item[key] === disabledConditions[key])
      .every(condition => condition === true);
  }, []);

  const actions = useMemo(() => {
    // Check if current user is the content author
    // For anonymous posts, author is "anonymous" but authorId contains the real user ID
    const currentUserId = getAuthenticatedUser()?.userId;
    const isOwnContent = (currentUser && baseContent?.author && currentUser === baseContent.author)
      || (currentUserId && baseContent?.authorId && String(currentUserId) === String(baseContent.authorId));

    const filteredActions = ACTIONS_LIST.filter(
      ({
        action,
        conditions = null,
        hasSubmenu = false,
        id: actionId,
      }) => {
        // Hide ban menu if feature flag is disabled
        if (actionId === 'ban' && !enableDiscussionBan) {
          return false;
        }
        // For items with submenus, skip permission check on parent item
        const hasPermission = hasSubmenu
          ? true
          : checkPermissions(content, action, hasModerationPrivileges, contentType, isOwnContent);
        const meetsConditions = checkConditions(content, conditions);

        return hasPermission && meetsConditions;
      },
    ).map(action => {
      // Special handling for mute action based on user privileges
      if (action.id === 'mute') {
        // Only Global Staff, Discussion Moderators, and Group TAs get submenu
        // Course Staff/Admin are excluded - they behave like learners
        const hasStaffMutePrivileges = isGlobalStaff || hasDiscussionModeratorPrivileges || isUserGroupTA;

        if (hasStaffMutePrivileges) {
          // For privileged users, keep all submenu options visible and use disabled states.
          const filteredSubmenu = action.submenu
            .filter(subAction => checkPermissions(
              content,
              subAction.action,
              hasModerationPrivileges,
              contentType,
              isOwnContent,
            ))
            .map(subAction => ({
              ...subAction,
              disabled: (
                checkDisabled(content, subAction.disabledConditions)
                || isActionDisabled(subAction.id, content.isDeleted)
              ),
            }));

          return {
            ...action,
            submenu: filteredSubmenu,
            disabled: isActionDisabled(action.id, content.isDeleted) || filteredSubmenu.length === 0,
          };
        }
        // For regular users (including Course Staff/Admin), remove submenu and use direct MUTE_USER/UNMUTE_USER actions
        return {
          ...action,
          hasSubmenu: false,
          submenu: undefined,
          action: content.isMuted ? ContentActions.UNMUTE_USER : ContentActions.MUTE_USER,
          label: content.isMuted ? messages.unmuteAction : messages.muteAction,
          disabled: isActionDisabled(action.id, content.isDeleted),
        };
      }

      // For actions with submenus, filter submenu items and check permissions
      if (action.submenu) {
        const filteredSubmenu = action.submenu
          .filter(subAction => {
            // Filter ban-related actions if feature flag is disabled
            if (!enableDiscussionBan && (
              subAction.action === ContentActions.BAN_COURSE
              || subAction.action === ContentActions.BAN_ORG
              || subAction.action === ContentActions.UNBAN_COURSE
              || subAction.action === ContentActions.UNBAN_ORG
            )) {
              return false;
            }
            return checkPermissions(content, subAction.action, hasModerationPrivileges, contentType, isOwnContent);
          })
          .map(subAction => ({
            ...subAction,
            disabled: (
              checkDisabled(content, subAction.disabledConditions)
              || isActionDisabled(subAction.id, content.isDeleted)
            ),
          }));

        // If only one submenu item remains, convert to direct action (no submenu)
        if (filteredSubmenu.length === 1) {
          return {
            id: filteredSubmenu[0].id,
            action: filteredSubmenu[0].action,
            icon: action.icon,
            label: filteredSubmenu[0].label,
            disabled: filteredSubmenu[0].disabled,
          };
        }

        // If multiple items, keep as submenu
        if (filteredSubmenu.length > 1) {
          return {
            ...action,
            submenu: filteredSubmenu,
            disabled: filteredSubmenu.every(subAction => subAction.disabled),
          };
        }

        // If no items remain, filter out this action
        return null;
      }
      // Apply isActionDisabled for non-submenu actions (e.g., restore)
      return {
        ...action,
        disabled: isActionDisabled(action.id, content.isDeleted),
      };
    }).filter(Boolean); // Remove null entries

    return filteredActions;
  }, [
    content,
    hasModerationPrivileges,
    enableDiscussionBan,
    checkConditions,
    checkDisabled,
    isActionDisabled,
    currentUser,
    isGlobalStaff,
    hasDiscussionModeratorPrivileges,
    isUserGroupTA,
    contentType,
  ]);

  return actions;
}

export const formikCompatibleHandler = (formikHandler, name) => (value) => formikHandler({
  target: {
    name,
    value,
  },
});

/**
 * A wrapper for the generatePath function that generates a new path that keeps the existing
 * query parameters intact
 * @param path
 * @param params
 * @return {function(*): *&{pathname: *}}
 */
export const discussionsPath = (path, params) => {
  const pathname = generatePath(path, params);
  return (location) => ({ ...location, pathname });
};

/**
 * Helper function to make a postMessage call
 * @param {string} type message type
 * @param {object} payload data to send in message
 */
export function postMessageToParent(type, payload = {}) {
  if (window.parent !== window) {
    const messageTargets = [
      getConfig().LEARNING_BASE_URL,
      getConfig().LMS_BASE_URL,
    ];
    messageTargets.forEach(target => {
      window.parent.postMessage(
        {
          type,
          payload,
        },
        target,
      );
    });
  }
}

export const isPostPreviewAvailable = (htmlNode) => {
  const containsImage = htmlNode.match(/(<img((?:\\.|.)*)>)/);
  const isLatex = htmlNode.match(/(\${1,2})((?:\\.|.)*)/)
    || htmlNode.match(/(\[mathjax](.+?))+/)
    || htmlNode.match(/(\[mathjaxinline](.+?))+/)
    || htmlNode.match(/(\\\[(.+?))+/)
    || htmlNode.match(/(\\\((.+?))+/);

  if (containsImage || isLatex || htmlNode === '') {
    return false;
  }
  return true;
};

/**
 * Helper function to filter posts
 * @param {array} posts arrays of posts
 * @param {string} filterBy name of post object attribute. un will use for reverse
 *  condition. like pinned attribute for pinned post and unpinned for non pinned posts.
 */
export const filterPosts = (posts, filterBy) => uniqBy(posts, 'id').filter(
  post => (filterBy.startsWith('un') ? !post[filterBy.slice(2)] : post[filterBy]),
);

export function handleKeyDown(event) {
  const { key } = event;
  if (key !== 'ArrowDown' && key !== 'ArrowUp') { return; }
  const option = event.target;

  let selectedOption;
  if (key === 'ArrowDown') { selectedOption = option.nextElementSibling; }
  if (key === 'ArrowUp') { selectedOption = option.previousElementSibling; }

  if (selectedOption) {
    selectedOption.focus();
  }
}

export function isLastElementOfList(list, element) {
  return list[list.length - 1] === element;
}

export function truncatePath(path) {
  return path.substring(0, path.lastIndexOf('/'));
}

export function getAuthorLabel(intl, authorLabel) {
  const authorLabelMappings = {
    Staff: {
      icon: Institution,
      authorLabelMessage: intl.formatMessage(messages.authorLabelStaff),
    },
    Moderator: {
      icon: School,
      authorLabelMessage: intl.formatMessage(messages.authorLabelModerator),
    },
    'Community TA': {
      icon: School,
      authorLabelMessage: intl.formatMessage(messages.authorLabelTA),
    },
  };

  return authorLabelMappings[authorLabel] || {};
}

export const extractContent = (content) => {
  if (typeof content === 'object') {
    return content.target.getContent();
  }
  return content;
};
