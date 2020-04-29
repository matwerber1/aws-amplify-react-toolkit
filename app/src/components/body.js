import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { view } from '@risingstack/react-easy-state';
import CustomAuthenticator from './custom-authenticator';
import UserInfo from './user-info';
import Ec2DescribeInstances from './ec2-describe-instances';
import AwsCliProxy from './aws-cli-proxy';

import appStore from './app-store';

const Body = view(() => {

  function renderBody() {
    console.log(`appStore.cognito.authState = ${appStore.cognito.authState}`);
    if (!appStore.cognito.configIsComplete) {
      return (
        <p>Please configure your Cognito settings before proceeding...</p>
      );
    }
    else if (appStore.cognito.authState !== 'signedIn') {
      return (
        < CustomAuthenticator displayType='login' />
      );
    }
    else if (appStore.cognito.authState === 'signedIn') {
      return (
        <ShowWidgetsAfterSignIn />
      );
    }
    else {
      return (
        <p>Unhandled state :(</p>
      );
    }
  } 

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm" component="main">
        {renderBody()}
      </Container>
    </React.Fragment>
  );
});

const ShowWidgetsAfterSignIn = view(() => {
  return (
    <React.Fragment>
      <UserInfo />
      <Ec2DescribeInstances />
      <AwsCliProxy />
    </React.Fragment>
  )
});

export default Body; 