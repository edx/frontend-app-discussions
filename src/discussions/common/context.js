import React from 'react';

const DiscussionContext = React.createContext({
  page: null,
  courseId: null,
  postId: null,
  topicId: null,
  enableInContextSidebar: false,
  category: null,
  learnerUsername: null,
  enableDiscussionBan: false,
});

export default DiscussionContext;
