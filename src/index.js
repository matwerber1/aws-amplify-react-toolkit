import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Amplify from "aws-amplify";
import awsExports from "./aws-exports";
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import pubsub_config from './pubsub-config';
Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: pubsub_config.iot_region,
  aws_pubsub_endpoint: pubsub_config.iot_endpoint,
}));
Amplify.configure(awsExports);

ReactDOM.render(
  <React.Fragment>
    <App />
  </React.Fragment>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
