import React, {useEffect} from 'react';
import { store, view } from '@risingstack/react-easy-state';
import Widget from './widget.js';
import { TextField } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Grid from '@material-ui/core/Grid';
// import VolumeDown from '@material-ui/icons/VolumeDown';
// import VolumeUp from '@material-ui/icons/VolumeUp';
import Button from '@material-ui/core/Button';
import AWS from 'aws-sdk';
import { Auth, PubSub, API } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import Amplify from 'aws-amplify';
import awsExports from "../../aws-exports";
// import { Text, StyleSheet } from "react-native";

import { makeStyles } from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Paper from '@material-ui/core/Paper';

const LOCAL_STORAGE_KEY = 'iot-widget';

const state = store({
  iotPolicy: 'amplify-toolkit-iot-message-viewer',     // This policy is created by this Amplify project; you don't need to change this unless you want to use a different policy.  
  iotEndpoint: null,              // We retrieve this when the component first loads
  message_history_limit: 200,
  message_count: 0,
  messages: [],
  Pot1:'0',
  Pot2:'0',
  Pot3:'0',
  Pot4:'0',
  PWM1:'0',
  PWM2:'0',
  PWM3:'0',
  PWM4:'0',
  subscribeTopicInput: '$aws/things/Mini_SSS3/shadow/update/accepted',
  subscribeTopicGetAccepted: '$aws/things/Mini_SSS3/shadow/get/accepted',

  publishTopicInput: '$aws/things/Mini_SSS3/shadow/update',
  publishTopicGet: '$aws/things/Mini_SSS3/shadow/get',
  publishMessage: '',
  isSubscribed: false,
  subscribedTopic: '',
  subscription: null,
  subscriptionGet: null,
  iotProviderConfigured: false,
  Sync: false

});
const desired = store({
  Pot1:'50',
  Pot2:'50',
  Pot3:'50',
  Pot4:'50',
  PWM1:'0',
  PWM2:'0',
  PWM3:'0',
  PWM4:'0'});

  const reported = store({
  Pot1:'0',
  Pot2:'0',
  Pot3:'0',
  Pot4:'0',
  PWM1:'0',
  PWM2:'0',
  PWM3:'0',
  PWM4:'0'});

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const stateKeysToSave = [
  'subscribeTopicInput',
  'publishTopicInput',
  'publishMessage'
];

//------------------------------------------------------------------------------
const EventViewer = (props) => {

  // If needed, attach IoT policy to current user so they can use the pubsub functionality:
  useEffect(() => {
    async function setup() {
      await getIoTEndpoint();
      await configurePubSub();
      await attachIoTPolicyToUser();
      await subscribeToTopic();
      await sendMessageEmpty();
    }
    setup();
    updateFormValuesFromLocalStorage();
  }, []);
 const classes = useStyles();
 const [value, setValue] = React.useState(30);

  const handleChangePot1 = (key, newValue) => {
    desired.Pot1 =newValue;
    var message = {};
    message["desired"] = {};
    message["desired"]["Potentiometers"]={};
    message["desired"]["Potentiometers"]["POT1"] = newValue;
    // message.state.desired.Potentiometers.Pot1= newValue;
    // console.log(JSON.stringify(message, null, 2));
    PubSub.publish(state.publishTopicInput, { state: message });
    console.log(`Published message to ${state.publishTopicInput}.`);

  };
  const handleChangePot2 = (key, newValue) => {
    desired.Pot2 =newValue;
    var message = {};
    message["desired"] = {};
    message["desired"]["Potentiometers"]={};
    message["desired"]["Potentiometers"]["POT2"] = newValue;
    PubSub.publish(state.publishTopicInput, { state: message });
    // console.log(JSON.stringify(message, null, 2));

  };
  const handleChangePot3 = (key, newValue) => {
    desired.Pot3 =newValue;
    var message = {};
    message["desired"] = {};
    message["desired"]["Potentiometers"]={};
    message["desired"]["Potentiometers"]["POT3"] = newValue;
    PubSub.publish(state.publishTopicInput, { state: message });
    // console.log(JSON.stringify(message, null, 2));
  };
  const handleChangePot4 = (key, newValue) => {
    desired.Pot4 =newValue;
    var message = {};
    message["desired"] = {};
    message["desired"]["Potentiometers"]={};
    message["desired"]["Potentiometers"]["POT4"] = newValue;
    PubSub.publish(state.publishTopicInput, { state: message });
    // console.log(JSON.stringify(message, null, 2));
  };
  // const handleChangePot1 = (key, newValue) => {
  //   desired.Pot1 =newValue;
  // };
  // const handleChangePot1 = (key, newValue) => {
  //   desired.Pot1 =newValue;
  // };

  return (
    <div className={classes.root}>
    <Widget>
      <h2>Mini Smart Sensor Simulator 3</h2>
      <TextField
        id="subscribeTopicInput"
        label="Subscribed topic"
        value={state.subscribeTopicInput}
        onChange={e => updateState('subscribeTopicInput', e.target.value)}
        
      />
      <br/><br/>
      <Button id="subscribeToTopic" variant="contained" color="primary" onClick={subscribeToTopic}>
        Subscribe to topic
      </Button>
      <br/><br/><br/>
      <TextField
        id="publishTopicInput"
        label="Topic to publish to"
        value={state.publishTopicInput}
        onChange={e => updateState('publishTopicInput', e.target.value)}
      />
      <TextField
        id="publishMessage"
        label="Message to publish"
        value={state.publishMessage}
        onChange={e => updateState('publishMessage', e.target.value)}
      />
      <br/><br/>
      <Button id="publishMessage" variant="contained" color="primary" onClick={sendMessage}>
        Publish message
      </Button>
      <br/><br/>
      
  <   Grid container spacing={3}>
        <Grid item xs={3} id = "Pot1">
          <Typography id="Pot1" gutterBottom>
            Pot 1: {reported.Pot1}
          </Typography>
          <Slider
                defaultValue={50}
                value={desired.Pot1}
                aria-label="Pot1"
                onChange ={handleChangePot1}
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
              
        </Grid>
         <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            Pot 2: {reported.Pot2}
          </Typography>
          <Slider
                defaultValue={50}
                value={desired.Pot2}
                aria-label="Pot2"
                onChange ={handleChangePot2}
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
         <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            Pot 3: {reported.Pot3}
          </Typography>
          <Slider
                defaultValue={5}
                value={desired.Pot3}
                // aria-labelledby="discrete-slider-small-steps"
                // step={1}
                // marks
                onChange ={handleChangePot3}
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
        <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            Pot 4: {reported.Pot4}
          </Typography>
          <Slider
                defaultValue={5}
                value={desired.Pot4}
                // aria-labelledby="discrete-slider-small-steps"
                // step={1}
                // marks
                onChange ={handleChangePot4}
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
        {/* <Grid item xs={3}>
          <Paper className={classes.paper}>xs=3</Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper className={classes.paper}>xs=3</Paper>
        </Grid> */}
        <br/><br/>
{/* 
        <Button id="pot1" variant="contained" color="primary" onClick={sendMessage }>
          {state.Pot1}
        </Button> */}

        <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            PWM1:
          </Typography>
          <Slider
                defaultValue={5}
                
                // aria-labelledby="discrete-slider-small-steps"
                // step={1}
                // marks
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
         <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            PWM 2:
          </Typography>
          <Slider
                defaultValue={5}
                
                // aria-labelledby="discrete-slider-small-steps"
                // step={1}
                // marks
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
         <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            PWM 3:
          </Typography>
          <Slider
                defaultValue={5}
                
                // aria-labelledby="discrete-slider-small-steps"
                // step={1}
                // marks
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
        <Grid item xs={3}>
          <Typography id="discrete-slider-small-steps" gutterBottom>
            PWM 4:
          </Typography>
          <Slider
                defaultValue={5}
                
                // aria-labelledby="discrete-slider-small-steps"
                // step={1}
                // marks
                min={0}
                max={255}
                valueLabelDisplay="auto"
              />
        </Grid>
      </Grid>
    
     
      <br /><br />
      { state.isSubscribed ?
        <div style={{ color: 'green' }}>Currently subscribed to topic '{state.subscribedTopic}':</div>
        :
        <div style={{ color: 'red' }}>Subscribe to a topic to view messages</div>
      }
      <br /><br />
      {state.isSubscribed ?
          <TextField
          id="eventStream"
          label="received messages"
          value={state.messages.join('')}
          fullWidth={true}
          multiline={true}
          rowsMax={30}
          size='small'
          disabled={true}
          variant="outlined"
          />
        :
          null}
    </Widget>
    </div>
  );
};



//------------------------------------------------------------------------------
async function getIoTEndpoint() {

  // Each AWS account has a unique IoT endpoint per region. We need to retrieve this value: 
  console.log('Getting IoT Endpoint...');
  const credentials = await Auth.currentCredentials();
  const iot = new AWS.Iot({
    region: awsExports.aws_project_region,
    credentials: Auth.essentialCredentials(credentials)
  });
  const response = await iot.describeEndpoint({endpointType: 'iot:Data-ATS'}).promise();
  state.iotEndpoint = `wss://${response.endpointAddress}/mqtt`
  console.log(`Your IoT Endpoint is:\n ${state.iotEndpoint}`);

}


async function configurePubSub() {

  if (!state.iotProviderConfigured) {
    console.log(`Configuring Amplify PubSub, region = ${awsExports.aws_project_region}, endpoint = ${state.iotEndpoint}`);
    Amplify.addPluggable(new AWSIoTProvider({
      aws_pubsub_region: awsExports.aws_project_region,
      aws_pubsub_endpoint: state.iotEndpoint,
    }));
    state.iotProviderConfigured = true;
  }
  else {
    console.log('Amplify IoT provider already configured.');
  }
  
  
}

//------------------------------------------------------------------------------
async function attachIoTPolicyToUser() {

  // This should be the custom cognito attribute that tells us whether the user's
  // federated identity already has the necessary IoT policy attached:
  const IOT_ATTRIBUTE_FLAG = 'custom:iotPolicyIsAttached';

  var userInfo = await Auth.currentUserInfo({bypassCache: true});
  var iotPolicyIsAttached = userInfo.attributes[IOT_ATTRIBUTE_FLAG] === "true";

  if (!iotPolicyIsAttached) {

    const apiName = 'amplifytoolkit';
    const path = '/attachIoTPolicyToFederatedUser'; 
    const myInit = {
        response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
    };
  
    console.log(`Calling API GET ${path} to attach IoT policy to federated user...`);
    var response = await API.get(apiName, path, myInit);
    console.log(`GET ${path} ${response.status} response:\n ${JSON.stringify(response.data,null,2)}`);
    console.log(`Attached IoT Policy to federated user.`)

  }
  else {
    console.log(`Federated user ID already attached to IoT Policy.`);
  }
}

//------------------------------------------------------------------------------
function updateState(key, value) {
  console.log(`Data changed ${key}:\n ${value}`);
  state[key] = value;
  var localKey = `${LOCAL_STORAGE_KEY}-${key}`;
  localStorage.setItem(localKey, value);
}

function updateDesired(key, value) {
    console.log(key);
    console.log(value);

  desired[key] = value;
  reported[key] = value;
  var localKey = `kvs-widget-${key}`;
  localStorage.setItem(localKey, value);
  // console.log(`Data changed ${key}:\n ${value}`);

}
//------------------------------------------------------------------------------
function handleReceivedMessage(data) {
  // Received messages contain the topic name in a Symbol that we have to decode: 

  const symbolKey = Reflect.ownKeys(data.value).find(key => key.toString() === 'Symbol(topic)');
  const publishedTopic = data.value[symbolKey];
  const message = JSON.stringify(data.value.state, null, 2);
  if (!state.Sync){
      console.log('*********************** Synchronizing *************************');
      if (data.value.state.desired){
      if (data.value.state.desired.Potentiometers){
        if (data.value.state.desired.Potentiometers.POT1){
              const Pot1 = JSON.stringify(data.value.state.desired.Potentiometers.POT1, null, 2);
              desired.Pot1 = Pot1;
        }
        if (data.value.state.desired.Potentiometers.POT2){
            const Pot2 = JSON.stringify(data.value.state.desired.Potentiometers.POT2, null, 2);
            desired.Pot2 = Pot2;
        }
        if (data.value.state.desired.Potentiometers.POT3){
            const Pot3 = JSON.stringify(data.value.state.desired.Potentiometers.POT3, null, 2);
            desired.Pot3 = Pot3;
        }
        if (data.value.state.desired.Potentiometers.POT4){
            const Pot4 = JSON.stringify(data.value.state.desired.Potentiometers.POT4, null, 2);
            desired.Pot4 = Pot4;
        }
      }
    }
    state.Sync = true;
  }
  console.log('************************************************');
  if (data.value.state.reported){
   if (data.value.state.reported.Potentiometers){
     if (data.value.state.reported.Potentiometers.POT1){
          const Pot1 = JSON.stringify(data.value.state.reported.Potentiometers.POT1, null, 2);
          reported.Pot1 = Pot1;
     }
     if (data.value.state.reported.Potentiometers.POT2){
        const Pot2 = JSON.stringify(data.value.state.reported.Potentiometers.POT2, null, 2);
        reported.Pot2 = Pot2;
     }
     if (data.value.state.reported.Potentiometers.POT3){
        const Pot3 = JSON.stringify(data.value.state.reported.Potentiometers.POT3, null, 2);
        reported.Pot3 = Pot3;
     }
     if (data.value.state.reported.Potentiometers.POT4){
        const Pot4 = JSON.stringify(data.value.state.reported.Potentiometers.POT4, null, 2);
        reported.Pot4 = Pot4;
     }
   }
  }

  // if (temp){ 

  // }
  // const PWM1 = JSON.stringify(data.value.state.reported.PWM.PWM1, null, 2);
  // const PWM2 = JSON.stringify(data.value.state.reported.PWM.PWM2, null, 2);
  // const PWM3 = JSON.stringify(data.value.state.reported.PWM.PWM3, null, 2);
  // const PWM4 = JSON.stringify(data.value.state.reported.PWM.PWM4, null, 2);


  console.log(`Message received on ${publishedTopic}:\n ${message}`);
  if (state.message_count >= state.message_history_limit) {
    state.messages.shift();
  }
  else {
    state.message_count += 1;
  }
  const timestamp = new Date().toISOString();
  state.messages.push(`${timestamp} - topic '${publishedTopic}':\n ${message}\n\n`);
}

//------------------------------------------------------------------------------
async function subscribeToTopic() {
  
  // Fired when user clicks subscribe button:
  if (state.isSubscribed) {
    state.subscription.unsubscribe();
    console.log(`Unsubscribed from ${state.subscribedTopic}`);
    state.isSubscribed = false;
    state.subscribedTopic = '';
  }
  state.subscription = PubSub.subscribe(state.subscribeTopicInput).subscribe({
    next: data => handleReceivedMessage(data),
    error: error => console.error(error),
    close: () => console.log('Done'),
  });

  state.subscriptionGet = PubSub.subscribe(state.subscribeTopicGetAccepted).subscribe({
    next: data => handleReceivedMessage(data),
    error: error => console.error(error),
    close: () => console.log('Done'),
  });

  state.isSubscribed = true;
  state.subscribedTopic = state.subscribeTopicInput;
  console.log(`Subscribed to IoT topic ${state.subscribeTopicInput }`);

  
  
}

//------------------------------------------------------------------------------
function sendMessage() {
  // Fired when user clicks the publish button:
  PubSub.publish(state.publishTopicInput, { msg: state.publishMessage });
  console.log(`Published message to ${state.publishTopicInput}.`);
}


function updateFormValuesFromLocalStorage() {

  for (const [key] of Object.entries(state)) {
    
    if (stateKeysToSave.includes(key)) {
      console.log(`Getting ${key} from local storage...`);
      var localStorageValue = localStorage.getItem(`${LOCAL_STORAGE_KEY}-${key}`);
  
      if (localStorageValue) {
  
        // Convert true or false strings to boolean (needed for checkboxes):
        if (["true", "false"].includes(localStorageValue)) {
          localStorageValue = localStorageValue === "true";
        }
        //console.log(`Setting ${key} = `, localStorageValue);
        state[key] = localStorageValue;
        console.log('value = ' + localStorageValue);
      }
  
    }
  
  }

}


export default view(EventViewer); 
