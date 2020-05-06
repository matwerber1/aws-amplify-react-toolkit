import React, { useState, useEffect } from 'react';
import EC2 from 'aws-sdk/clients/ec2';

import appStore from '../common/app-store.js';
import JsonViewer from './json-viewer';
import RegionSelector from './region-selector';
import Widget from './widget.js';

const Ec2DescribeInstances = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const [results, setResults] = useState({ Reservations: [] });
  const [region, setRegion] = useState('us-east-2');

  // When component loads, fetch data once:
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        var credentials = await appStore.Auth.currentCredentials();
        const ec2 = new EC2({
          region: region,
          credentials: appStore.Auth.essentialCredentials(credentials)
        });
        var reservations = [];
        var params = {};
        
        do {
          var response = await ec2.describeInstances(params).promise();
          reservations = reservations.concat(response.Reservations);
          params.NextToken = response.NextToken || null;
        } while (params.NextToken);
    
        setResults({ Reservations: reservations });
        setIsLoading(false);
      }
      catch (err) {
        console.log(err, err.stack);
        setErrorMessage(`${err}`);
        setIsError(true);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [region]);

  function renderResponse() {
    if (isError) {
      return errorMessage;
    }
    else if (isLoading) {
      return 'Loading EC2 instances...';
    }
    else {
      return (
        <JsonViewer
          jsonObject={results}
          collapseStringsAfterLength={50}
        />
      );
    }
  }

  return (
    <Widget>
      <h2>EC2 Instances:</h2>
      <RegionSelector value={region} setFunction={setRegion}/><br/>
      {renderResponse()}
    </Widget>
  );
  
};

export default Ec2DescribeInstances; 