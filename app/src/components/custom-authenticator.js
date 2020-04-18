import React from 'react';
import Amplify from 'aws-amplify';
import {
  Authenticator,
  Greetings,
  SignIn,
  ConfirmSignIn,
  RequireNewPassword,
  SignUp,
  SignOut,
  ConfirmSignUp,
  VerifyContact,
  ForgotPassword,
  TOTPSetup,
  Loading } from 'aws-amplify-react';
import { view } from '@risingstack/react-easy-state';
import appStore from './app-store';
import 'cross-fetch/polyfill';

// Here, the options param allows us to render two slightly different versions
// of the Amplify Authenticator component. We do this because we display different
// sections of the UI in different parts of our page. (i.e. everthing except
// signout is shown in the center of the page, and signout is shown in the header).
const CustomAuthenticator = view((options) => {

  const displayType = options.displayType || null;
  var hideParams = [];
  configureAmplifyAuth();

  if (options.displayType === 'login') {
    hideParams = [
      SignOut,
      Greetings
    ];
  }
  else if (options.displayType === 'logout') {
    hideParams = [
      SignIn,
      ConfirmSignIn,
      RequireNewPassword,
      SignUp,
      ConfirmSignUp,
      VerifyContact,
      ForgotPassword,
      TOTPSetup,
      Loading,
    ];
  }
  else {
    throw new Error(`Unsupported or missing authType ('${displayType}') for CustomAuthenticator component`);
  }

  return (
    <Authenticator 
      onStateChange={(authState) => {
        appStore.cognito.authState = authState;
      }} 
     hide={ hideParams }
    />
    
  );

});

const configureAmplifyAuth = () => {
  const authParams = {
    identityPoolId: appStore.cognito.identityPoolId,
    region: appStore.cognito.region,
    userPoolId: appStore.cognito.userPoolId,
    userPoolWebClientId: appStore.cognito.clientId,
    mandatorySignIn: true,
    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    //authenticationFlowType: 'USER_PASSWORD_AUTH',
    authenticationFlowType: 'USER_SRP_AUTH',
  };
  
  Amplify.configure({
    Auth: authParams
  });
}

export default CustomAuthenticator; 