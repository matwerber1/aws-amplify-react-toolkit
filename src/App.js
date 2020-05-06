import './App.css';
import React from 'react';
import { view } from '@risingstack/react-easy-state';
import CssBaseline from '@material-ui/core/CssBaseline';

import Header from './components/header';
import Body from './components/body';
import useStyles from './components/common/material-ui-styles.js';

function App() {

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Header />
      <Body />
    </div>
  );
}

export default view(App);