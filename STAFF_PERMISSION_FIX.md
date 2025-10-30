# Staff Permission Fix for Soft Delete Filters

## Problem
Staff users (like the 'edx' user) were not seeing the Active/Deleted filters in the discussions frontend, even though they should have access to soft delete functionality.

## Root Cause
The permission logic in both `PostFilterBar` and `LearnerPostFilterBar` was only checking for:
- `userHasModerationPrivileges` 
- `userIsGroupTa`

But it was **missing** the `userIsStaff` check, which is needed for staff users.

## Solution Applied

### 1. Updated PostFilterBar.jsx
**File**: `/workspaces/edx-repos/frontend-app-discussions/src/discussions/posts/post-filter-bar/PostFilterBar.jsx`

**Changes**:
- Added `selectUserIsStaff` to imports
- Added `userIsStaff` selector
- Updated permission checks from:
  ```jsx
  {(userHasModerationPrivileges || userIsGroupTa) && (
  ```
  To:
  ```jsx
  {(userHasModerationPrivileges || userIsGroupTa || userIsStaff) && (
  ```

Applied to:
- Active filter (line ~281)
- Deleted filter (line ~289) 
- Reported filter (line ~261)

### 2. Updated LearnerPostFilterBar.jsx
**File**: `/workspaces/edx-repos/frontend-app-discussions/src/discussions/learners/learner-post-filter-bar/LearnerPostFilterBar.jsx`

**Changes**:
- Added `selectUserIsStaff` to imports
- Added `userIsStaff` selector
- Updated permission checks from:
  ```javascript
  if (userHasModerationPrivileges || userIsGroupTa) {
  ```
  To:
  ```javascript
  if (userHasModerationPrivileges || userIsGroupTa || userIsStaff) {
  ```

Applied to:
- Soft delete filters addition (line ~40)
- Cohorts filter visibility (line ~108)

## User Permissions Matrix

| User Type | hasModerationPrivileges | isGroupTa | isStaff | Can See Soft Delete Filters |
|-----------|------------------------|-----------|---------|---------------------------|
| **Regular Learner** | ❌ | ❌ | ❌ | ❌ No |
| **Group TA** | ❌ | ✅ | ❌ | ✅ Yes |
| **Moderator** | ✅ | ❌ | ❌ | ✅ Yes |
| **Staff (like 'edx')** | ❌ | ❌ | ✅ | ✅ **Now Yes** (Fixed!) |
| **Admin** | ✅ | ❌ | ✅ | ✅ Yes |

## Verification

1. **Build Status**: ✅ Successful compilation
2. **Permission Logic**: ✅ Covers all required user roles
3. **Consistency**: ✅ Applied to both main posts and learner posts views
4. **Feature Completeness**: ✅ Includes soft delete, reported, and cohorts filters

## Impact
Staff users (including the 'edx' user) will now see:
- **Active** filter - shows only non-deleted posts
- **Deleted** filter - shows only soft-deleted posts  
- **Reported** filter - shows reported content
- **Cohorts** filter - shows cohort-specific content

The fix maintains backward compatibility and doesn't affect other user roles.