import React, { useState } from 'react';
import { view } from '@risingstack/react-easy-state';

import Drawer from '@material-ui/core/Drawer';
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
import CustomAuthenticator from './auth/custom-authenticator';
import appStore from './common/app-store';
import useStyles from './common/material-ui-styles.js';
import UserInfo from './widgets/user-info';
import Ec2DescribeInstances from './widgets/ec2-describe-instances';

const Body = view(() => {

  console.log(`authState = ${appStore.cognito.authState}`);

  const loggedIn = (appStore.cognito.loggedIn);

  return (
    <React.Fragment>
      {loggedIn ? <SignedInBody/> : <SignInBody/>}
    </React.Fragment>
  );
});

// If user is not signed in, display a login component for Cognito:
const SignInBody = view(() => {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      <CustomAuthenticator displayType='login' updateAuthState={appStore.cognito.updateAuthState} />
      <Footer/>
    </main>
  );
});

// If user is signed in, display the widget navigation side bar as well as the content of any selected widget(s):
const SignedInBody = view(() => {
  
  const classes = useStyles();

  // This is the key parameter for UI display.
  // For any widget that you want displayed in the left navigation, you should
  // add an item to this array:
  /*
    const widgets = [
      {
        component: <COMPONENNT>     // the actual react functional component that you want to display
        displayName: <STRING>       // name of widget that will display in the left app navigation
        id: <STRING>                // arbitrary ID that we assign to component properties
        displayOnFirstLoad: <BOOL>  // if true, widget will be displayed by default
      }
    ]

  */
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


// This is the left navigation bar: 
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