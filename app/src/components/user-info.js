import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';
import { Auth } from 'aws-amplify';
import appStore from './app-store';
import JsonViewer from './json-viewer';
import Widget from './widget.js';

const UserInfo = view(() => {

  Auth.currentCredentials()
    .then(credentials => {
      appStore.cognito.currentCredentials = credentials;
    });

  return (
    <Widget>
      <h2>Authentication Info</h2>
      <JsonViewer jsonObject={appStore.cognito.currentCredentials} />
    </Widget>
  );
});

export default UserInfo; 