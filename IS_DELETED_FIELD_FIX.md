# Fix for is_deleted Field Undefined Issue

## Problem
All posts were showing in both Active and Deleted filters because the `is_deleted` field was `undefined` for existing posts, causing the filtering logic to fail.

## Root Cause Analysis
1. **New posts**: MongoDB backend wasn't setting `is_deleted` field when creating new threads and comments
2. **Existing posts**: Legacy posts in database didn't have the `is_deleted` field at all
3. **API response**: Backend was using `doc.get("is_deleted", False)` but frontend was still receiving `undefined`

## Solution Implemented

### 1. Fixed New Post Creation
**Updated MongoDB Backend Files:**

**`/workspaces/edx-repos/src/forum/forum/backends/mongodb/threads.py`**
- Added `is_deleted`, `deleted_at`, `deleted_by` fields to new thread creation (lines 168-170)
- New threads now get `is_deleted: False` by default

**`/workspaces/edx-repos/src/forum/forum/backends/mongodb/comments.py`**  
- Added `is_deleted`, `deleted_at`, `deleted_by` fields to new comment creation (lines 122-124)
- New comments now get `is_deleted: False` by default

### 2. Created Data Migration
**Management Command:** `/workspaces/edx-repos/src/forum/forum/management/commands/add_soft_delete_fields.py`

**Features:**
- Scans MongoDB for posts missing `is_deleted` field
- Updates existing threads and comments with `is_deleted: False`
- Includes dry-run mode for safety
- Provides detailed progress reporting

### 3. Updated Existing Data
**Migration Results:**
```bash
Found 6 threads without is_deleted field
Updated 6 threads
Found 12 comments without is_deleted field  
Updated 12 comments
Successfully updated existing posts with soft delete fields
```

**Verification:**
```bash
# After migration - no more missing fields
Found 0 threads without is_deleted field
Found 0 comments without is_deleted field
Would update 0 total documents
```

## Technical Details

### Thread Creation Before vs After
**Before:**
```python
thread_data = {
    "title": title,
    "body": body,
    # ... other fields
    # is_deleted field missing!
}
```

**After:**
```python
thread_data = {
    "title": title,
    "body": body,
    # ... other fields
    "is_deleted": False,
    "deleted_at": None,  
    "deleted_by": None,
}
```

### Comment Creation Before vs After
**Before:**
```python
comment_data = {
    "body": body,
    # ... other fields
    # is_deleted field missing!
}
```

**After:**
```python
comment_data = {
    "body": body,
    # ... other fields
    "is_deleted": False,
    "deleted_at": None,
    "deleted_by": None,
}
```

## Impact and Benefits

### ✅ **Fixed Filtering Logic**
- **Active filter**: Now shows only posts with `is_deleted: false`
- **Deleted filter**: Now shows only posts with `is_deleted: true` 
- **All filter**: Shows all posts regardless of deletion status

### ✅ **Data Integrity**
- All existing posts have proper soft delete fields
- New posts automatically get soft delete fields
- No more `undefined` values causing filter confusion

### ✅ **Future-Proof**
- Management command can be run again if needed
- New posts will always have correct fields
- System ready for soft delete operations

## Usage

### Run Migration (if needed in future)
```bash
# Check what would be updated
python manage.py add_soft_delete_fields --dry-run

# Actually update the data
python manage.py add_soft_delete_fields
```

### Verify Data Integrity
```bash
# Should show 0 posts needing updates
python manage.py add_soft_delete_fields --dry-run
```

The soft delete filtering should now work correctly with all posts properly categorized as Active or Deleted based on their `is_deleted` field value.