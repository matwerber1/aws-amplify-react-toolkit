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
  subscribeTopic: 'iot_event_viewer',
  publishTopic: 'iot_event_viewer',
  publishMessage: 'Hello, world!'
});

const EventViewer = (props) => {

  const SUBSCRIBE_TOPIC = events.subscribeTopic;

  // In order to use AWS IoT, the Cognito user needs an IoT policy attached.
  // We check their currently-assigned policies and if the policy is missing,
  // we attach it:
  useEffect(() => {
    Auth.currentCredentials()
      .then((credentials) => {
        const iot = new AWS.Iot({
          region: pubsub_config.iot_region,
          credentials: Auth.essentialCredentials(credentials)
        });
        const target = credentials.identityId;
        iot.listAttachedPolicies({ target }, (err, data) => {
          const policyName = pubsub_config.iot_policy;
          if (!data.policies.find(policy => policy.policyName === policyName)) {
            iot.attachPolicy({ policyName, target }, () => {
              console.log('Attaching IoT policy ' + policyName + ' to identity ' + target);
            });
          }
        });
      });
  }, []);

  // In order to use AWS IoT, the Cognito user needs an IoT policy attached.
  // We check their currently-assigned policies and if the policy is missing,
  // we attach it:
  useEffect(() => {    
    PubSub.subscribe(SUBSCRIBE_TOPIC).subscribe({
      next: data => {
        const symbolKey = Reflect.ownKeys(data.value).find(key => key.toString() === 'Symbol(topic)');
        const publishedTopic = data.value[symbolKey];
        console.log(`Message received on ${publishedTopic}: ${data.value.msg}`);
        if (events.message_count >= events.message_history_limit) {
          events.message_count = 0;
          events.messages = '';
        }
        events.messages += `topic=${publishedTopic}: ${data.value.msg}\n`;
        events.message_count += 1;
      },
      error: error => console.error(error),
      close: () => console.log('Done'),
    });
    console.log(`Subscribed to IoT topic ${SUBSCRIBE_TOPIC}.`);
  }, [SUBSCRIBE_TOPIC]);

  function sendMessage() {
    PubSub.publish(events.publishTopic, { msg: events.publishMessage });
    console.log(`Published message to ${events.publishTopic}.`);
  }

  return (
    <Widget>
      <h2>IoT Message Viewer</h2>
      <TextField
        id="subscribeTopic"
        label="Subscribed topic"
        value={events.subscribeTopic}
        onChange={ev => (events.subscribeTopic = ev.target.value)}
      />
      <br/><br/>
      <TextField
        id="publishTopic"
        label="Topic to publish to"
        value={events.publishTopic}
        onChange={ev => (events.publishTopic = ev.target.value)}
      />
      <TextField
        id="publishMessage"
        label="Message to publish"
        value={events.publishMessage}
        onChange={ev => (events.publishMessage = ev.target.value)}
      />
      <Button variant="contained" color="primary" onClick={sendMessage}>
        Publish message
      </Button>
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