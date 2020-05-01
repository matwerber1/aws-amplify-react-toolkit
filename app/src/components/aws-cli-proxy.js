import React, { useState } from 'react';
import Lambda from 'aws-sdk/clients/lambda';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import appStore from './app-store.js';
import Widget from './widget.js';

const AwsCliProxy = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [region, ] = useState('us-west-2');
  const [cliCommand, setCliCommand] = useState('aws s3api list-buckets');
  const [results, setResults] = useState(undefined);
  const awsCliLambdaFunctionName = 'aws-cli-lambda-proxy-AwsCliProxyFunction-12BRX5NGRPX65';
  
  async function invokeAwsCliProxy() {

    var credentials = await appStore.Auth.currentCredentials();
    var essentialCredentials = appStore.essentialCredentials(credentials);
    const lambda = new Lambda({
      region: region,
      credentials: essentialCredentials
    });
    
    var payload = {
      commandToRun: cliCommand,
      credentials: essentialCredentials
    };

    var params = {
      FunctionName: awsCliLambdaFunctionName,
      Payload: JSON.stringify(payload)
    };
    
    console.log('Invoking CLI Lambda with params:', params);
    
    setIsLoading(true);
    setIsError(false);
    setIsLoaded(false);
    setResults(undefined);

    lambda.invoke(params, (err, data) => {
      if (err) {
        var errorMessage = `Failed to invoke AWS CLI proxy Lambda: ${err.name}`;
        console.log(errorMessage);
        setErrorMessage(errorMessage);
        setIsError(true);
        setResults(undefined);
        setIsLoading(false);
      }
      else {
        var response = JSON.parse(data.Payload);
        console.log(`AWS CLI Proxy Lambda response:`, response);
        setResults(response.commandResult);
        setIsError(false);
        setIsLoaded(true);
      
      }
      setIsLoading(false);
    });
    
  }

  return (
    <Widget>
      <h2>AWS CLI Proxy</h2>
      
      <TextField
        id="standard-basic"
        label="AWS CLI Command"
        value={cliCommand}
        onChange={e => setCliCommand(e.target.value)} 
        fullWidth
      />
      <br />
      <br/>
      <Button variant="contained" onClick={invokeAwsCliProxy}>Run command!</Button>
      <br/>
      <br/>
      {isLoaded ? 
        <TextField
        id="awsCliResponseTextField"
        label="CLI response"
        multiline
        fullWidth
        rowsMax={30}
        style={{whiteSpace: 'pre-line'}}
        value={results}
        />
        : null
      }
      {isLoading ? "Waiting for response from Lambda CLI proxy..." : null}
      {isError ? errorMessage : null}
    </Widget>
  );
};

export default AwsCliProxy; 