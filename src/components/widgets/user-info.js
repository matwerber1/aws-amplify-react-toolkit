import React, { useEffect } from 'react';
import {store, view} from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';
import { Auth } from 'aws-amplify';
import JsonViewer from './json-viewer';
import Widget from './widget.js';

const state = store({
  currentCredentials: {},
  sessionToken: {},
  idToken: {},
  refreshToken: {},
  accessToken: {},
});


const UserInfo = view(() => {

  useEffect(() => {
    Auth.currentCredentials()
    .then(data => {
      state.currentCredentials = data;
    });

    Auth.currentSession()
    .then(data => {
      state.accessToken = data.getAccessToken();
      state.idToken = data.getIdToken();
      state.refreshToken = data.getRefreshToken();
    });
  },[]);

  return (
    <Widget>
      <h2>Authentication Info</h2>
      <br/>
      <h3>Amplify.currentCredentials():</h3>
      <JsonViewer jsonObject={state.currentCredentials} collapsed={15} />
      <br/>
      <h3>Amplify.currentSession().getAccessToken():</h3>
      <JsonViewer jsonObject={state.accessToken} collapsed={15} />
      <br/>
      <h3>Amplify.currentSession().getAccessToken().getIdToken():</h3>
      <JsonViewer jsonObject={state.idToken} collapsed={15} />
      <br/>
      <h3>Amplify.currentSession().getAccessToken().getRefreshToken():</h3>
      <JsonViewer jsonObject={state.refreshToken} collapsed={15} />
      <br/>
    </Widget>
  );
});

export default UserInfo; 