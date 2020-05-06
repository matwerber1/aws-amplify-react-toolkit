import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import appStore from './common/app-store.js';
import useStyles from './common/material-ui-styles.js';
import CognitoConfigController from './auth/cognito-config-controller';
import CustomSignOut from './auth/custom-sign-out';


const Header = view(() => {
  
  const loggedIn = (appStore.cognito.loggedIn);

  const classes = useStyles();

  return (

    <AppBar position="fixed" className={classes.appBarHeader}>
      <Toolbar>

        <Typography variant="h6" className={classes.title}>
          Amazon Cognito UI Tool
        </Typography>

        {!loggedIn ?
            <CognitoConfigController />
          :
            <CustomSignOut/>
        }

      </Toolbar>
    </AppBar>
  );

});

export default Header; 