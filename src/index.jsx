import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React, { StrictMode } from 'react';

// eslint-disable-next-line import/no-unresolved
import { createRoot } from 'react-dom/client';

import {
  APP_INIT_ERROR, APP_READY, initialize, mergeConfig,
  subscribe,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';

import Head from './components/Head/Head';
import { DiscussionsHome } from './discussions';
import messages from './i18n';
import store from './store';

import './index.scss';

let lastBlockedPopupTimestamp = 0;

const rootNode = createRoot(document.getElementById('root'));
subscribe(APP_READY, () => {
  const { getAuthenticatedHttpClient } = require('@edx/frontend-platform/auth'); // eslint-disable-line global-require
  getAuthenticatedHttpClient().interceptors.response.use(
    response => response,
    (error) => {
      const statusCode = error?.customAttributes?.httpErrorStatus ?? error?.response?.status;
      const now = Date.now();
      if (statusCode === 503 && now - lastBlockedPopupTimestamp > 1500) {
        lastBlockedPopupTimestamp = now;
        // eslint-disable-next-line no-alert
        window.alert('Discussions are temporarily in read-only mode while maintenance is in progress. You can continue viewing content, but posting and other modifications are temporarily unavailable.');
      }
      return Promise.reject(error);
    },
  );
  rootNode.render(
    <StrictMode>
      <AppProvider store={store}>
        <Head />
        <DiscussionsHome />
      </AppProvider>
    </StrictMode>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  rootNode.render(<ErrorPage message={error.message} />);
});

initialize({
  requireAuthenticatedUser: true,
  messages,
  handlers: {
    config: () => {
      mergeConfig({
        LEARNING_BASE_URL: process.env.LEARNING_BASE_URL,
        LEARNER_FEEDBACK_URL: process.env.LEARNER_FEEDBACK_URL,
        STAFF_FEEDBACK_URL: process.env.STAFF_FEEDBACK_URL,
        ENABLE_PROFILE_IMAGE: process.env.ENABLE_PROFILE_IMAGE,
      }, 'DiscussionsConfig');
    },
  },
});
