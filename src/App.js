import './App.css';
import { withAuthenticator } from '@aws-amplify/ui-react';
import CssBaseline from '@material-ui/core/CssBaseline';
import useStyles from './components/common/material-ui-styles.js';
import Header from './components/header';
import Body from './components/body';

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

export default withAuthenticator(App);