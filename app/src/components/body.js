import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import { view } from '@risingstack/react-easy-state';
import CustomAuthenticator from './custom-authenticator';
import UserInfo from './user-info';
import Ec2DescribeInstances from './ec2-describe-instances';
import appStore from './app-store';

const Body = view(() => {

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm" component="main">
        
        {appStore.cognito.configErrorMessage}

        {appStore.cognito.configIsComplete
          ? <CustomAuthenticator displayType='login' />
          : <p>Please configure your Cognito settings before proceeding...</p>
        }
        
        {appStore.cognito.authState === 'signedIn'
          ? <ShowWidgetsAfterSignIn /> : null
        }
      </Container>
    </React.Fragment>
  );
});

const ShowWidgetsAfterSignIn = view(() => {
  return (
    <React.Fragment>
      <UserInfo />
      <Ec2DescribeInstances />
    </React.Fragment>
  )
});

export default Body; 