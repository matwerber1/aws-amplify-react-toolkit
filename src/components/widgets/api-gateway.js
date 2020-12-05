import React from 'react';
import Widget from './widget.js';
import { API } from 'aws-amplify';
import {store, view} from '@risingstack/react-easy-state';
import JsonViewer from './json-viewer';

const state = store({
  apiResponse: {},
  statusMessage: '',
});

const ApiGateway = view(() => {


  return (
    <Widget>
      <h2>API Gateway</h2>

      <button onClick={getApiResponse}>Invoke API</button><br/>
      API Response:<br/>
      {state.statusMessage}<br/>
      <JsonViewer jsonObject={state.apiResponse} collapsed={10} />
      
    </Widget>
  );
  
});

function getApiResponse() {

  state.statusMessage = 'Invoking API...';

  const apiName = 'amplifytoolkit';
  const path = '/demo'; 
  const myInit = { // OPTIONAL
      //headers: {}, // OPTIONAL
      response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
      //queryStringParameters: {  // OPTIONAL
      //    name: 'param',
      //},
  };

  API
    .get(apiName, path, myInit)
    .then(response => {
      state.apiResponse = response;
      state.statusMessage = '';
    })
    .catch(error => {
      console.log(error.response);
  });
}

export default ApiGateway; 