import React from 'react';

import Container from '@material-ui/core/Container';
import { view } from '@risingstack/react-easy-state';
import CustomAuthenticator from './custom-authenticator';
import UserInfo from './user-info';
import Ec2DescribeInstances from './ec2-describe-instances';
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
import { authStates } from './auth-states.js';

const Body = view(() => {

  console.log(`authState = ${appStore.cognito.authState}`);
  var signedIn = (appStore.cognito.authState === authStates.signedIn);

  return (
    <React.Fragment>
      {signedIn ? <SignedInBody/> : <SignInBody/>}
    </React.Fragment>
  );
});


const SignInBody = view(() => {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      < CustomAuthenticator displayType='login' />
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
        <Ec2DescribeInstances Auth={appStore.Auth} />
        <AwsCliProxy Auth={appStore.Auth}/>
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