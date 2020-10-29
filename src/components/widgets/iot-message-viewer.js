import React, {useEffect} from 'react';
import { store, view } from '@risingstack/react-easy-state';
import Widget from './widget.js';
import { TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import AWS from 'aws-sdk';
import pubsub_config from '../../pubsub-config';
import { Auth, PubSub } from 'aws-amplify';

const state = store({
  message_history_limit: 200,
  message_count: 0,
  messages: [],
  subscribeTopicInput: localStorage.getItem('iotviewer-subscribeTopicInput') || 'iot_event_viewer',
  publishTopicInput: localStorage.getItem('iotviewer-publishTopicInput') || 'iot_event_viewer',
  publishMessage: localStorage.getItem('iotviewer-publishMessage') || 'Hello, world!',
  isSubscribed: false,
  subscribedTopic: '',
  subscription: null,
  // Call this function to save last-subscribed info to localStorage (aka save preferences):
  setSubscribedTopicInput: function(topicInput) {
    this.subscribedTopic = topicInput;
    localStorage.setItem('iotviewer-subscribeTopicInput', topicInput);
  },
  // Call this function to save last-published info to localStorage (aka save preferences):
  savePublishTopicAndMessage: function () {
    localStorage.setItem('iotviewer-publishTopicInput', this.publishTopicInput);
    localStorage.setItem('iotviewer-publishMessage', this.publishMessage);
  }
});

const EventViewer = (props) => {

  // If needed, attach IoT policy to current user so they can use the pubsub functionality:
  useEffect(() => {
    const REGION = pubsub_config.iot_region;
    const policyName = pubsub_config.iot_policy;
    
    Auth.currentCredentials().then(credentials => {
      const iot = new AWS.Iot({
        region: REGION,
        credentials: Auth.essentialCredentials(credentials)
      });
      const target = credentials.identityId;
      iot.listAttachedPolicies({ target }, (err, data) => {
        if (err) console.log(err, err.stack);
        if (!data.policies.find(policy => policy.policyName === policyName)) {
          iot.attachPolicy({ policyName, target }, (err, data) => {
            if (err) console.log(`Error attaching IoT policy ${policyName} to Cognito identity ${target}: ${err}`, err.stack);
            else console.log(`Attached IoT policy ${policyName} to identity ${target}.`);
          });
        }
      });
    });
  }, []);

  // Handles messages received from AWS IoT subscription:
  function handleReceivedMessage(data) {
    const symbolKey = Reflect.ownKeys(data.value).find(key => key.toString() === 'Symbol(topic)');
    const publishedTopic = data.value[symbolKey];
    console.log(`Message received on ${publishedTopic}: ${data.value.msg}`);
    if (state.message_count >= state.message_history_limit) {
      state.messages.shift();
    }
    else {
      // Only increment our counter if message count less than allowed total history. 
      // Once message count is equal to / greater than message history, we start removing the first (oldest) item to make room for the newer item
      state.message_count += 1;
    }
    const timestamp = new Date().toISOString();
    state.messages.push(`${timestamp} - topic=${publishedTopic}: ${data.value.msg}\n`);
    
  }

  // Fired when user clicks subscribe button:
  function subscribeToTopic() {
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
    console.log(`Subscribed to IoT topic ${state.subscribeTopicInput }.`);
    state.isSubscribed = true;
    state.setSubscribedTopicInput(state.subscribeTopicInput);
  }

  // Fired when user clicks the publish button:
  function sendMessage() {
    PubSub.publish(state.publishTopicInput, { msg: state.publishMessage });
    console.log(`Published message to ${state.publishTopicInput}.`);
    state.savePublishTopicAndMessage();
  }

  return (
    <Widget>
      <h2>IoT Message Viewer</h2>
      <TextField
        id="subscribeTopicInput"
        label="Subscribed topic"
        value={state.subscribeTopicInput}
        onChange={ev => (state.subscribeTopicInput = ev.target.value)}
      />
      <Button id="subscribeToTopic" variant="contained" color="primary" onClick={subscribeToTopic}>
        Subscribe to topic
      </Button>
      <br/><br/>
      <TextField
        id="publishTopic"
        label="Topic to publish to"
        value={state.publishTopicInput}
        onChange={ev => (state.publishTopicInput = ev.target.value)}
      />
      <TextField
        id="publishMessage"
        label="Message to publish"
        value={state.publishMessage}
        onChange={ev => (state.publishMessage = ev.target.value)}
      />
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

export default view(EventViewer); 