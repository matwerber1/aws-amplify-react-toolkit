import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';

import {
  Authenticator,
  Greetings,
  SignOut,
} from 'aws-amplify-react';


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