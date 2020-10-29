import React, {useEffect} from 'react';
import { store, view } from '@risingstack/react-easy-state';
import Widget from './widget.js';
import { TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import AWS from 'aws-sdk';
import pubsub_config from '../../pubsub-config';
import { Auth, PubSub } from 'aws-amplify';

const events = store({
  message_history_limit: 500,
  message_count: 0,
  messages: '',
  subscribeTopicInput: 'iot_event_viewer',
  publishTopicInput: 'iot_event_viewer',
  publishMessage: 'Hello, world!',
  isSubscribed: false,
  subscribedTopic: '',
  subscription: null
});

const EventViewer = (props) => {

  // If needed, attach IoT policy to current user so they can use the pubsub functionality:
  useEffect(() => {
    async function addIotPolicyToUser() {
      const credentials = await Auth.currentCredentials();
      const iot = new AWS.Iot({
        region: pubsub_config.iot_region,
        credentials: Auth.essentialCredentials(credentials)
      });
      const target = credentials.identityId;
      const {policies} = await iot.listAttachedPolicies({ target }).promise();
      const policyName = pubsub_config.iot_policy;
      if (!policies.find(policy => policy.policyName === policyName)) {
        await iot.attachPolicy({ policyName, target }).promise();
        console.log('Attached IoT policy ' + policyName + ' to identity ' + target);
      }
    }
    addIotPolicyToUser();
  }, []);

  // Handles messages received from AWS IoT subscription:
  function handleReceivedMessage(data) {
    const symbolKey = Reflect.ownKeys(data.value).find(key => key.toString() === 'Symbol(topic)');
    const publishedTopic = data.value[symbolKey];
    console.log(`Message received on ${publishedTopic}: ${data.value.msg}`);
    if (events.message_count >= events.message_history_limit) {
      events.message_count = 0;
      events.messages = '';
    }
    events.messages += `topic=${publishedTopic}: ${data.value.msg}\n`;
    events.message_count += 1;
  }

  // Fired when user clicks subscribe button:
  function subscribeToTopic() {
    if (events.isSubscribed) {
      events.subscription.unsubscribe();
      console.log(`Unsubscribed from ${events.subscribedTopic}`);
      events.isSubscribed = false;
      events.subscribedTopic = '';
    }
    events.subscription = PubSub.subscribe(events.subscribeTopicInput).subscribe({
      next: data => handleReceivedMessage(data),
      error: error => console.error(error),
      close: () => console.log('Done'),
    });
    console.log(`Subscribed to IoT topic ${events.subscribeTopicInput }.`);
    events.isSubscribed = true;
    events.subscribedTopic = events.subscribeTopicInput;
  }

  // Fired when user clicks the publish button:
  function sendMessage() {
    PubSub.publish(events.publishTopicInput, { msg: events.publishMessage });
    console.log(`Published message to ${events.publishTopicInput}.`);
  }

  return (
    <Widget>
      <h2>IoT Message Viewer</h2>
      <TextField
        id="subscribeTopicInput"
        label="Subscribed topic"
        value={events.subscribeTopicInput}
        onChange={ev => (events.subscribeTopicInput = ev.target.value)}
      />
      <Button id="subscribeToTopic" variant="contained" color="primary" onClick={subscribeToTopic}>
        Subscribe to topic
      </Button>
      <br/><br/>
      <TextField
        id="publishTopic"
        label="Topic to publish to"
        value={events.publishTopicInput}
        onChange={ev => (events.publishTopicInput = ev.target.value)}
      />
      <TextField
        id="publishMessage"
        label="Message to publish"
        value={events.publishMessage}
        onChange={ev => (events.publishMessage = ev.target.value)}
      />
      <Button id="publishMessage" variant="contained" color="primary" onClick={sendMessage}>
        Publish message
      </Button>
      <br /><br />
      { events.isSubscribed ?  `Currently subscribed to ${events.subscribedTopic}` : "Please subscribe to a topic to view messages"}
      <br/><br/>
      <TextField
        id="eventStream"
        label="IoT messages received"
        value={events.messages}
        fullWidth={true}
        multiline={true}
        rowsMax={10}
        size='small'
        disabled={true}
        variant="outlined"
      />
    </Widget>
  );
};

export default view(EventViewer); 