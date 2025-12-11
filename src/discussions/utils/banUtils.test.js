import {
  BAN_ACTION_TYPES,
  BAN_SCOPES,
  checkBanActionDisabled,
  getBanActionState,
  isBanActionDisabled,
} from './banUtils';

describe('banUtils', () => {
  describe('isBanActionDisabled', () => {
    describe('when user is not banned', () => {
      const banInfo = { isAuthorBanned: false };

      it('enables ban actions at course level', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe(false);
      });

      it('enables ban actions at org level', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.BAN)).toBe(false);
      });

      it('disables unban actions at course level', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });

      it('disables unban actions at org level', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });
    });

    describe('when user has course-level ban', () => {
      const banInfo = { isAuthorBanned: true, authorBanScope: BAN_SCOPES.COURSE };

      it('disables ban action at course level (already banned)', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe(true);
      });

      it('enables unban action at course level', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(false);
      });

      it('disables ban action at org level (scope conflict)', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.BAN)).toBe(true);
      });

      it('disables unban action at org level (scope conflict)', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });
    });

    describe('when user has org-level ban', () => {
      const banInfo = { isAuthorBanned: true, authorBanScope: BAN_SCOPES.ORGANIZATION };

      it('disables ban action at org level (already banned)', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.BAN)).toBe(true);
      });

      it('enables unban action at org level', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.UNBAN)).toBe(false);
      });

      it('disables ban action at course level (scope conflict)', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe(true);
      });

      it('disables unban action at course level (scope conflict)', () => {
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });
    });

    describe('when ban status is unknown', () => {
      it('disables all actions when status is null', () => {
        const banInfo = { isAuthorBanned: null };
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe(true);
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });

      it('disables all actions when status is undefined', () => {
        const banInfo = { isAuthorBanned: undefined };
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe(true);
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });
    });

    describe('backward compatibility', () => {
      it('defaults to course scope when authorBanScope is not provided', () => {
        const banInfo = { isAuthorBanned: true }; // No authorBanScope

        // Should behave like course-level ban
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe(true);
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(false);

        // Should disable org-level actions
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.BAN)).toBe(true);
        expect(isBanActionDisabled(banInfo, BAN_SCOPES.ORGANIZATION, BAN_ACTION_TYPES.UNBAN)).toBe(true);
      });
    });
  });

  describe('checkBanActionDisabled', () => {
    it('handles camelCase property names', () => {
      const item = {
        isAuthorBanned: true,
        authorBanScope: BAN_SCOPES.COURSE,
      };
      const conditions = {
        isAuthorBanned: true,
        $scope: BAN_SCOPES.COURSE,
      };

      expect(checkBanActionDisabled(item, conditions)).toBe(true);
    });

    it('handles snake_case property names from API', () => {
      const item = {
        is_author_banned: true,
        author_ban_scope: BAN_SCOPES.COURSE,
      };
      const conditions = {
        isAuthorBanned: true,
        $scope: BAN_SCOPES.COURSE,
      };

      expect(checkBanActionDisabled(item, conditions)).toBe(true);
    });

    it('returns false when no disabled conditions provided', () => {
      const item = { isAuthorBanned: true };
      expect(checkBanActionDisabled(item, null)).toBe(false);
      expect(checkBanActionDisabled(item, {})).toBe(false);
    });

    it('returns false when isAuthorBanned not in conditions', () => {
      const item = { isAuthorBanned: true };
      const conditions = { someOtherField: true };
      expect(checkBanActionDisabled(item, conditions)).toBe(false);
    });

    it('uses equality check when scope is not specified', () => {
      const item = { isAuthorBanned: true };
      const conditions = { isAuthorBanned: true };
      expect(checkBanActionDisabled(item, conditions)).toBe(true);

      const conditions2 = { isAuthorBanned: false };
      expect(checkBanActionDisabled(item, conditions2)).toBe(false);
    });

    describe('integration with isBanActionDisabled', () => {
      it('correctly determines ban action state for course-banned user', () => {
        const item = {
          isAuthorBanned: true,
          authorBanScope: BAN_SCOPES.COURSE,
        };

        // Ban action at course level (expectedBanStatus=true means this is a ban action)
        const banConditions = {
          isAuthorBanned: true,
          $scope: BAN_SCOPES.COURSE,
        };
        expect(checkBanActionDisabled(item, banConditions)).toBe(true); // Disabled

        // Unban action at course level (expectedBanStatus=false means this is an unban action)
        const unbanConditions = {
          isAuthorBanned: false,
          $scope: BAN_SCOPES.COURSE,
        };
        expect(checkBanActionDisabled(item, unbanConditions)).toBe(false); // Enabled
      });

      it('correctly handles scope conflicts', () => {
        const item = {
          isAuthorBanned: true,
          authorBanScope: BAN_SCOPES.ORGANIZATION,
        };

        // Try to operate at course level when org ban exists
        const courseBanConditions = {
          isAuthorBanned: true,
          $scope: BAN_SCOPES.COURSE,
        };
        expect(checkBanActionDisabled(item, courseBanConditions)).toBe(true); // Disabled

        const courseUnbanConditions = {
          isAuthorBanned: false,
          $scope: BAN_SCOPES.COURSE,
        };
        expect(checkBanActionDisabled(item, courseUnbanConditions)).toBe(true); // Disabled
      });
    });
  });

  describe('getBanActionState', () => {
    it('returns "enabled" when action is not disabled', () => {
      const banInfo = { isAuthorBanned: false };
      expect(getBanActionState(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe('enabled');
    });

    it('returns "alreadyBanned" when trying to ban at same scope', () => {
      const banInfo = { isAuthorBanned: true, authorBanScope: BAN_SCOPES.COURSE };
      expect(getBanActionState(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe('alreadyBanned');
    });

    it('returns "disabled" for scope conflicts', () => {
      const banInfo = { isAuthorBanned: true, authorBanScope: BAN_SCOPES.ORGANIZATION };
      expect(getBanActionState(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe('disabled');
    });

    it('returns "disabled" for unban when user is not banned', () => {
      const banInfo = { isAuthorBanned: false };
      expect(getBanActionState(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe('disabled');
    });

    it('returns "enabled" for unban at correct scope', () => {
      const banInfo = { isAuthorBanned: true, authorBanScope: BAN_SCOPES.COURSE };
      expect(getBanActionState(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe('enabled');
    });

    it('returns "alreadyBanned" for course-level ban when scope is missing (legacy payload)', () => {
      const banInfo = { isAuthorBanned: true };
      expect(getBanActionState(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN)).toBe('alreadyBanned');
    });
  });

  describe('Constants', () => {
    it('exports BAN_SCOPES constants', () => {
      expect(BAN_SCOPES).toEqual({
        COURSE: 'course',
        ORGANIZATION: 'organization',
      });
    });

    it('exports BAN_ACTION_TYPES constants', () => {
      expect(BAN_ACTION_TYPES).toEqual({
        BAN: 'ban',
        UNBAN: 'unban',
      });
    });
  });

  describe('Edge cases', () => {
    it('handles empty banInfo object', () => {
      // Should be treated as ban status unknown
      const result = isBanActionDisabled({}, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.BAN);
      expect(result).toBe(true);
    });

    it('handles mixed case/undefined scope', () => {
      const banInfo = {
        isAuthorBanned: true,
        authorBanScope: undefined,
      };
      // Should default to course scope
      expect(isBanActionDisabled(banInfo, BAN_SCOPES.COURSE, BAN_ACTION_TYPES.UNBAN)).toBe(false);
    });

    it('handles item with mixed camelCase and snake_case', () => {
      const item = {
        isAuthorBanned: true, // camelCase takes precedence
        is_author_banned: false,
        authorBanScope: BAN_SCOPES.COURSE,
      };
      const conditions = {
        isAuthorBanned: true,
        $scope: BAN_SCOPES.COURSE,
      };
      // Should use camelCase value (true)
      expect(checkBanActionDisabled(item, conditions)).toBe(true);
    });
  });
});
