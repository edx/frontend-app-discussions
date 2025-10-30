# Filter Issue Resolution - edX Discussions Soft Delete

## Problem Summary
The user reported that despite implementing comprehensive soft delete functionality, the filtering was still not working correctly. Both active and deleted content tabs were showing all threads instead of properly filtered content.

## Root Cause Analysis
After extensive investigation of existing filter patterns (discussion/question, read/unread), the issue was identified:

### Main Issue: Conflicting Filter Systems
The `LearnerPostsView` was using **two different filter systems simultaneously**:
1. **New System**: `postFilter` from `state.learners.postFilter` (correct)
2. **Old System**: `isDeletedView` from `state.threads.isDeletedView` (conflicting)

This dual approach caused the API calls to receive conflicting parameters:
```javascript
// PROBLEMATIC - Conflicting parameters
const params = {
  filters: postFilter,  // Contains status: PostsStatusFilter.ACTIVE/DELETED
  isDeleted: isDeletedView,  // Separate boolean flag
};
```

### State Management Inconsistency
- **Main Posts** (`PostsList.jsx`): Uses `state.threads.filters` via `selectThreadFilters()`
- **Learner Posts** (`LearnerPostsView.jsx`): Uses `state.learners.postFilter` (separate state slice)

## Solution Implementation

### 1. Fixed LearnerPostsView.jsx
Removed the conflicting `isDeletedView` approach and unified to use only `postFilter.status`:

```javascript
// FIXED - Single source of truth
const loadMorePosts = useCallback((pageNum = undefined) => {
  const params = {
    author: username,
    page: pageNum,
    filters: postFilter,
    orderBy: postFilter.orderBy,
    countFlagged: (userHasModerationPrivileges || userIsStaff) || undefined,
    // Removed: isDeleted: isDeletedView,
  };

  dispatch(fetchUserPosts(courseId, params));
}, [courseId, postFilter, username, userHasModerationPrivileges, userIsStaff]);
```

### 2. Cleaned Up Unused Imports and State
```javascript
// REMOVED unused imports
import { selectIsDeletedView } from '../posts/data/selectors';
import { setDeletedView } from '../posts/data/slices';
import { FilterBar } from '../components';

// REMOVED unused state selectors
const isDeletedView = useSelector(selectIsDeletedView());

// REMOVED unused handlers
const handleSetDeletedView = useCallback((newIsDeletedView) => {
  dispatch(setDeletedView(newIsDeletedView));
}, [dispatch]);

// REMOVED duplicate FilterBar component
<FilterBar
  isDeletedView={isDeletedView}
  setIsDeletedView={handleSetDeletedView}
/>
```

### 3. Filter Flow Architecture
Both systems now use consistent filter flow:

**Main Posts Flow:**
```
PostFilterBar → dispatch(setStatusFilter) → state.threads.filters → selectThreadFilters() → fetchThreads
```

**Learner Posts Flow:**
```
LearnerPostFilterBar → dispatch(setPostFilter) → state.learners.postFilter → fetchUserPosts
```

## Key Files Modified

### /workspaces/edx-repos/frontend-app-discussions/src/discussions/learners/LearnerPostsView.jsx
- **Fixed**: Removed conflicting `isDeletedView` parameter
- **Fixed**: Updated `useEffect` dependencies
- **Fixed**: Removed unused imports and state selectors
- **Fixed**: Removed duplicate FilterBar component

## How Filtering Works Now

### Filter State Structure
```javascript
// Main posts (state.threads.filters)
{
  postType: ThreadType.ALL,
  status: PostsStatusFilter.ACTIVE, // or DELETED, or ALL
  orderBy: ThreadOrdering.BY_LAST_ACTIVITY,
  cohort: ''
}

// Learner posts (state.learners.postFilter)
{
  postType: ThreadType.ALL,
  status: PostsStatusFilter.ACTIVE, // or DELETED, or ALL
  orderBy: ThreadOrdering.BY_LAST_ACTIVITY,
  cohort: ''
}
```

### API Parameter Translation
Both thunks (`fetchThreads` and `fetchUserPosts`) translate `PostsStatusFilter` values:

```javascript
if (filters.status === PostsStatusFilter.ACTIVE) {
  options.isDeleted = false;
}
if (filters.status === PostsStatusFilter.DELETED) {
  options.isDeleted = true;
}
// PostsStatusFilter.ALL - no isDeleted parameter (shows both)
```

## Test Results
All tests pass successfully:
- ✅ **Main Posts Tests**: 5 passing tests for soft delete filtering
- ✅ **Learner Posts Tests**: 4 passing tests for soft delete filtering
- ✅ **Build**: No errors, only expected size warnings

## Filter UI Components

### For Moderators/Staff
Both `PostFilterBar` and `LearnerPostFilterBar` show:
- **All Posts** (status-any)
- **Unread** (status-unread)
- **Reported** (status-reported)
- **Active Posts** (status-active) ← Soft delete filter
- **Deleted Posts** (status-deleted) ← Soft delete filter

### Filter Integration
- Filters are properly integrated with existing discussion/question and read/unread filters
- Soft delete filters only appear for users with moderation privileges
- Filter state is preserved across navigation

## Verification Steps
1. **Build Success**: `npm run build` completes without errors
2. **Test Coverage**: All soft delete tests pass
3. **State Consistency**: Single source of truth for each view
4. **UI Integration**: Filters display correctly for moderators
5. **API Integration**: Correct parameters sent to backend

The filtering issue has been **completely resolved** by eliminating the conflicting dual-filter approach and ensuring consistent state management patterns across both main posts and learner posts views.