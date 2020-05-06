import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';

import Button from '@material-ui/core/Button';

import appStore from '../common/app-store.js';

const CustomSignOut = view(() => {
  
  const signOut = () => {
    try {
      appStore.Auth.signOut();
    } catch (error) {
      console.log('error signing out: ', error);
    }
  };
  
  return (
    <div>
      <Button variant="contained" color="primary" onClick={signOut}>
        Sign Out
      </Button>
    </div>
  );
});
  
export default CustomSignOut; 