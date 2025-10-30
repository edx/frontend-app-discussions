import { useMemo } from 'react';

/**
 * Custom hook to determine learner status (new learner, regular learner, or neither).
 *
 * This hook consumes both is_new_learner and is_regular_learner fields from the backend API.
 * The backend determines learner status based on actual engagement metrics and enrollment data.
 *
 * @param {Object} postData - The thread or comment data from the API that includes learner fields
 * @param {string} author - The username of the author; used to check for anonymous and retired users
 * to suppress learner messages
 * @param {string} authorLabel - The author's role label (Staff, Moderator, etc.)
 * @returns {Object} - { isNewLearner: boolean, isRegularLearner: boolean }
 */
export const useLearnerStatus = (postData, author, authorLabel) => useMemo(() => {
  // Users with special roles (Staff, Moderator, Community TA) should not display learner messages
  // Anonymous and retired users should also not display learner messages
  if (
    authorLabel
    || author === 'anonymous'
    || (author && author.startsWith('retired__user'))
  ) {
    return {
      isNewLearner: false,
      isRegularLearner: false,
    };
  }

  // Always rely on backend-provided fields
  // Note: Backend sends 'is_new_learner'/'is_regular_learner' but frontend may transform to camelCase
  if (postData && typeof postData === 'object') {
    const isNewLearner = postData.isNewLearner
      || postData.is_new_learner
      || false;
    const isRegularLearner = postData.isRegularLearner
      || postData.is_regular_learner
      || false;

    return {
      isNewLearner,
      isRegularLearner,
    };
  }

  // If postData is not available, return false for both
  // Do not attempt client-side detection as it would produce false positives
  return {
    isNewLearner: false,
    isRegularLearner: false,
  };
}, [postData, author, authorLabel]);

export default useLearnerStatus;
