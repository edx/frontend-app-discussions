import { selectCommentOrResponseById } from '../post-comments/data/selectors';
import { selectThread } from '../posts/data/selectors';

export const ContentSelectors = {
  POST: selectThread,
  COMMENT: selectCommentOrResponseById,
};

export const ContentTypes = {
  POST: 'POST',
  COMMENT: 'COMMENT',
};

export const THREAD_FILTER_TYPES = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};
