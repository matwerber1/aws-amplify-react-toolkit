import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { view } from '@risingstack/react-easy-state';
import CognitoConfigController from './cognito-config-controller';
import 'cross-fetch/polyfill';

const Header = view(() => {
  
  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        
        <Typography variant="h6" color="inherit">
          Amazon Cognito UI Tool
        </Typography>
       <CognitoConfigController />
      </Toolbar>
    </AppBar>
  );

});

export default Header; 