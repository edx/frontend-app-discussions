import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  reported: {
    id: 'discussions.learner.reported',
    defaultMessage: '{reported} reported',
  },
  previouslyReported: {
    id: 'discussions.learner.previouslyReported',
    defaultMessage: '{previouslyReported} previously reported',
  },
  lastActive: {
    id: 'discussions.learner.lastLogin',
    defaultMessage: 'Last active {lastActiveTime}',
  },
  loadMore: {
    id: 'discussions.learner.loadMostLearners',
    defaultMessage: 'Load more',
    description: 'Text on button for loading more learners',
  },
  back: {
    id: 'discussions.learner.back',
    defaultMessage: 'Back',
    description: 'Text on button for back to learners list',
  },
  activityForLearner: {
    id: 'discussions.learner.activityForLearner',
    defaultMessage: 'Activity for {username}',
    description: 'Text for learners post header',
  },
  mostActivity: {
    id: 'discussions.learner.mostActivity',
    defaultMessage: 'Most activity',
    description: 'Text for learners sorting by most activity',
  },
  reportedActivity: {
    id: 'discussions.learner.reportedActivity',
    defaultMessage: 'Reported activity',
    description: 'Text for learners sorting by reported activity',
  },
  recentActivity: {
    id: 'discussions.learner.recentActivity',
    defaultMessage: 'Recent activity',
    description: 'Text for learners sorting by recent activity',
  },
  sortFilterStatus: {
    id: 'discussions.learner.sortFilterStatus',
    defaultMessage: `All learners sorted by {sort, select,
      flagged {reported activity}
      activity {most activity}
      deleted {deleted activity}
      other {{sort}}
    }`,
    description: 'Text for current selected learners filter',
  },
  allActivity: {
    id: 'discussion.learner.allActivity',
    defaultMessage: 'All activity',
    description: 'Tooltip text for all activity icon',
  },
  posts: {
    id: 'discussion.learner.posts',
    defaultMessage: 'Posts',
    description: 'Tooltip text for all posts icon',
  },
  deletedActivity: {
    id: 'discussion.learner.deletedActivity',
    defaultMessage: 'Deleted activity',
    description: 'Tooltip text for deleted activity icon',
  },
  deleteActivity: {
    id: 'discussions.learner.actions.deleteActivity',
    defaultMessage: 'Delete activity',
    description: 'Main menu option for deleting user activity',
  },
  restoreActivity: {
    id: 'discussions.learner.actions.restoreActivity',
    defaultMessage: 'Restore activity',
    description: 'Main menu option for restoring user activity',
  },
  withinCourse: {
    id: 'discussions.learner.actions.withinCourse',
    defaultMessage: 'Within course',
    description: 'Submenu option for actions within the current course',
  },
  withinOrg: {
    id: 'discussions.learner.actions.withinOrg',
    defaultMessage: 'Within organization',
    description: 'Submenu option for actions within the organization',
  },
  deleteCoursePosts: {
    id: 'discussions.learner.actions.deleteCoursePosts',
    defaultMessage: 'Delete user posts within this course',
    description: 'Action to delete user posts within a specific course',
  },
  deleteOrgPosts: {
    id: 'discussions.learner.actions.deleteOrgPosts',
    defaultMessage: 'Delete user posts within this organization',
    description: 'Action to delete user posts within the organization',
  },
  restoreCoursePosts: {
    id: 'discussions.learner.actions.restoreCoursePosts',
    defaultMessage: 'Restore user posts within this course',
    description: 'Action to restore deleted user posts within a specific course',
  },
  restoreOrgPosts: {
    id: 'discussions.learner.actions.restoreOrgPosts',
    defaultMessage: 'Restore user posts within this organization',
    description: 'Action to restore deleted user posts within the organization',
  },
  deletePostsTitle: {
    id: 'discussions.learner.deletePosts.title',
    defaultMessage: 'Are you sure you want to delete this user\'s discussion contributions?',
    description: 'Title for delete course posts confirmation dialog',
  },
  deletePostsDescription: {
    id: 'discussions.learner.deletePosts.description',
    defaultMessage: `{bulkType, select,
    course {You are about to delete {count, plural, one {# discussion contribution} other {# discussion contributions}} by this user in this course. This includes all discussion threads, responses, and comments authored by them.}
    org {You are about to delete {count, plural, one {# discussion contribution} other {# discussion contributions}} by this user across the organization. This includes all discussion threads, responses, and comments authored by them.}
    other {You are about to delete {count, plural, one {# discussion contribution} other {# discussion contributions}} by this user. This includes all discussion threads, responses, and comments authored by them.}
  }`,
    description: 'Description for delete posts confirmation dialog',
  },
  deletePostsConfirm: {
    id: 'discussions.learner.deletePosts.confirm',
    defaultMessage: 'Delete',
    description: 'Confirm button text for delete posts',
  },
  deletePostConfirmPending: {
    id: 'discussions.learner.deletePosts.confirm.pending',
    defaultMessage: 'Deleting',
    description: 'Pending state of confirm button text for delete posts',
  },
  restorePostsTitle: {
    id: 'discussions.learner.restorePosts.title',
    defaultMessage: 'Restore this user\'s discussion contributions?',
    description: 'Title for restore course posts confirmation dialog',
  },
  restorePostsDescription: {
    id: 'discussions.learner.restorePosts.description',
    defaultMessage: `{bulkType, select,
    course {You are about to restore {count, plural, one {# discussion contribution} other {# discussion contributions}} by this user in this course. This includes all deleted discussion threads, responses, and comments authored by them.}
    org {You are about to restore {count, plural, one {# discussion contribution} other {# discussion contributions}} by this user across the organization. This includes all deleted discussion threads, responses, and comments authored by them.}
    other {You are about to restore {count, plural, one {# discussion contribution} other {# discussion contributions}} by this user. This includes all deleted discussion threads, responses, and comments authored by them.}
  }`,
    description: 'Description for restore posts confirmation dialog',
  },
  restorePostsConfirm: {
    id: 'discussions.learner.restorePosts.confirm',
    defaultMessage: 'Restore',
    description: 'Confirm button text for restore posts',
  },
  restorePostConfirmPending: {
    id: 'discussions.learner.restorePosts.confirm.pending',
    defaultMessage: 'Restoring',
    description: 'Pending state of confirm button text for restore posts',
  },
  allOtherLearners: {
    id: 'discussions.learner.allOtherLearners',
    defaultMessage: 'All other learners',
    description: 'Heading text for the list of all other learners',
  },
  banUser: {
    id: 'discussions.learner.actions.ban',
    defaultMessage: 'Ban',
    description: 'Action to ban a user',
  },
  unbanUser: {
    id: 'discussions.learner.actions.unban',
    defaultMessage: 'Unban',
    description: 'Action to unban a user',
  },
  banUserSimple: {
    id: 'discussions.learner.actions.banSimple',
    defaultMessage: 'Ban',
    description: 'Simple ban action for moderators (course-wide only)',
  },
  unbanUserSimple: {
    id: 'discussions.learner.actions.unbanSimple',
    defaultMessage: 'Unban',
    description: 'Simple unban action for moderators (course-wide only)',
  },
  undeleteActivity: {
    id: 'discussions.learner.actions.undeleteActivity',
    defaultMessage: 'Undelete activity',
    description: 'Action to undelete user activity',
  },
  banUserCourse: {
    id: 'discussions.learner.actions.banCourse',
    defaultMessage: 'Ban user from discussions in this course',
    description: 'Action to ban user from course discussions',
  },
  banUserOrg: {
    id: 'discussions.learner.actions.banOrg',
    defaultMessage: 'Ban user from discussions in this organization',
    description: 'Action to ban user from organization discussions',
  },
  unbanUserCourse: {
    id: 'discussions.learner.actions.unbanCourse',
    defaultMessage: 'Unban user from discussions in this course',
    description: 'Action to unban user from course discussions',
  },
  unbanUserOrg: {
    id: 'discussions.learner.actions.unbanOrg',
    defaultMessage: 'Unban user from discussions in this organization',
    description: 'Action to unban user from organization discussions',
  },
  deleteUserCourse: {
    id: 'discussions.learner.actions.deleteUserCourse',
    defaultMessage: 'Delete all user discussion activity in this course',
    description: 'Action to delete user activity in course',
  },
  deleteUserOrg: {
    id: 'discussions.learner.actions.deleteUserOrg',
    defaultMessage: 'Delete all user discussion activity in this organization',
    description: 'Action to delete user activity in organization',
  },
  undeleteUserCourse: {
    id: 'discussions.learner.actions.undeleteUserCourse',
    defaultMessage: 'Undelete all user discussion activity in this course',
    description: 'Action to undelete user activity in course',
  },
  undeleteUserOrg: {
    id: 'discussions.learner.actions.undeleteUserOrg',
    defaultMessage: 'Undelete all user discussion activity in this organization',
    description: 'Action to undelete user activity in organization',
  },
  deleteConfirmationDelete: {
    id: 'discussions.learner.delete.confirmation.button.delete',
    defaultMessage: 'Delete',
    description: 'Delete button shown on delete confirmation dialog',
  },
  auditTrailInfoTitle: {
    id: 'discussions.learner.auditTrail.title',
    defaultMessage: 'Audit trail info',
    description: 'Title for audit trail information section',
  },
  auditTrailBannedBy: {
    id: 'discussions.learner.auditTrail.bannedBy',
    defaultMessage: 'Banned by {moderator}',
    description: 'Shows who banned the user',
  },
  auditTrailBannedAt: {
    id: 'discussions.learner.auditTrail.bannedAt',
    defaultMessage: 'on {date} at {time}',
    description: 'Shows when the user was banned',
  },
  auditTrailBanScope: {
    id: 'discussions.learner.auditTrail.banScope',
    defaultMessage: '{scope, select, course {course-wide} organization {org-wide} other {}}',
    description: 'Shows the scope of the ban (course-wide or org-wide)',
  },
  learnerBanBannerBanned: {
    id: 'discussions.learner.banner.banned',
    defaultMessage: 'Banned',
    description: 'Label shown in learner ban status banner',
  },
  learnerBanBannerBy: {
    id: 'discussions.learner.banner.by',
    defaultMessage: 'by',
    description: 'Text before moderator username in learner ban status banner',
  },
  learnerBanBannerStaff: {
    id: 'discussions.learner.banner.staff',
    defaultMessage: 'Staff',
    description: 'Role label shown in learner ban status banner',
  },
  auditTrailStaffOnly: {
    id: 'discussions.learner.auditTrail.staffOnly',
    defaultMessage: 'Visible to staff only',
    description: 'Note that audit trail is only visible to staff',
  },
  mutedCourseWide: {
    id: 'discussions.learner.mutedCourseWide',
    defaultMessage: 'Muted course-wide',
    description: 'Heading text for the list of course-wide muted learners',
  },
  mutedForMe: {
    id: 'discussions.learner.mutedForMe',
    defaultMessage: 'Muted (for me)',
    description: 'Heading text for the list of personally muted learners',
  },
  muted: {
    id: 'discussions.learners.muted',
    defaultMessage: 'Muted',
    description: 'Text for muted section header for learners',
  },
});

export default messages;
