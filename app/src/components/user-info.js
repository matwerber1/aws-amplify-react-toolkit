import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';
import { Auth } from 'aws-amplify';
import appStore from './app-store';
import JsonViewer from './json-viewer';

const UserInfo = view(() => {

  Auth.currentCredentials()
    .then(credentials => {
      appStore.cognito.currentCredentials = credentials;
    });

  return (
    <React.Fragment>
      <h2>Authentication Info:</h2>
      <JsonViewer jsonObject={appStore.cognito.currentCredentials} />
    </React.Fragment>
  );
});

export default UserInfo; 