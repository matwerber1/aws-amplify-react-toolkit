import './App.css';
import React from 'react';
import Header from './components/header';
import Body from './components/body';
import Footer from './components/footer';
import { view } from '@risingstack/react-easy-state';
import useStyles from './components/material-ui-styles.js';
import CssBaseline from '@material-ui/core/CssBaseline';

function App() {

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      {/* reviewing */}
      <Header />
      {/* not reviewed */}
      <Body />
    </div>
  );
}

export default view(App);