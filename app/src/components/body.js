import React, { useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import AwsCliProxy from './aws-cli-proxy';
import Drawer from '@material-ui/core/Drawer';
import appStore from './app-store';
import useStyles from './material-ui-styles.js';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
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

  const widgets = [
    {
      component: UserInfo,
      displayName: 'Cognito Info',
      id: 'cognito-info',
      displayOnFirstLoad: true
    },
    {
      component: Ec2DescribeInstances,
      displayName: 'EC2 Instances',
      id: 'ec2-instances',
      displayOnFirstLoad: false
    },
    {
      component: AwsCliProxy,
      displayName: 'AWS CLI Proxy',
      id: 'cli-proxy',
      displayOnFirstLoad: false
    }
  ];

  // initial state is 0 for everything
  const defaultCheckboxStates = widgets.map(({displayOnFirstLoad}) => { return displayOnFirstLoad });
  const [checkboxState, setCheckboxState] = useState(defaultCheckboxStates);

  const handleToggle = (index) => {
    console.log('handle toggle is: ', index);
    const newCheckboxState = [...checkboxState];
    if (newCheckboxState[index] === false) {
      newCheckboxState[index] = true;
    }
    else {
      newCheckboxState[index] = false;
    }
    setCheckboxState(newCheckboxState);
  };

  return (
    <React.Fragment>
      <AppDrawer widgets={widgets} handleToggle={handleToggle} checkboxState={checkboxState} />
      <main className={classes.content}>
        <Toolbar />
        {/* ------- This is where you put the body after user is authenticated ---------*/}
        {widgets.map((widget, index) => {
          if (checkboxState[index] === true) {
            return React.createElement(widget.component, { key: widget.id });
          }
          else {
            return null;
          }
        })}
        {/* ----------------------------------------------------------------------------*/}
        <Footer/>
      </main>
    </React.Fragment>
  );
});

const AppDrawer = view(({widgets, handleToggle, checkboxState}) => {

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
        <Container className={classes.drawerHeaderContainer}>
          <Box m={1} >
            <Typography variant="h6">
              Widgets
            </Typography>
          </Box>
        </Container>

        <div className={classes.drawerContainer}>
          <List>
            {widgets.map((widget, index) => {
              const labelId = `checkbox-list-label-${widget.id}`;
              return (
                <ListItem key={widget.id} dense button onClick={() => handleToggle(index)}>
                <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={checkboxState[index]}
                      tabIndex={-1}
                      disableRipple
                      key={`checkbox-${widget.id}`}
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </ListItemIcon>
                  <ListItemText key={labelId} primary={widget.displayName} />
                </ListItem>
              );
            })}
          </List>
          <Divider />
        </div>
      </Drawer>
    </React.Fragment>
  );
});

export default Body; 