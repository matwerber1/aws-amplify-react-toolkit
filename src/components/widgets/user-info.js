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
  currentUserInfo: {}
});


const UserInfo = view(() => {

  useEffect(() => {
    Auth.currentCredentials({bypassCache: true})
    .then(data => {
      state.currentCredentials = data;
    });

    Auth.currentUserInfo({bypassCache: true})
    .then(data => {
      state.currentUserInfo = data;
    });

    Auth.currentSession({bypassCache: true})
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
      <h3>Amplify.currentUserInfo():</h3>
      <JsonViewer jsonObject={state.currentUserInfo} collapsed={15} />
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