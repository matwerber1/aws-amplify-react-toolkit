import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { view } from '@risingstack/react-easy-state';
import CognitoConfigController from './cognito-config-controller';
import CustomSignOut from './custom-sign-out';
import 'cross-fetch/polyfill';
import useStyles from './material-ui-styles.js';
import appStore from './app-store.js';

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