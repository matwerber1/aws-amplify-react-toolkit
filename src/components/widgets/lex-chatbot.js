import React, {useEffect} from 'react';
import Widget from './widget.js';
import { API } from 'aws-amplify';
import {store, view} from '@risingstack/react-easy-state';
import JsonViewer from './json-viewer';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
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