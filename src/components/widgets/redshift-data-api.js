import React, {useEffect} from 'react';
import TextField from '@material-ui/core/TextField';
import Widget from './widget.js';
import { store, view } from '@risingstack/react-easy-state';
import useStyles from '../common/material-ui-styles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import {Auth} from 'aws-amplify';
import RedshiftData from 'aws-sdk/clients/redshiftdata';
import RegionSelector from './region-selector.js';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import dateformat from 'dateformat';

const OPTIONS = {
  AUTH_METHOD: {
    USER: 'user',
    SECRET: 'secret'
  },
  MESSAGES: {
    LOADING_STATEMENTS: '[Loading statements...]'
  },
  STATEMENT_STATUS: {
    FINISHED: 'FINISHED'
  }
};

const state = store({
  clusterRegion: 'us-west-2',
  clusterIdentifier: '', 
  sql: 'SELECT 1;', 
  database: '', 
  dbUser: '', 
  secretArn: '', 
  statementName: 'Test Statement', 
  withEvent: false,
  statements: [],      // list of statements executed
  statementsLoaded: false,
  statementHistoryMessage: OPTIONS.MESSAGES.LOADING_STATEMENTS,
  showStatementResultDialog: false,
  selectedStatementForResults: {},       // populated with metadata of the statement a user wants to retrieve values
  statementResults: {                 // populated with the result set of the statement a user selects to view
    columns: [],
    rows: [],
    rowCount: []
  }
});


//------------------------------------------------------------------------------
// Main handler: 
const RedshiftDataApi = () => {

  useEffect(() => {
    updateFormValuesFromLocalStorage();
  }, []);

  return (
    <Widget>
      <h2>Redshift Data API</h2>
      <SubmissionForm/>
      <StatementHistory/>
    </Widget>
  );
};

//------------------------------------------------------------------------------
// When function first loads, read last-used form values (if any) from local storage:
function updateFormValuesFromLocalStorage() {
  for (const [key] of Object.entries(state)) {
    var localStorageValue = localStorage.getItem(`redshift-data-api-widget-${key}`);
    if (localStorageValue) {
      // Convert true or false strings to boolean (needed for checkboxes):
      if (["true", "false"].includes(localStorageValue)) {
        localStorageValue = localStorageValue === "true";
      }
      //console.log(`Setting ${key} = `, localStorageValue);
      state[key] = localStorageValue;
    }
  }
}

//------------------------------------------------------------------------------
// Submits SQL query from Form to Redshift Data API: 
async function submitQuery() {

  var credentials = await Auth.currentCredentials();

  const redshiftDataClient = new RedshiftData({
    region: state.clusterRegion,
    credentials: Auth.essentialCredentials(credentials)
  });

  var params = {
    ClusterIdentifier: state.clusterIdentifier,
    Sql: state.sql,
    Database: state.database,
    //DbUser: state.dbUser,
    SecretArn: state.secretArn,
    StatementName: state.statementName,
    WithEvent: state.withEvent,
  };

  console.log('Submitting query to Redshift...');
  var response = await redshiftDataClient.executeStatement(params).promise();
  console.log(`Submission accepted. Statement ID:`, response);
  setTimeout(updateStatementHistory, 2000);   // Seems we need to wait a second or two before calling the ListStatements() API, otherwise results don't show latest query:
}

//------------------------------------------------------------------------------
// Form used to submit queries to Redshift: 
const SubmissionForm = view(() => {

  const classes = useStyles();

  return (
    <Widget>
      <h3>Query Submission</h3>
      <RegionSelector value={state.clusterRegion} onChange={(e) => updateState('clusterRegion', e.target.value)}/>
      <br/>
      <TextField
        id="clusterIdentifier"
        label="Cluster Identifier"
        onChange={(e) => updateState('clusterIdentifier', e.target.value)}
        value={state.clusterIdentifier}
      />
      <TextField
        id="database"
        label="Database"
        onChange={(e) => updateState('database', e.target.value)}
        value={state.database} 
      />      
      {
        state.authMethod === OPTIONS.AUTH_METHOD.USER ?
          <TextField
          id="dbUser"
          label="DB User"
          onChange={(e) => updateState('dbUser', e.target.value)}
          value={state.dbUser} 
          />
        :
          <TextField
            id="secretArn"
            label="Secret ARN"
            onChange={(e) => updateState('secretArn', e.target.value)}
            value={state.secretArn} 
          />
      }  
      <FormControl className={classes.formControl}>
        <InputLabel id="withEvent-label">With Event</InputLabel>
        <Select
          labelId="withEvent"
          id="wuthEvent"
          value={state.withEvent}
          onChange={(e) => updateState('withEvent', e.target.value)}
        >
          <MenuItem value={true}>True</MenuItem>
          <MenuItem value={false}>False</MenuItem>

        </Select>
      </FormControl>
      <br/><br/>
      <TextField
        id="statementName"
        label="StatementName"
        onChange={(e) => updateState('statementName', e.target.value)}
        value={state.statementName} 
      />
      <br/><br/>
      <TextField
        id="sql"
        label="sql"
        onChange={(e) => updateState('sql', e.target.value)}
        value={state.sql} 
        fullWidth={true}
        multiline={true}
        rowsMax={10}
        size='small'
      />
      <br/><br/>
      <Button id="submitQuery" variant="contained" color="primary" onClick={submitQuery}>
        Submit query
      </Button>
    </Widget>
  );
});

//------------------------------------------------------------------------------
// Retrieves latest list of Data API executed statements from Redshift.
const updateStatementHistory = () => {

  // TODO: Add logic to handle paginated calls if number of submitted queries
  // is greater than max response size; i.e. we would have to make additional
  // calls via the NextToken value.

  state.statementHistoryMessage = OPTIONS.MESSAGES.LOADING_STATEMENTS;

  Auth.currentCredentials().then(credentials => {
    const redshiftDataClient = new RedshiftData({
      region: state.clusterRegion,
      credentials: Auth.essentialCredentials(credentials)
    });  
    var params = {};
    console.log('Retrieving list of submitted Redshift SQL statements...')
    redshiftDataClient.listStatements(params, (err, data) => {
      if (err) {
        console.log('Error listing Redshift statements: ', err);
        state.statementsLoaded = false;
        state.statementHistoryMessage = `Failed to load statements: ${err.message}`;
      }
      else {
        console.log('SQL Statements:', data.Statements);
        state.statements = data.Statements;
        state.statementsLoaded = true;
      }
    });
  });
}

//------------------------------------------------------------------------------
// Form to show list of previously-executed statements:
const StatementHistory = view(() => {
  
  // TODO: Currently, no logic to paginate history results if total number of statements
  // exceeds the ListStatements() API's result size limit; need to incorporate pagination
  // (either automatic, or by a user clicking something like a "get more..." button);

  const classes = useStyles();
  const CLUSTER_REGION = state.clusterRegion;
 
  // When widget first loads, retrieve latest statement history:
  useEffect(() => {
    updateStatementHistory();
  },[CLUSTER_REGION]);

  // Extract info from statements returned by the ListStatements API and put into a 
  // an object array that matches the format / field names in our rendered HTML table:
  function getStatementRows() {
    var rows = [];
    for (const statement of state.statements) {
      rows.push({
        id: statement.Id,
        statementName: statement.StatementName, 
        status: statement.Status,
        createdAt: simpleDateString(statement.CreatedAt),
        updatedAt: simpleDateString(statement.UpdatedAt),
        sql: statement.QueryString
      });
    }
    return rows;
  }

  function handleStatementResultClick(e, statement) {
    e.preventDefault();
    state.selectedStatementForResults = statement;
    state.showStatementResultDialog = true; 
  }

  function handleStatementResultClose() {
    state.showStatementResultDialog = false; 
  }

  return (
    <Widget>
      <h3>Statements</h3>
      
      <Button id="refreshStatements" variant="contained" color="primary" onClick={updateStatementHistory}>
        Refresh
      </Button>
      
      {state.statementsLoaded ?
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell align="right">Statement Name</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right">Created</TableCell>
                <TableCell align="right">Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getStatementRows().map((row) => (
                <TableRow key={row.id}>
                  <TableCell component="th" scope="row">
                    {row.id}
                  </TableCell>
                  <TableCell align="right">{row.statementName}</TableCell>
                  {
                    row.status === OPTIONS.STATEMENT_STATUS.FINISHED ?
                      <TableCell align="right"><Link href="" onClick={e => handleStatementResultClick(e, row)}>{row.status}</Link></TableCell>
                    :
                      <TableCell align="right">{row.status}</TableCell>
                  }                 
                  <TableCell align="right">{row.createdAt}</TableCell>
                  <TableCell align="right">{row.updatedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        :
        state.statementHistoryMessage
      }
      {state.showStatementResultDialog ? 
        <StatementResultViewer open={true} onClose={handleStatementResultClose} />
        :
        null
      }
       
    </Widget>
  );

});

//------------------------------------------------------------------------------
// Dialog to show results of a specific statement the user has selected: 
const StatementResultViewer = view((props) => {

  const { onClose, open } = props;
  const { id, statementName, sql, createdAt } = state.selectedStatementForResults;  

  useEffect(() => {
    if (id !== undefined) {
      Auth.currentCredentials().then(credentials => {
        const redshiftDataClient = new RedshiftData({
          region: state.clusterRegion,
          credentials: Auth.essentialCredentials(credentials)
        });  
        var params = {
          Id: id
        };
        console.log(`Retrieving results of statement ${id}...`)
        redshiftDataClient.getStatementResult(params, (err, data) => {
          if (err) {
            console.log('Error getting statement results: ', err);
          }
          else {
            console.log('Statement results:', data);
            state.statementResults.columns = data.ColumnMetadata;
            state.statementResults.rows = data.Records;
            state.statementResults.rowCount = data.TotalNumRows;
          }
        });
      });
    }
  },[id]);

  const classes = useStyles();

  const handleClose = () => {
    onClose();
  };

  function renderColumnCells() {
    var cells = [];

    state.statementResults.columns.forEach(function(column, index) {
      cells.push( <TableCell key={`resultColumn-${index}`}>{column.name}</TableCell>);
    });
    return cells;
  }

  function renderRows() {
    
    function renderCells(row, rowNumber) {
      return row.map((cell,index) => {
        // Each cell value within a row will have a different object key depending on the data type, e.g. {booleanValue: true } or { longValue: 1.2343};
        // Rather than put in logic for each key type, we just select whatever the first key is: 
        return <TableCell key={`statementRow${rowNumber}_cell${index}`} align="right">{cell[Object.keys(cell)[0]]}</TableCell>
      });
    }

    var rows = state.statementResults.rows.map((row, index) => {
      return (
        <TableRow key={`statementRow${index}`}>
          {renderCells(row, index)}
        </TableRow>
      );
    });

    return rows;
  }

  return (
    <Dialog fullWidth={true} maxWidth={"lg"} onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">Statement Result Viewer</DialogTitle>

      <b>ID:</b> {id} <br/>
      <b>Name:</b> {statementName} <br/>
      <b>SQL:</b> {sql} <br/>
      <b>Created:</b> {createdAt} <br/><br/>

      <Button id="closeStatementResultView" variant="contained" color="primary" onClick={onClose}>
        Close
      </Button>
      <br/><br/>
      <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                {renderColumnCells()}
              </TableRow>
            </TableHead>
            <TableBody>
              {renderRows()}
            </TableBody>
          </Table>
        </TableContainer>
    </Dialog>
  );
});

//------------------------------------------------------------------------------
// Update local state as well as save value to localStorage:
function updateState(key, value) {
  state[key] = value;
  var localKey = `redshift-data-api-widget-${key}`;
  //console.log(`Setting ${localKey} = `, value);
  localStorage.setItem(localKey, value);
}

//------------------------------------------------------------------------------
// Helper to give simple date formats:
const simpleDateString = (dateObject) => {
  return dateformat(dateObject, "yyyy-mm-dd h:MM:ss");
}

export default view(RedshiftDataApi); 