/**
 * Ban utilities for managing discussion ban/unban action states based on scope.
 *
 * Ban Scope Hierarchy:
 * - Organization-wide ban: User is banned across all courses in the organization
 * - Course-wide ban: User is banned only within a specific course
 *
 * Business Rules:
 * 1. If user has org-wide ban, course-level actions are disabled (org takes precedence)
 * 2. If user has course-wide ban, org-level actions are disabled (can't escalate/de-escalate)
 * 3. When user is not banned, ban actions are enabled, unban actions are disabled
 * 4. When user is banned at a scope, ban action is disabled (already banned), unban is enabled
 */

/**
 * Ban scopes supported by the system
 */
export const BAN_SCOPES = {
  COURSE: 'course',
  ORGANIZATION: 'organization',
};

/**
 * Action types for ban operations
 */
export const BAN_ACTION_TYPES = {
  BAN: 'ban',
  UNBAN: 'unban',
};

/**
 * Determines if a ban/unban action should be disabled based on current ban state and scope.
 *
 * @param {Object} banInfo - Current ban information for the user
 * @param {boolean} banInfo.isAuthorBanned - Whether the user is currently banned
 * @param {string} [banInfo.authorBanScope] - Current scope of ban ('course' or 'organization')
 * @param {string} actionScope - Scope of the action being checked ('course' or 'organization')
 * @param {string} actionType - Type of action ('ban' or 'unban')
 * @returns {boolean} - True if the action should be disabled, false if enabled
 *
 * @example
 * // User is banned at course level, checking course-level unban action
 * isBanActionDisabled({ isAuthorBanned: true, authorBanScope: 'course' }, 'course', 'unban')
 * // Returns: false (unban is enabled)
 *
 * @example
 * // User is banned at org level, checking course-level ban action
 * isBanActionDisabled({ isAuthorBanned: true, authorBanScope: 'organization' }, 'course', 'ban')
 * // Returns: true (can't operate at course level when org ban exists)
 */
export function isBanActionDisabled(banInfo, actionScope, actionType) {
  const { isAuthorBanned, authorBanScope } = banInfo;

  // If ban status is unknown, disable all ban/unban actions for safety
  if (isAuthorBanned === null || isAuthorBanned === undefined) {
    return true;
  }

  // User is not banned
  if (isAuthorBanned === false) {
    // Enable ban actions, disable unban actions
    return actionType === BAN_ACTION_TYPES.UNBAN;
  }

  // User is banned - determine current ban scope (default to course for backward compatibility)
  const currentBanScope = authorBanScope || BAN_SCOPES.COURSE;

  // Check for scope conflicts
  const isSameScope = currentBanScope === actionScope;

  if (!isSameScope) {
    // User is banned at a different scope - disable all actions at this scope
    // (Can't ban/unban at course level if org-wide ban exists, and vice versa)
    return true;
  }

  // User is banned at the same scope as the action
  if (actionType === BAN_ACTION_TYPES.BAN) {
    // Disable ban action (user is already banned at this scope)
    return true;
  }

  // Enable unban action (user can be unbanned at this scope)
  return false;
}

/**
 * Checks if a ban-related action should be disabled based on disabled conditions.
 * This is a helper that extracts ban info from item data and calls isBanActionDisabled.
 *
 * @param {Object} item - Content item (post, comment, or user) with ban information
 * @param {Object} disabledConditions - Conditions that determine if action should be disabled
 * @param {boolean} disabledConditions.isAuthorBanned - Expected ban status (true for ban actions, false for unban)
 * @param {string} disabledConditions.$scope - Scope of the action ('course' or 'organization')
 * @returns {boolean} - True if the action should be disabled
 *
 * @example
 * const post = { isAuthorBanned: true, authorBanScope: 'course' };
 * const conditions = { isAuthorBanned: true, $scope: 'course' };
 * checkBanActionDisabled(post, conditions) // Returns: true (ban action disabled)
 */
export function checkBanActionDisabled(item, disabledConditions) {
  if (!disabledConditions || !('isAuthorBanned' in disabledConditions)) {
    return false;
  }

  // Extract ban info from item (handle both camelCase and snake_case)
  // Default to false/null when feature is disabled and fields are undefined
  const banInfo = {
    isAuthorBanned: item.isAuthorBanned ?? item.is_author_banned ?? false,
    authorBanScope: item.authorBanScope ?? item.author_ban_scope ?? null,
  };

  // Determine action type based on expected ban status
  // If expectedBanStatus is true, this is a ban action; if false, it's an unban action
  const expectedBanStatus = disabledConditions.isAuthorBanned;
  const actionType = expectedBanStatus ? BAN_ACTION_TYPES.BAN : BAN_ACTION_TYPES.UNBAN;

  // Get action scope from disabled conditions
  const actionScope = disabledConditions.$scope;

  if (!actionScope) {
    // If no scope specified in conditions, use default equality check
    return item.isAuthorBanned === expectedBanStatus;
  }

  return isBanActionDisabled(banInfo, actionScope, actionType);
}

/**
 * Simplified public API that accepts a more user-friendly format.
 *
 * @param {Object} banInfo - Ban information
 * @param {boolean} banInfo.isAuthorBanned - Whether user is banned
 * @param {string} [banInfo.authorBanScope] - Current ban scope
 * @param {string} actionScope - Scope of the action ('course' or 'organization')
 * @param {string} actionType - Type of action ('ban' or 'unban')
 * @returns {string} - Action state: 'enabled', 'disabled', or 'alreadyBanned'
 *
 * @example
 * getBanActionState({ isAuthorBanned: false }, 'course', 'ban')
 * // Returns: 'enabled'
 *
 * getBanActionState({ isAuthorBanned: true, authorBanScope: 'course' }, 'course', 'ban')
 * // Returns: 'alreadyBanned'
 */
export function getBanActionState(banInfo, actionScope, actionType) {
  const isDisabled = isBanActionDisabled(banInfo, actionScope, actionType);
  const currentBanScope = banInfo.authorBanScope || BAN_SCOPES.COURSE;

  if (!isDisabled) {
    return 'enabled';
  }

  // Check if disabled because already banned at this scope
  if (banInfo.isAuthorBanned && currentBanScope === actionScope && actionType === BAN_ACTION_TYPES.BAN) {
    return 'alreadyBanned';
  }

  return 'disabled';
}
