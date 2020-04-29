import React, { useState, useEffect } from 'react';
import { view } from '@risingstack/react-easy-state';
//import EC2 from 'aws-sdk/clients/ec2';
import Lambda from 'aws-sdk/clients/lambda';
import appStore from './app-store';
//import JsonViewer from './json-viewer';
//import RegionSelector from './region-selector';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
const AwsCliProxy = view(() => {

  const [isLoading, setIsLoading] = useState(true);
  //const [isError, setIsError] = useState(false);
  //const [errorMessage, setErrorMessage] = useState();
  //const [results, setResults] = useState({ Reservations: [] });
  const [region, setRegion] = useState('us-west-2');
  const [cliCommand, setCliCommand] = useState('aws s3 list-buckets');
  const [cliResponse, setCliResponse] = useState('');
  
  async function invokeAwsCliProxy() {
    var credentials = await appStore.Auth.currentCredentials();
    const lambda = new Lambda({
      region: region,
      credentials: appStore.Auth.essentialCredentials(credentials)
    });
    var reservations = [];

    var payload = {
      commandToRun: cliCommand
    };

    var params = {
      FunctionName: 'aws-cli-lambda-proxy-AwsCliProxyFunction-12BRX5NGRPX65',
      Payload: JSON.stringify(payload)
    };
    
    console.log('Invoking CLI Lambda with params:', params);
    
    lambda.invoke(params, (err, data) => {
      if (err) {
        console.log('Failed to invoke AWS CLI proxy Lambda: ', err.name)
      }
      else {
        var response = JSON.parse(data.Payload);
        console.log(`AWS CLI Proxy Lambda response:`, response);
        setCliResponse(response.commandResult);
      }
      setIsLoading(false);
    });
    
  }

   // Define commands here
   const commands = {
    whoami: "jackharper",
    cd: (directory) => `changed path to ${directory}`
  };

  return (
    <React.Fragment>
      <h2>AWS CLI Proxy:</h2>
      <TextField id="standard-basic" label="AWS CLI Command" value={cliCommand} onChange={e => setCliCommand(e.target.value)}/>
      <br/>
      <Button variant="contained" onClick={invokeAwsCliProxy}>Default</Button>
      <br/>
      Response:
      <br/>
      <TextField
        id="awsCliResponseTextField"
        label="CLI response"
        multiline
        fullWidth
        rowsMax={30}
        style={{whiteSpace: 'pre-line'}}
        value={cliResponse}
      />

 
    </React.Fragment>
  );
  
});

export default AwsCliProxy; 