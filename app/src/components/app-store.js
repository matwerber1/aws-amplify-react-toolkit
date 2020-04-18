import { store } from '@risingstack/react-easy-state';
import cookies from './cookies';
import { Auth } from 'aws-amplify';

// Refer to:
// https://medium.com/dailyjs/design-patterns-with-react-easy-state-830b927acc7c
// https://github.com/RisingStack/react-easy-state

// This is our main state tracked across the app; react-easy-state is similar
// to redux in concept but much easier to use:
const appStore = store({
  Auth: Auth,
  cognito: {
    loggedIn: false,
    username: '',
    password: '',
    userPoolId: '',
    clientId: '',
    identityPoolId: '',
    region: '',
    accessToken: {}
  },
  loadStateFromCookies: () => {
    const cookieValues = cookies.getAll();
    appStore.cognito.username = cookieValues.username
    appStore.cognito.userPoolId = cookieValues.userPoolId;
    appStore.cognito.clientId = cookieValues.clientId;
    appStore.cognito.identityPoolId = cookieValues.identityPoolId;
    appStore.cognito.region = cookieValues.region; 
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
  }
});

// When first loaded, let's get initial values from cookies (if available)
appStore.loadStateFromCookies();

export default appStore;