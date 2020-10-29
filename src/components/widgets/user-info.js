import React, {useState} from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';
import { Auth } from 'aws-amplify';
import JsonViewer from './json-viewer';
import Widget from './widget.js';

const UserInfo = view(() => {

  const [credentials, setCredentials] = useState();

  Auth.currentCredentials()
    .then(data => {
      setCredentials(data);
    });

  return (
    <Widget>
      <h2>Authentication Info</h2>
      <JsonViewer jsonObject={credentials} />
    </Widget>
  );
});

export default UserInfo; 