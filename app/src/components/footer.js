import React from 'react';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import useStyles from './material-ui-styles.js';
import Paper from '@material-ui/core/Paper';

function Footer() {

  const classes = useStyles();

  return (
    <div className={classes.appBarFooter}>
        These works are solely my own and not necessarily those of my employer.
         <br />
         Copyright © Mat Werber
    </div>
  );
}

export default Footer; 