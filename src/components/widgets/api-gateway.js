import React from 'react';
import Widget from './widget.js';
import { API } from 'aws-amplify';
import {store, view} from '@risingstack/react-easy-state';
import JsonViewer from './json-viewer';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';

const API_METHOD = {
  get: 'GET',
  put: 'PUT',
  post: 'POST',
  delete: 'DELETE'
};

const state = store({
  apiName: 'amplifytoolkit',
  apiPath: '/attachIoTPolicyToFederatedUser',
  apiMethod: API_METHOD.get,
  apiResponse: {},
  apiResponseReceived: false,
  apiErrorMessage: '',
  statusMessage: "Click 'Invoke API' to see results...",
});

const ApiGateway = view(() => {


  return (
    <Widget>
      <h2>API Gateway</h2>
      <ConfigurationForm/>
      <br/>
      <ApiResponse/>
    </Widget>
  );
  
});


//------------------------------------------------------------------------------
const ConfigurationForm = view(() => {
  return (
    <Widget>
      <h3>Configuration</h3>
      <TextField
          id="apiName"
          label="API Name"
          onChange={(e) => updateState('apiName', e.target.value)}
          value={state.apiName} 
          fullWidth={true}
      />
      <br/>
       <TextField
          id="apiPath"
          label="API Path"
          onChange={(e) => updateState('apiPath', e.target.value)}
          fullWidth={true}
          value={state.apiPath} 
      />
      <br/>
      <FormControl fullWidth={true}>
        <InputLabel id="method-label">API Method</InputLabel>
        <Select
            labelId="apiMethod"
            id="apiMethod"
            value={state.apiMethod}
            onChange={(e) => updateState('apiMethod', e.target.value)}
            
        >
          {Object.values(API_METHOD).map((value) => {
              return <MenuItem key={value} value={value}>{value}</MenuItem>;
            })}
        </Select>
      </FormControl>
      <br/>
      <br/><br/>
      <Button id="stopPlayer" variant="contained" color="primary" onClick={getApiResponse}>
          Invoke API
      </Button>
    </Widget>
  )
});

const ApiResponse = view(() => {
  return (
    <Widget>
      <h3>API Response</h3>
      {state.statusMessage}<br/>
      {state.apiResponseReceived
        ? <JsonViewer jsonObject={state.apiResponse} collapsed={10} />
        : null
      }
    </Widget>
  )
});

//------------------------------------------------------------------------------
async function getApiResponse() {

  state.statusMessage = 'Invoking API...';
  state.apiResponseReceived = false;

  const apiName = state.apiName;
  const path = state.apiPath; 
  const myInit = {
      response: true,
  };

  var apiPromise = null;

  switch (state.apiMethod) {
    case API_METHOD.get:
      apiPromise = API.get(apiName, path, myInit);
      break;
    case API_METHOD.put:
      apiPromise = API.put(apiName, path, myInit);
      break;
    case API_METHOD.post:
      apiPromise = API.post(apiName, path, myInit);
      break;
    case API_METHOD.delete:
      apiPromise = API.del(apiName, path, myInit);
      break;
    default:
      throw new Error(`Unsupported API method "${state.apiMethod}"`);
  }

  apiPromise
    .then(response => {
      state.apiResponse = response;
      state.statusMessage = '';
      state.apiResponseReceived = true;
    })
    .catch(error => {
      var message = `API error: ${error}`;
      console.log(message);
      state.statusMessage = message;
  });
}

//------------------------------------------------------------------------------
// Update local state as well as save value to localStorage:
function updateState(key, value) {
  state[key] = value;
  var localKey = `api-widget-${key}`;
  localStorage.setItem(localKey, value);
  console.log(key, value)
}

export default ApiGateway; 