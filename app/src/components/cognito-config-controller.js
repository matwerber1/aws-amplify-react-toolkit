import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import SettingsIcon from '@material-ui/icons/Settings';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { view } from '@risingstack/react-easy-state';
import appStore from './app-store';
import { authStates } from './auth-states';
import CustomAuthenticator from './custom-authenticator';
import 'cross-fetch/polyfill';


// Display a "Configure Cognito" link which, when clicked, opens a dialogue 
// box where user can enter their cognito user pool, client ID, etc.
const CognitoConfigController = view(() => {

  const [showCognitoConfig, setShowCognitoConfig] = useState(false);
  const toggleShowCognitoConfig = () => {
    setShowCognitoConfig(!showCognitoConfig);
  }
  
  return (
    <React.Fragment>
      <Grid
        container
        direction="row"
        justify="flex-end"
        alignItems="center"
      >
        {(appStore.cognito.authState === authStates.signIn || !appStore.cognito.configIsComplete) ?
          <React.Fragment>
            <CognitoConfigureLink clickAction={toggleShowCognitoConfig} />
            <CognitoConfigureDialog
              showDialog={showCognitoConfig}
              toggleDialog={toggleShowCognitoConfig} 
            />
          </React.Fragment>
          : null
        }
        {appStore.cognito.authState === authStates.signedIn ?
          <CustomAuthenticator displayType='logout' />
        : null
        }
      </Grid>
    </React.Fragment>
  );
});


const CognitoConfigureLink = view(({ clickAction }) => {
  return (
    <Grid item>
      <SettingsIcon fontSize="small" />
      <Link href="#" onClick={clickAction}>
        Configure Cognito User Pool & Identity Pool
      </Link>
    </Grid>
  );
});

const CognitoConfigureDialog = view(({ showDialog, toggleDialog }) => {

  const [dialogValues, setDialogValues] = useState(appStore.cognito.config);

  function updateDialogValue(key, value) {
    // We have to copy the object rather than just use its pointer
    let newValues = Object.assign({}, dialogValues);
    newValues[key] = value;
    setDialogValues(newValues);
  }

  function closeDialogWithSave() {
    appStore.cognito.config = dialogValues;
    console.log('Wrote cognito config to appStore:', dialogValues);
    
    appStore.saveStateToCookies();
    appStore.cognito.checkConfigIsComplete();
    closeDialog();
  }

  function closeDialogWithoutSave() {
    setDialogValues(appStore.cognito.config);
    closeDialog();
  }

  function closeDialog() {
    toggleDialog();
  }

  return (
    <Dialog open={showDialog} onClose={closeDialogWithoutSave} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Cognito Configuration</DialogTitle>
      <DialogContent>
        <DialogContentText>
          In order to log in to your Cognito User Pool, please enter the required information below:
          </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="userPoolId"
          label="Cognito User Pool ID"
          onChange={ev => updateDialogValue('userPoolId', ev.target.value)}
          value={dialogValues.userPoolId}
          fullWidth
        />
        <TextField
          margin="dense"
          id="clientId"
          label="Cognito Client ID"
          onChange={ev => updateDialogValue('clientId', ev.target.value)}
          value={dialogValues.clientId}
          fullWidth
        />
        <TextField
          margin="dense"
          id="identityPoolId"
          label="Cognito Identity Pool ID"
          fullWidth
          onChange={ev => updateDialogValue('identityPoolId', ev.target.value)}
          value={dialogValues.identityPoolId}
        />
        <TextField
          margin="dense"
          id="region"
          label="Cognito AWS Region"
          fullWidth
          onChange={ev => updateDialogValue('region', ev.target.value)}
          value={dialogValues.region}
        />
      </DialogContent>
       <DialogActions>
        <Button onClick={closeDialogWithoutSave} color="primary">
          Cancel
          </Button>
        <Button onClick={closeDialogWithSave} color="primary">
          Save
          </Button>
      </DialogActions>
    </Dialog>
  );
});

export default CognitoConfigController; 