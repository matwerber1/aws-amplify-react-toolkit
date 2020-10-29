import React from 'react';
import { view } from '@risingstack/react-easy-state';
import 'cross-fetch/polyfill';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import useStyles from './common/material-ui-styles.js';
import { AmplifySignOut } from '@aws-amplify/ui-react';

const Header = view(() => {
  
  const classes = useStyles();

  return (

    <AppBar position="fixed" className={classes.appBarHeader}>
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          AWS Toolkit
        </Typography>
        <AmplifySignOut />
      </Toolbar>
    </AppBar>
  );

});

export default Header; 