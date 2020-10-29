import React from 'react';
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
import useStyles from './common/material-ui-styles.js';
import UserInfo from './widgets/user-info';
import Ec2DescribeInstances from './widgets/ec2-describe-instances';
import IoTMessageViewer from './widgets/iot-message-viewer';
import DemoWidget from './widgets/demo-widget';
import { store, view } from '@risingstack/react-easy-state';

const state = store({
  widgets: [
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
      component: IoTMessageViewer,
      displayName: 'IoT Message Viewer',
      id: 'iot-message-viewer',
      displayOnFirstLoad: false
    },
    {
      component: DemoWidget,
      displayName: 'Demo Widget',
      id: 'demo-widget',
      displayOnFirstLoad: false
    },
  ]
});

// On first load, see if we can find widget's visible status in localStorage
// (i.e. read in prior preferences), otherwise, default to widget is not visible:
state.widgets.forEach((widget, index) => {
  var localKey = `widget-isVisible-${index}`;
  var localValue = localStorage.getItem(localKey);
  if (localKey) {
    state.widgets[index].visible = (localValue === 'true' ? true : false);
  }
  else {
    state.widgets[index].visible = false;
  }
});


const Body = view(() => {

  const classes = useStyles();

  return (
    <React.Fragment>
  
      <WidgetMenu />
      
      <main className={classes.content}>
        <Toolbar />
        {/* For each enabled widget, we display it here: */}
        {state.widgets.map((widget, index) => {
          if (widget.visible === true) {
            return React.createElement(widget.component, { key: widget.id });
          }
          else {
            return null;
          }
        })}
        <Footer/>
      </main>
    </React.Fragment>
  );

});

// This is the left navigation bar: 
const WidgetMenu = view(({ handleToggle, checkboxState}) => {

  function clickHandler(index) {
    var newValue = !state.widgets[index].visible
    state.widgets[index].visible = newValue;
    var localKey = `widget-isVisible-${index}`;
    localStorage.setItem(localKey, newValue);
  }

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
            {state.widgets.map((widget, index) => {
              const labelId = `checkbox-list-label-${widget.id}`;
              return (
                <ListItem key={widget.id} dense button onClick={() => clickHandler(index)}>
                <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={widget.visible}
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