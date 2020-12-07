import React, {useEffect} from 'react';
import { store, view } from '@risingstack/react-easy-state';
import Widget from './widget.js';
import { TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import AWS from 'aws-sdk';
import { Auth, PubSub, API } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import Amplify from 'aws-amplify';
import awsExports from "../../aws-exports";

const state = store({
  iotPolicy: 'amplify-toolkit-iot-message-viewer',     // This policy is created by this Amplify project; you don't need to change this unless you want to use a different policy.  
  iotEndpoint: null,              // We retrieve this when the component first loads
  message_history_limit: 200,
  message_count: 0,
  messages: [],
  subscribeTopicInput: 'iot_event_viewer',
  publishTopicInput: 'iot_event_viewer',
  publishMessage: 'Hello, world!',
  isSubscribed: false,
  subscribedTopic: '',
  subscription: null,
  iotProviderConfigured: false
});

//------------------------------------------------------------------------------
const EventViewer = (props) => {

  // If needed, attach IoT policy to current user so they can use the pubsub functionality:
  useEffect(() => {
    async function setup() {
      await getIoTEndpoint();
      await configurePubSub();
      await attachIoTPolicyToUser();
    }
    setup();
  }, []);

  return (
    <Widget>
      <h2>IoT Message Viewer</h2>
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
  state[key] = value;
  var localKey = `kvs-widget-${key}`;
  localStorage.setItem(localKey, value);
}

//------------------------------------------------------------------------------
function handleReceivedMessage(data) {

  // Received messages contain the topic name in a Symbol that we have to decode: 
  const symbolKey = Reflect.ownKeys(data.value).find(key => key.toString() === 'Symbol(topic)');
  const publishedTopic = data.value[symbolKey];
  const message = JSON.stringify(data.value, null, 2);

  console.log(`Message received on ${publishedTopic}:\n ${message}`);
  if (state.message_count >= state.message_history_limit) {
    state.messages.pop();
  }
  else {
    state.message_count += 1;
  }
  const timestamp = new Date().toISOString();
  state.messages.unshift(`${timestamp} - topic '${publishedTopic}':\n ${message}\n\n`);
}

//------------------------------------------------------------------------------
function subscribeToTopic() {
  
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

export default view(EventViewer); 