import React, {useEffect} from 'react';
import { store, view } from '@risingstack/react-easy-state';
import Widget from './widget.js';
import { TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import AWS from 'aws-sdk';
import { Auth, PubSub } from 'aws-amplify';
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
  subscription: null
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
        <div style={{ color: 'green' }}>Currently subscribed to {state.subscribedTopic}</div>
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
          rowsMax={10}
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

  console.log(`Configuring Amplify PubSub, region = ${awsExports.aws_project_region}, endpoint = ${state.iotEndpoint}`);
  Amplify.addPluggable(new AWSIoTProvider({
    aws_pubsub_region: awsExports.aws_project_region,
    aws_pubsub_endpoint: state.iotEndpoint,
  }));
  
}

//------------------------------------------------------------------------------
async function attachIoTPolicyToUser() {

  const credentials = await Auth.currentCredentials();
  const iot = new AWS.Iot({
    region: awsExports.aws_project_region,
    credentials: Auth.essentialCredentials(credentials)
  });
  const target = credentials.identityId;
  const policyName = state.iotPolicy;
  const response = await iot.listAttachedPolicies({target}).promise();
  const policies = response.policies;
  console.log(`Cognito federated identity ${target} has the following attached IoT policies:\n`, JSON.stringify(policies, null, 2));
  if (!policies.find(policy => policy.policyName === policyName)) {
    console.log(`User is missing ${policyName} IoT policy. Attaching...`);
    await iot.attachPolicy({ policyName, target }).promise();
    console.log(`Attached ${policyName} IoT policy.`);
  }
  else {
    console.log(`User already has ${policyName} IoT policy attached.`);
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
    state.messages.shift();
  }
  else {
    state.message_count += 1;
  }
  const timestamp = new Date().toISOString();
  state.messages.push(`${timestamp} - topic '${publishedTopic}':\n ${message}\n\n`);
  
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