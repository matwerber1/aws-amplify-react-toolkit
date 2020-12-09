import React, {useEffect} from 'react';
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
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
//import useStyles from '../common/material-ui-styles';

// An arbitrary value to uniquely identify any values for this widget stored in local storage:
const LOCAL_STORAGE_KEY = 'api-gateway-widget';

const API_METHOD = {
  get: 'GET',
  put: 'PUT',
  post: 'POST',
  delete: 'DELETE'
};

const state = store({
  apiName: 'amplifytoolkit',
  apiPath: '/echo',
  apiMethod: API_METHOD.get,
  apiHeaders: [],
  apiResponse: {},
  apiResponseReceived: false,
  apiErrorMessage: '',
  statusMessage: "Click 'Invoke API' to see results...",
});

const ApiGateway = view(() => {

  useEffect(() => {
    updateFormValuesFromLocalStorage();
  }, []);

  return (
    <Widget>
      <Typography  variant="h4" id="tableTitle" component="div">
          API Gateway
      </Typography>
      <ConfigurationForm/>
      <br/>
      <ApiResponse/>
    </Widget>
  );
  
});


//------------------------------------------------------------------------------
// When function first loads, read last-used form values (if any) from local storage:
function updateFormValuesFromLocalStorage() {
  
  for (const [key] of Object.entries(state)) {
    var localStorageValue = localStorage.getItem(`${LOCAL_STORAGE_KEY}-${key}`);
    
    if (localStorageValue) {
      
      if (localStorageValue.slice(0,12) === "JSON_OBJECT:") {
        localStorageValue = localStorageValue.slice(12);
        localStorageValue = JSON.parse(localStorageValue);
      }

      // Convert true or false strings to boolean (needed for checkboxes):
      if (["true", "false"].includes(localStorageValue)) {
        localStorageValue = localStorageValue === "true";
      }
      //console.log(`Setting ${key} = `, localStorageValue);
      state[key] = localStorageValue;
    }
  }
}


//------------------------------------------------------------------------------
const ConfigurationForm = view(() => {

  return (
    <Widget>
      <Typography  variant="h6" id="configurationTitle" component="div">
          Configuration
      </Typography>
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
      <br/><br/>
      <HeadersForm/>
      <br/><br/>
      <Button id="stopPlayer" variant="contained" color="primary" onClick={getApiResponse}>
          Invoke API
      </Button>
    </Widget>
  )
});

const HeadersForm = view(() => {

  //const classes = useStyles();

  return (
    <React.Fragment>
      <Typography  variant="h6" id="tableTitle" component="div">
          Headers
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell/>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.apiHeaders.map((header, index) => {
              var {key, value} = header;
              return <HeaderRow key={index} index={index} header={key} value={value}/>;
            })}
          <AddHeaderButton/>
          </TableBody>
        </Table>
      </TableContainer>
      <br/>
      
    </React.Fragment>
  );
});

const AddHeaderButton = view(() => {

  function addEmptyHeader() {
    var emptyHeader = {
      key: "",
      value: ""
    };
    state.apiHeaders.push(emptyHeader);
  }

  return (
    <TableRow>
      <TableCell align="left">
        <Button id="addHeader" variant="contained" color="primary" onClick={addEmptyHeader}>
          Add Header
        </Button>
      </TableCell>
      <TableCell/>
      <TableCell/>
    </TableRow>
  );

});

const HeaderRow = view(({header, value, index}) => {

  function handleHeaderChange(newHeader) {
    var newItem = {
      key: newHeader, 
      value: value
    };
    var newApiHeaders = state.apiHeaders;
    newApiHeaders[index] = newItem;
    updateState('apiHeaders', newApiHeaders);
  }

  function handleValueChange(newValue) {
    var newItem = {
      key: header, 
      value: newValue
    };
    var newApiHeaders = state.apiHeaders;
    newApiHeaders[index] = newItem;
    updateState('apiHeaders', newApiHeaders);
  }

  function handleDeleteClick() {
    delete state.apiHeaders[index];
  }

  return (
    <React.Fragment>
      <TableRow key={index}>
        <TableCell component="th" scope="row">
          <TextField
              onChange={(e) => (handleHeaderChange(e.target.value))}
              fullWidth={true}
              value={header} 
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            onChange={(e) => (handleValueChange(e.target.value))}
            fullWidth={true}
            value={value} 
          />
        </TableCell>
        <TableCell align="right">
        <Button id="deleteHeader" variant="contained" color="primary" onClick={handleDeleteClick}>
          Delete
        </Button>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
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

function getObjectFromHeadersArray() {
  
  var headerObj = {};
  state.apiHeaders.forEach(header => {
    if (header.key !== "" && header.value !== "") {
      headerObj[header.key] = header.value;
    }
  });
  return headerObj;

}

//------------------------------------------------------------------------------
async function getApiResponse() {

  state.statusMessage = 'Invoking API...';
  state.apiResponseReceived = false;

  const apiName = state.apiName;
  const path = state.apiPath; 
  const myInit = {
      response: true,
      headers: getObjectFromHeadersArray()
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

  console.log('Invoking API...');
  apiPromise
    .then(response => {
      console.log('API results received.');
      state.apiResponse = response;
      state.statusMessage = '';
      state.apiResponseReceived = true;
    })
    .catch(error => {
      console.log(JSON.stringify(error, null, 2))
      var message = `API error: ${error.response}`;
      state.statusMessage = message;
  });
}

//------------------------------------------------------------------------------
// Update local state as well as save value to localStorage:
function updateState(key, value) {
  
  var localKey = `${LOCAL_STORAGE_KEY}-${key}`;
  state[key] = value;

  if (typeof value === 'object') {
    console.log('stringifying...')
    value = `JSON_OBJECT:${JSON.stringify(value)}`;
  }  
  localStorage.setItem(localKey, value);
}

export default ApiGateway; 