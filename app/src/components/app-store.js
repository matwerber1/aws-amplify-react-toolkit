import { store } from '@risingstack/react-easy-state';
import cookies from './cookies';
import Amplify, { Auth } from 'aws-amplify';

// Refer to:
// https://medium.com/dailyjs/design-patterns-with-react-easy-state-830b927acc7c
// https://github.com/RisingStack/react-easy-state

// This is our main state tracked across the app; react-easy-state is similar
// to redux in concept but much easier to use:
const appStore = store({
  Auth: Auth,
  cognito: {
    config: {
      userPoolId: '',
      clientId: '',
      identityPoolId: '',
      region: ''  
    },
    checkConfigIsComplete: () => {
      if (appStore.cognito.config.userPoolId !== ''
        && appStore.cognito.config.clientId !== ''
        && appStore.cognito.config.identityPoolId !== ''
        && appStore.cognito.config.region !== ''
      ) {
        appStore.cognito.configIsComplete = true;  
        appStore.configureAuth();
      }
      else {
        appStore.cognito.configIsComplete = false;
        appStore.cognito.configErrorMessage = 'Cognito configuration is incomplete.';
      }
    },
    configIsComplete: false,
    configErrorMessage: null,
    loggedIn: false,
    username: '',
    password: '',
    accessToken: {},
    loadedCookies: false
  },
  loadStateFromCookies: () => {
    if (!appStore.loadedCookies) {
      const cookieValues = cookies.getAll();
      appStore.cognito.username = cookieValues.username
      appStore.cognito.userPoolId = cookieValues.userPoolId;
      appStore.cognito.clientId = cookieValues.clientId;
      appStore.cognito.identityPoolId = cookieValues.identityPoolId;
      appStore.cognito.region = cookieValues.region; 
      appStore.loadedCookies = true;
      appStore.cognito.checkConfigIsComplete();
    }
  },
  saveStateToCookies: () => {
    cookies.set('username', appStore.cognito.username);
    cookies.set('userPoolId', appStore.cognito.userPoolId);
    cookies.set('clientId', appStore.cognito.clientId);
    cookies.set('identityPoolId', appStore.cognito.identityPoolId);
    cookies.set('region', appStore.cognito.region);
  },
  clearLoginSession: () => {
    appStore.loggedIn = false;
    appStore.accessToken = {};
  },
  configureAuth: () => {
    try {
      Amplify.configure({
        Auth: {
          identityPoolId: appStore.cognito.config.identityPoolId,
          region: appStore.cognito.config.region,
          userPoolId: appStore.cognito.config.userPoolId,
          userPoolWebClientId: appStore.cognito.config.clientId,
          mandatorySignIn: true,
          authenticationFlowType: 'USER_SRP_AUTH',
        }
      });
      appStore.cognito.configErrorMessage = null;
    }
    catch (err) {
      console.log(`Error configuring Amplify auth: ${err}`);
      appStore.cognito.configErrorMessage = err.message;
      appStore.cognito.configIsComplete = false;
    }
   
  }
});

// When first loaded, let's get initial values from cookies (if available)
appStore.loadStateFromCookies();

export default appStore;