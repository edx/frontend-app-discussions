import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  actionsAlt: {
    id: 'discussions.actions.button.alt',
    defaultMessage: 'Actions menu',
    description: 'Alt-text for dropdown button for actions related to a post or comment',
  },
  copyLink: {
    id: 'discussions.actions.copylink',
    defaultMessage: 'Copy link',
    description: 'Action to copy post link',
  },
  editAction: {
    id: 'discussions.actions.edit',
    defaultMessage: 'Edit',
    description: 'Action to edit a comment or post',
  },
  pinAction: {
    id: 'discussions.actions.pin',
    defaultMessage: 'Pin',
    description: 'Action to pin a post',
  },
  unpinAction: {
    id: 'discussions.actions.unpin',
    defaultMessage: 'Unpin',
    description: 'Action to unpin a post',
  },
  deleteAction: {
    id: 'discussions.actions.delete',
    defaultMessage: 'Delete',
    description: 'Action to delete a post or comment',
  },
  restoreAction: {
    id: 'discussions.actions.restore',
    defaultMessage: 'Restore',
    description: 'Action to restore a deleted post or comment',
  },
  // Ban submenu items
  banAction: {
    id: 'discussions.actions.ban',
    defaultMessage: 'Ban',
    description: 'Main ban menu item',
  },
  banUserCourse: {
    id: 'discussions.actions.ban.course',
    defaultMessage: 'Ban user in this course',
    description: 'Ban user from course',
  },
  banUserOrg: {
    id: 'discussions.actions.ban.org',
    defaultMessage: 'Ban user in this organization',
    description: 'Ban user from organization',
  },
  unbanUserCourse: {
    id: 'discussions.actions.unban.course',
    defaultMessage: 'Unban user from discussions in this course',
    description: 'Unban user from course',
  },
  unbanUserOrg: {
    id: 'discussions.actions.unban.org',
    defaultMessage: 'Unban user from discussions in this organization',
    description: 'Unban user from organization',
  },
  // Delete submenu items
  deletePost: {
    id: 'discussions.actions.delete.post',
    defaultMessage: 'Delete',
    description: 'Delete single post',
  },
  deleteUserCourse: {
    id: 'discussions.actions.delete.userCourse',
    defaultMessage: "Delete all user's discussion activity in this course",
    description: 'Delete all posts by user in course',
  },
  deleteUserOrg: {
    id: 'discussions.actions.delete.userOrg',
    defaultMessage: "Delete all user's discussion activity in this organization",
    description: 'Delete all posts by user in organization',
  },
  undeleteUserCourse: {
    id: 'discussions.actions.undelete.userCourse',
    defaultMessage: "Undelete all user's discussion activity in this course",
    description: 'Restore all posts by user in course',
  },
  undeleteUserOrg: {
    id: 'discussions.actions.undelete.userOrg',
    defaultMessage: "Undelete all user's discussion activity in this organization",
    description: 'Restore all posts by user in organization',
  },
  backToMenu: {
    id: 'discussions.actions.submenu.back',
    defaultMessage: 'Back',
    description: 'Back button in submenu',
  },
  confirmationConfirm: {
    id: 'discussions.confirmation.button.confirm',
    defaultMessage: 'Confirm',
    description: 'Confirm button shown on confirmation dialog',
  },
  banUserCheckbox: {
    id: 'discussions.actions.delete.banUserCheckbox',
    defaultMessage: 'Ban user from discussions in this course',
    description: 'Checkbox label for banning user when deleting',
  },
  deleteUserCourseTitle: {
    id: 'discussions.actions.delete.userCourse.title',
    defaultMessage: "Delete this user's discussion activity?",
    description: 'Title for delete user course confirmation',
  },
  deleteUserCourseDescription: {
    id: 'discussions.actions.delete.userCourse.description',
    defaultMessage: 'Are you sure you want to delete (count) posts, responses, or comments by {username} in this course?',
    description: 'Description for delete user course confirmation',
  },
  deleteUserOrgTitle: {
    id: 'discussions.actions.delete.userOrg.title',
    defaultMessage: "Delete this user's discussion activity?",
    description: 'Title for delete user org confirmation',
  },
  deleteUserOrgDescription: {
    id: 'discussions.actions.delete.userOrg.description',
    defaultMessage: 'Are you sure you want to delete (count) posts, responses, or comments by {username} across this organization?',
    description: 'Description for delete user org confirmation',
  },
  undeleteUserCourseTitle: {
    id: 'discussions.actions.undelete.userCourse.title',
    defaultMessage: "Undelete this user's discussion activity?",
    description: 'Title for undelete user course confirmation',
  },
  undeleteUserCourseDescription: {
    id: 'discussions.actions.undelete.userCourse.description',
    defaultMessage: 'Are you sure you want to undelete (count) responses, or comments by {username} in this course?',
    description: 'Description for undelete user course confirmation',
  },
  undeleteUserOrgTitle: {
    id: 'discussions.actions.undelete.userOrg.title',
    defaultMessage: "Undelete this user's discussion activity?",
    description: 'Title for undelete user org confirmation',
  },
  undeleteUserOrgDescription: {
    id: 'discussions.actions.undelete.userOrg.description',
    defaultMessage: 'Are you sure you want to undelete (count) responses, or comments by {username} across this organization?',
    description: 'Description for undelete user org confirmation',
  },
  banUserCourseTitle: {
    id: 'discussions.actions.ban.course.title',
    defaultMessage: 'Ban user in this course',
    description: 'Title for ban user course confirmation',
  },
  banUserCourseDescription: {
    id: 'discussions.actions.ban.course.description',
    defaultMessage: 'Are you sure you want to ban {username} from discussions in this course?',
    description: 'Description for ban user course confirmation',
  },
  banUserOrgTitle: {
    id: 'discussions.actions.ban.org.title',
    defaultMessage: 'Ban user in this organization',
    description: 'Title for ban user org confirmation',
  },
  banUserOrgDescription: {
    id: 'discussions.actions.ban.org.description',
    defaultMessage: 'Are you sure you want to ban {username} from discussions across this organization?',
    description: 'Description for ban user org confirmation',
  },
  banUserOrgCheckbox: {
    id: 'discussions.actions.ban.org.checkbox',
    defaultMessage: 'Ban user from discussions across this organization',
    description: 'Checkbox label for org-level ban',
  },
  unbanUserCourseTitle: {
    id: 'discussions.actions.unban.course.title',
    defaultMessage: 'Unban user in this course',
    description: 'Title for unban user course confirmation',
  },
  unbanUserCourseDescription: {
    id: 'discussions.actions.unban.course.description',
    defaultMessage: 'Are you sure you want to unban {username} from discussions in this course?',
    description: 'Description for unban user course confirmation',
  },
  unbanUserOrgTitle: {
    id: 'discussions.actions.unban.org.title',
    defaultMessage: 'Unban user in this organization',
    description: 'Title for unban user org confirmation',
  },
  unbanUserOrgDescription: {
    id: 'discussions.actions.unban.org.description',
    defaultMessage: 'Are you sure you want to unban {username} from discussions across this organization?',
    description: 'Description for unban user org confirmation',
  },
  // Button text for confirmation dialogs
  banButtonText: {
    id: 'discussions.button.ban',
    defaultMessage: 'Ban',
    description: 'Ban button text for confirmation dialogs',
  },
  unbanButtonText: {
    id: 'discussions.button.unban',
    defaultMessage: 'Unban',
    description: 'Unban button text for confirmation dialogs',
  },
  undeleteButtonText: {
    id: 'discussions.button.undelete',
    defaultMessage: 'Undelete',
    description: 'Undelete button text for confirmation dialogs',
  },
  closeAction: {
    id: 'discussions.actions.close',
    defaultMessage: 'Close',
    description: 'Action to close a post',
  },
  reopenAction: {
    id: 'discussions.actions.reopen',
    defaultMessage: 'Reopen',
    description: 'Action to reopen a post',
  },
  reportAction: {
    id: 'discussions.actions.report',
    defaultMessage: 'Report',
    description: 'Action to report a post or comment',
  },
  unreportAction: {
    id: 'discussions.actions.unreport',
    defaultMessage: 'Unreport',
    description: 'Action to unreport a post or comment',
  },
  endorseAction: {
    id: 'discussions.actions.endorse',
    defaultMessage: 'Endorse',
    description: 'Action to endorse a comment',
  },
  unendorseAction: {
    id: 'discussions.actions.unendorse',
    defaultMessage: 'Unendorse',
    description: 'Action to unendorse a post or comment',
  },
  markAnsweredAction: {
    id: 'discussions.actions.markAnswered',
    defaultMessage: 'Mark as answered',
    description: 'Action to mark a comment as answering a post',
  },
  unmarkAnsweredAction: {
    id: 'discussions.actions.unMarkAnswered',
    defaultMessage: 'Unmark as answered',
    description: 'Action to unmark a comment as answering a post',
  },
  confirmationCancel: {
    id: 'discussions.modal.confirmation.button.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button shown on delete confirmation dialog',
  },
  emptyAllTopics: {
    id: 'discussions.empty.allTopics',
    defaultMessage:
      'All discussion activity for these topics will show up here.',
    description: 'Message shown on page when no posts found related to topic.',
  },
  emptyAllPosts: {
    id: 'discussions.empty.allPosts',
    defaultMessage:
      'All discussion activity for your course will show up here.',
    description: 'Message shown on page when no posts found for the course.',
  },
  emptyMyPosts: {
    id: 'discussions.empty.myPosts',
    defaultMessage: "Posts you've interacted with will show up here.",
    description: 'Message shown on page when no messages found for the user.',
  },
  emptyTopic: {
    id: 'discussions.empty.topic',
    defaultMessage: 'All discussion activity for this topic will show up here.',
    description: 'Message shown when visiting a topic with no comments.',
  },
  emptyTitle: {
    id: 'discussions.empty.title',
    defaultMessage: 'Nothing here yet',
    description: 'Title shown on empty pages below image.',
  },
  noPostSelected: {
    id: 'discussions.empty.noPostSelected',
    defaultMessage: 'No post selected',
    description: 'Title on posts pages when user has yet to select a post to display.',
  },
  noTopicSelected: {
    id: 'discussions.empty.noTopicSelected',
    defaultMessage: 'No topic selected',
    description: 'Title on topic pages when user has yet to select a topic.',
  },
  noResultsFound: {
    id: 'discussions.sidebar.noResultsFound',
    defaultMessage: 'No results found',
    description: 'Title on the discussion sidebar when there are now results after filtering',
  },
  differentKeywords: {
    id: 'discussions.sidebar.differentKeywords',
    defaultMessage: 'Try searching different keywords',
    description: 'Message shown on discussion sidebar for topics and learners if user searched with keywords.',
  },
  removeKeywords: {
    id: 'discussions.sidebar.removeKeywords',
    defaultMessage: 'Try searching different keywords or removing some filters',
    description: 'Message shown on discussion sidebar if user searched with keywords.',
  },
  removeKeywordsOnly: {
    id: 'discussions.sidebar.removeKeywordsOnly',
    defaultMessage: 'Try searching different keywords',
    description: 'Message shown on discussion sidebar if user searched with keywords only.',
  },
  removeFilters: {
    id: 'discussions.sidebar.removeFilters',
    defaultMessage: 'Try removing some filters',
    description: 'Message shown on discussion sidebar if user filtered results.',
  },
  emptyIconAlt: {
    id: 'discussions.empty.iconAlt',
    defaultMessage: 'Empty',
    description: 'Alt-text for image showing empty state',
  },
  authorLabelStaff: {
    id: 'discussions.authors.label.staff',
    defaultMessage: 'Staff',
    description: 'A label for staff users displayed next to their username.',
  },
  authorLabelModerator: {
    id: 'discussions.authors.label.moderator',
    defaultMessage: 'TA',
    description: 'A label for moderators displayed next to their username.',
  },
  authorLabelTA: {
    id: 'discussions.authors.label.ta',
    defaultMessage: 'CTA',
    description: 'A label for community TAs displayed next to their username.',
  },
  authorLabelBanned: {
    id: 'discussions.authors.label.banned',
    defaultMessage: 'Banned',
    description: 'A label for banned users displayed next to their username.',
  },
  bannedUserBannerTitle: {
    id: 'discussions.bannedUser.banner.title',
    defaultMessage: "You've been banned from discussions in this course",
    description: 'Title for banned user banner',
  },
  bannedUserBannerMessage: {
    id: 'discussions.bannedUser.banner.message',
    defaultMessage: "You've been banned from discussions in this course",
    description: 'Message shown in banned user banner',
  },
  loadMorePosts: {
    id: 'discussions.learner.loadMostPosts',
    defaultMessage: 'Load more posts',
    description: 'Text on button for loading more posts by a user',
  },
  anonymous: {
    id: 'discussions.post.anonymous.author',
    defaultMessage: 'anonymous',
    description: 'Author name displayed when a post is anonymous',
  },
  blackoutDiscussionInformation: {
    id: 'discussion.blackoutBanner.information',
    defaultMessage: 'Posting in discussions is disabled by the course team',
    description: 'Informative text when discussion posting is disabled',
  },
  imageWarningMessage: {
    id: 'discussions.editor.image.warning.message',
    defaultMessage: 'Images having width or height greater than 999px will not be visible when the post, response or comment is viewed using in-line course discussions',
    description: 'Modal message to tell image dimensions compatibility issue with legacy',
  },
  imageWarningModalTitle: {
    id: 'discussions.editor.image.warning.title',
    defaultMessage: 'Warning!',
    description: 'Modal message title',
  },
  imageWarningDismissButton: {
    id: 'discussions.editor.image.warning.dismiss',
    defaultMessage: 'Ok',
    description: 'Modal dismiss button text',
  },
  contentUnavailableTitle: {
    id: 'discussions.content.unavailable.title',
    defaultMessage: 'Content unavailable',
    description: 'Title on content page when the user has not logged into the MFE or not enrolled in the course.',
  },
  contentUnavailableSubTitle: {
    id: 'discussions.content.unavailable.subTitle',
    defaultMessage: 'You may not be able to see this content because you\'re not logged in, you\'re not enrolled in the course, or your audit access has expired.',
    description: 'Sub title on content page when the user has not logged into the MFE or not enrolled in the course.',
  },
  contentUnavailableAction: {
    id: 'discussions.content.unavailable.action',
    defaultMessage: 'Enroll',
    description: 'Action button on content page when the user has not logged into the MFE or not enrolled in the course.',
  },
  authorAdminDescription: {
    id: 'discussions.author.admin.description',
    defaultMessage: 'Part of the team that runs this course',
    description: 'tooltip for course admins',
  },
  authorLearnerTitle: {
    id: 'discussions.author.learner.title',
    defaultMessage: 'Learner',
    description: 'tooltip for course learners title',
  },
  authorLearnerDescription: {
    id: 'discussions.author.learner.description',
    defaultMessage: 'Taking the course just like you',
    description: 'tooltip for course learners',
  },
  newLearnerMessage: {
    id: 'discussions.author.newLearner.message',
    defaultMessage: '👋 Hi, I am a new learner',
    description: 'Message displayed below username for new learners who have only viewed the course outline',
  },
  learnerMessage: {
    id: 'discussions.author.learner.message',
    defaultMessage: 'Learner',
    description: 'Message displayed below username for regular learners',
  },
  spamWarningHeading: {
    id: 'discussions.spamWarning.heading',
    defaultMessage: 'Reminder',
    description: 'Heading for the spam warning banner',
  },
  spamWarningMessage: {
    id: 'discussions.spamWarning.message',
    defaultMessage: 'Faculty and staff will never invite you to join external groups or ask for personal or financial information in the discussions. Stay safe, and if you see suspicious activity, please report it.',
    description: 'Warning message about spam and impersonation in discussion forums',
  },
  activeThreads: {
    id: 'discussions.filter.activeThreads',
    defaultMessage: 'Active Threads',
    description: 'Label for active threads filter button',
  },
  deletedThreads: {
    id: 'discussions.filter.deletedThreads',
    defaultMessage: 'Deleted Threads',
    description: 'Label for deleted threads filter button',
  },
  deletedBadge: {
    id: 'discussions.thread.deletedBadge',
    defaultMessage: 'Deleted',
    description: 'Badge shown on deleted threads',
  },
  selectedCount: {
    id: 'discussions.bulk.selectedCount',
    defaultMessage: '{count} selected',
    description: 'Count of selected threads for bulk actions',
  },
  deleteSelected: {
    id: 'discussions.bulk.deleteSelected',
    defaultMessage: 'Delete Selected',
    description: 'Button text for bulk delete action',
  },
  restoreSelected: {
    id: 'discussions.bulk.restoreSelected',
    defaultMessage: 'Restore Selected',
    description: 'Button text for bulk restore action',
  },
  deleting: {
    id: 'discussions.bulk.deleting',
    defaultMessage: 'Deleting...',
    description: 'Loading text when bulk deleting threads',
  },
  restoring: {
    id: 'discussions.bulk.restoring',
    defaultMessage: 'Restoring...',
    description: 'Loading text when bulk restoring threads',
  },
  loadingThreads: {
    id: 'discussions.threads.loading',
    defaultMessage: 'Loading threads...',
    description: 'Loading text when fetching threads',
  },
  autoSpamFlaggedMessage: {
    id: 'discussions.autoSpamFlaggedMessage',
    defaultMessage: 'Content automatically reported as possible spam pending staff review.',
    description: 'Message shown when a post is automatically flagged as potential spam',
  },
  autoSpamModalTitle: {
    id: 'discussions.autoSpamModalTitle',
    defaultMessage: 'What does "automatically reported" mean?',
    description: 'Title for the modal that explains automatic spam flagging',
  },
  autoSpamModalBodyParagraph1: {
    id: 'discussions.autoSpamModalBodyParagraph1',
    defaultMessage: 'Some content is flagged by an automated system when it matches patterns commonly associated with spam. This helps reduce harmful or misleading posts in discussions.',
    description: 'First paragraph of explanation about automatic spam flagging process shown in modal',
  },
  autoSpamModalBodyParagraph2: {
    id: 'discussions.autoSpamModalBodyParagraph2',
    defaultMessage: 'Automatically reported content is only visible to course staff and remains hidden from learners until action is taken.',
    description: 'Second paragraph of explanation about automatic spam flagging process shown in modal',
  },
  autoSpamModalClose: {
    id: 'discussions.autoSpamModalClose',
    defaultMessage: 'Understand',
    description: 'Button text to close the automatic spam explanation modal',
  },
  autoSpamModalIconAlt: {
    id: 'discussions.autoSpamModalIconAlt',
    defaultMessage: 'Show more information about automatic flagging',
    description: 'Alt text for the icon that opens the automatic spam explanation modal',
  },
});

export default messages;
