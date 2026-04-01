import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { selectThreadsByIds } from './selectors';

const usePostList = (ids, viewingUsername = null) => {
  const posts = useSelector(selectThreadsByIds(ids, viewingUsername));
  const pinnedPostsIds = [];
  const unpinnedPostsIds = [];

  const sortedIds = useMemo(() => {
    posts.forEach((post) => {
      if (post && post.pinned) {
        pinnedPostsIds.push(post.id);
      } else if (post) {
        unpinnedPostsIds.push(post.id);
      }
    });

    return [...pinnedPostsIds, ...unpinnedPostsIds];
  }, [posts]);

  return sortedIds;
};

export default usePostList;
