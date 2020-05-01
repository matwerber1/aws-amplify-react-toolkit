import React from 'react';
import {
  Authenticator,
  Greetings,
  SignOut,
} from 'aws-amplify-react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';

const CustomAuthenticator = view(({ updateAuthState }) => {

  return (
    <Authenticator
      hide={[
        SignOut,
        Greetings
      ]}
      onStateChange={(authState) => {
        updateAuthState(authState);
      }} 
    />   
  );
});
  
export default CustomAuthenticator; 