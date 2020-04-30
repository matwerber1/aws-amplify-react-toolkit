import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { view } from '@risingstack/react-easy-state';
import CognitoConfigController from './cognito-config-controller';
import 'cross-fetch/polyfill';
import useStyles from './material-ui-styles.js';

const Header = view(() => {
  
  const classes = useStyles();

  return (
    <AppBar position="fixed" className={classes.appBarHeader}>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Amazon Cognito UI Tool
        </Typography>
       <CognitoConfigController />
      </Toolbar>
    </AppBar>
  );

});

export default Header; 