import React from 'react';
import { view } from '@risingstack/react-easy-state';
import AwsCliProxy from './aws-cli-proxy';
import Drawer from '@material-ui/core/Drawer';
import appStore from './app-store';
import useStyles from './material-ui-styles.js';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import Footer from './footer.js';
import CustomAuthenticator from './custom-authenticator';
import Ec2DescribeInstances from './ec2-describe-instances';
import UserInfo from './user-info';

const Body = view(() => {

  console.log(`authState = ${appStore.cognito.authState}`);

  const loggedIn = (appStore.cognito.loggedIn);

  return (
    <React.Fragment>
      {loggedIn ? <SignedInBody/> : <SignInBody/>}
    </React.Fragment>
  );
});


const SignInBody = view(() => {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      <CustomAuthenticator displayType='login' updateAuthState={appStore.cognito.updateAuthState} />
      <Footer/>
    </main>
  );
});

const SignedInBody = view(() => {
  const classes = useStyles();
  return (
    <React.Fragment>
      <AppDrawer/>
      <main className={classes.content}>
        <Toolbar />
        {/* ------- This is where you put the body after user is authenticated ---------*/}
        <UserInfo />
        <Ec2DescribeInstances />
        <AwsCliProxy />
        {/* ----------------------------------------------------------------------------*/}
        <Footer/>
      </main>
    </React.Fragment>
  );
});

const AppDrawer = view(() => {
  const classes = useStyles();
  return (
    <React.Fragment>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        open={true}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Toolbar />
        <div className={classes.drawerContainer}>
          <List>
            {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
              <ListItem button key={text}>
                <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {['All mail', 'Trash', 'Spam'].map((text, index) => (
              <ListItem button key={text}>
                <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>
    </React.Fragment>
  );
});

export default Body; 