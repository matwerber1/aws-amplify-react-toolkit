import React from 'react';
import Widget from './widget.js';
import {view} from '@risingstack/react-easy-state';
import Typography from '@material-ui/core/Typography';

const ApiGateway = view(() => {

  return (
    <Widget>
      <Typography  variant="h4" id="tableTitle" component="div">
          Lex Chatbot
      </Typography>
      (Placeholder for chatbot)
    </Widget>
  );
  
});


export default ApiGateway; 