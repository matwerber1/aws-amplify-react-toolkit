import React, { useEffect, useRef } from 'react';
import { Auth } from 'aws-amplify';
import Widget from './widget.js';
import { store, view } from '@risingstack/react-easy-state';
import KinesisVideo from 'aws-sdk/clients/kinesisvideo';
import KinesisVideoSignalingChannels from 'aws-sdk/clients/kinesisvideosignalingchannels';
import { SignalingClient } from 'amazon-kinesis-video-streams-webrtc';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import useStyles from '../common/material-ui-styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';


// Used to determine / validate options in form components:
const OPTIONS = {
  TRAVERSAL: {
    STUN_TURN: 'stunTurn',
    TURN_ONLY: 'turnOnly',
    DISABLED: 'disabled'
  },
  ROLE: {
    MASTER: 'MASTER',
    VIEWER: 'VIEWER'
  },
  RESOLUTION: {
    WIDESCREEN: 'widescreen',
    FULLSCREEN: 'fullscreen'
  }
};

// Stores state across components (react-easy-state is super easy to use!)
const state = store({
  region: 'us-west-2',
  role: OPTIONS.ROLE.MASTER,
  channelName: 'ScaryTestChannel',
  clientId: getRandomClientId(),
  endpoint: null,
  sendVideo: true,
  sendAudio: true,
  openDataChannel: true,
  resolution: OPTIONS.RESOLUTION.WIDESCREEN,
  natTraversal: OPTIONS.TRAVERSAL.STUN_TURN,
  useTrickleICE: false,

  localStream: null,
  localView: null,
  remoteView: null,
  peerConnectionByClientId: [],
  peerConnectionStatsInterval: null,
  dataChannel: null
});

//------------------------------------------------------------------------------
// Main component entry point:
const KinesisWebRTC = () => {

  // In order to modify properties of our <video> components, we need a reference
  // to them in the DOM; first, we declare set them up with the useRef hook. 
  // Later, when we render the <VideoPlayers/> component, we include this reference
  // in the component definition. Finally, we can reference the object properties
  // by state.localView.current.<PROPERTY>:
  state.localView = useRef(null);
  state.remoteView = useRef(null);

  // When widget first loads, get saved state values from localStorage:
  useEffect(() => {
    for (const [key] of Object.entries(state)) {
      var localStorageValue = localStorage.getItem(`kvs-widget-${key}`);
      if (localStorageValue) {
        // Convert true or false strings to boolean (needed for checkboxes):
        if (["true", "false"].includes(localStorageValue)) {
          localStorageValue = localStorageValue === "true";
        }

        //console.log(`Setting ${key} = `, localStorageValue);
        state[key] = localStorageValue;
      }
    }
  }, []);

  return (
    <Widget>
      <h2>Kinesis WebRTC</h2>
      <ConfigurationForm/>
      <br /><br />
      <VideoPlayers/>
    </Widget>
  );
  
};


//------------------------------------------------------------------------------
// Fired when user clicks start player button; will esablish connection to KVS,
// start streaming video from client and showing video back from other side:
async function startPlayer() {

  console.log(`role is '${state.role}'`)
  if (state.role === OPTIONS.ROLE.MASTER) {
    startPlayerForMaster();
  }
  else {
    startPlayerForViewer();
  }
}

//------------------------------------------------------------------------------
// Start Player in Master mode
async function startPlayerForMaster() {

  var credentials = await Auth.currentCredentials();
  
  // Create KVS client
  console.log('Creating KVS client...');
  const kinesisVideoClient = new KinesisVideo({
    region: state.region,
    credentials: Auth.essentialCredentials(credentials),
    endpoint: state.endpoint || null,
    correctClockSkew: true,
  });

  // Get signaling channel ARN
  console.log('Getting signaling channel ARN...');
  const describeSignalingChannelResponse = await kinesisVideoClient
    .describeSignalingChannel({
        ChannelName: state.channelName,
    })
    .promise();
  
  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log('[MASTER] Channel ARN: ', channelARN);

  // Get signaling channel endpoints:
  console.log('Getting signaling channel endpoints...');
  const getSignalingChannelEndpointResponse = await kinesisVideoClient
    .getSignalingChannelEndpoint({
        ChannelARN: channelARN,
        SingleMasterChannelEndpointConfiguration: {
            Protocols: ['WSS','HTTPS'],
            Role: state.role, //roleOption.MASTER
        },
  })
  .promise();
  
  const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
    endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
    return endpoints;
  }, {});  
  console.log('[MASTER] Endpoints: ', endpointsByProtocol);

  // Create Signaling Client
  console.log(`Creating signaling client...`);
  const signalingClient = new SignalingClient({
    channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    credentials: Auth.essentialCredentials(credentials),
    role: state.role, //roleOption.MASTER
    region: state.region,
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
  });
  
  // Get ICE server configuration
  console.log('Creating ICE server configuration...');
  const kinesisVideoSignalingChannelsClient = new KinesisVideoSignalingChannels({
    region: state.region,
    credentials: Auth.essentialCredentials(credentials),
    endpoint: endpointsByProtocol.HTTPS,
    correctClockSkew: true,
  });

  console.log('Getting ICE server config...');
  const getIceServerConfigResponse = await kinesisVideoSignalingChannelsClient
        .getIceServerConfig({
            ChannelARN: channelARN,
        })
    .promise();
  
  const iceServers = [];
  if (state.natTraversal === OPTIONS.TRAVERSAL.STUN_TURN) {
    console.log('Getting STUN servers...');
    iceServers.push({ urls: `stun:stun.kinesisvideo.${state.region}.amazonaws.com:443` });
  }
  
  if (state.natTraversal !== OPTIONS.TRAVERSAL.DISABLED) {
    console.log('Getting TURN servers...');
    getIceServerConfigResponse.IceServerList.forEach(iceServer =>
      iceServers.push({
        urls: iceServer.Uris,
        username: iceServer.Username,
        credential: iceServer.Password,
      }),
    );
  }
  
  const configuration = {
    iceServers,
    iceTransportPolicy: (state.natTraversal === OPTIONS.TRAVERSAL.TURN_ONLY) ? 'relay' : 'all',
  };

  const resolution = (state.resolution === OPTIONS.TRAVERSAL.WIDESCREEN) ? { width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 640 }, height: { ideal: 480 } };

  const constraints = {
      video: state.sendVideo ? resolution : false,
      audio: state.sendAudio,
  };

  // Get a stream from the webcam and display it in the local view. 
  // If no video/audio needed, no need to request for the sources. 
  // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
  if (state.sendVideo || state.sendAudio) {
    try {
      console.log('Getting user media stream...');
      state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      state.localView.current.srcObject = state.localStream;
      //localView.current.srcObject = appStore.master.localStream;

    } catch (e) {
      console.log('Error: ', e);
      console.error('[MASTER] Could not find webcam');
    }
  }

  console.log('Adding signalingClient.on open handler...');
  signalingClient.on('open', async () => {
    console.log('[MASTER] Connected to signaling service');
  });

  console.log('Adding signalingClient.on sdpOffer handler...');
  signalingClient.on('sdpOffer', async (offer, remoteClientId) => {
    console.log('[MASTER] Received SDP offer from client: ' + remoteClientId);

    // Create a new peer connection using the offer from the given client
    const peerConnection = new RTCPeerConnection(configuration);
    state.peerConnectionByClientId[remoteClientId] = peerConnection;

    if (state.openDataChannel) {
      state.dataChannelByClientId[remoteClientId] = peerConnection.createDataChannel('kvsDataChannel');
      peerConnection.ondatachannel = event => {
        //event.channel.onmessage = onRemoteDataMessage;
      };
    }

    // Poll for connection stats
    if (!state.peerConnectionStatsInterval) {
      state.peerConnectionStatsInterval = setInterval(() => peerConnection.getStats().then(onStatsReport), 1000);
    }

    // Send any ICE candidates to the other peer
    peerConnection.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        console.log('[MASTER] Generated ICE candidate for client: ' + remoteClientId);

        // When trickle ICE is enabled, send the ICE candidates as they are generated.
        if (state.useTrickleICE) {
          console.log('[MASTER] Sending ICE candidate to client: ' + remoteClientId);
          signalingClient.sendIceCandidate(candidate, remoteClientId);
        }
      } else {
        console.log('[MASTER] All ICE candidates have been generated for client: ' + remoteClientId);

        // When trickle ICE is disabled, send the answer now that all the ICE candidates have ben generated.
        if (!state.useTrickleICE) {
          console.log('[MASTER] Sending SDP answer to client: ' + remoteClientId);
          signalingClient.sendSdpAnswer(peerConnection.localDescription, remoteClientId);
        }
      }
    });
  
    // As remote tracks are received, add them to the remote view
    console.log('Adding peerConnection listener for "track"...');
    
    peerConnection.addEventListener('track', event => {
      console.log('[MASTER] Received remote track from client: ' + remoteClientId);
      if (state.remoteView.current.srcObject) {
        return;
      }
        
      state.remoteView.current.srcObject = event.streams[0];
    });

    // If there's no video/audio, master.localStream will be null. So, we should skip adding the tracks from it.
    if (state.localStream) {
      console.log("There's no audio/video...");
      state.localStream.getTracks().forEach(track => peerConnection.addTrack(track, state.localStream));
    }
    await peerConnection.setRemoteDescription(offer);

    // Create an SDP answer to send back to the client
    console.log('[MASTER] Creating SDP answer for client: ' + remoteClientId);
    await peerConnection.setLocalDescription(
      await peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      }),
    );

    // When trickle ICE is enabled, send the answer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
    if (state.useTrickleICE) {
      console.log('[MASTER] Sending SDP answer to client: ' + remoteClientId);
      signalingClient.sendSdpAnswer(peerConnection.localDescription, remoteClientId);
    }
    console.log('[MASTER] Generating ICE candidates for client: ' + remoteClientId);

  });

  signalingClient.on('iceCandidate', async (candidate, remoteClientId) => {
    console.log('[MASTER] Received ICE candidate from client: ' + remoteClientId);

    // Add the ICE candidate received from the client to the peer connection
    const peerConnection = state.peerConnectionByClientId[remoteClientId];
    peerConnection.addIceCandidate(candidate);
  });

  signalingClient.on('close', () => {
      console.log('[MASTER] Disconnected from signaling channel');
  });

  signalingClient.on('error', () => {
      console.error('[MASTER] Signaling client error');
  });

  console.log('[MASTER] Starting master connection');
  signalingClient.open();    

}
  
  //------------------------------------------------------------------------------
// Start Player in Viewer mode
async function startPlayerForViewer() {

  var credentials = await Auth.currentCredentials();
  
  // Create KVS client
  console.log('Created KVS client...');
  const kinesisVideoClient = new KinesisVideo({
    region: state.region,
    credentials: Auth.essentialCredentials(credentials),
    endpoint: state.endpoint || null,
    correctClockSkew: true,
  });

  // Get signaling channel ARN
  console.log('Getting signaling channel ARN...');
  const describeSignalingChannelResponse = await kinesisVideoClient
    .describeSignalingChannel({
        ChannelName: state.channelName,
    })
    .promise();
  
  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log('[VIEWER] Channel ARN: ', channelARN);

  // Get signaling channel endpoints:
  console.log('Getting signaling channel endpoints...');
  const getSignalingChannelEndpointResponse = await kinesisVideoClient
    .getSignalingChannelEndpoint({
        ChannelARN: channelARN,
        SingleMasterChannelEndpointConfiguration: {
            Protocols: ['WSS','HTTPS'],
            Role: state.role, //roleOption.MASTER
        },
  })
  .promise();
  
  const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
    endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
    return endpoints;
  }, {});  
  console.log('[VIEWER] Endpoints: ', endpointsByProtocol);

  // Create Signaling Client
  console.log(`Creating signaling client...`);
  const signalingClient = new SignalingClient({
    channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    credentials: Auth.essentialCredentials(credentials),
    role: state.role, //roleOption.MASTER
    region: state.region,
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
    clientId: state.clientId
  });
  
  // Get ICE server configuration
  console.log('Creating ICE server configuration...');
  const kinesisVideoSignalingChannelsClient = new KinesisVideoSignalingChannels({
    region: state.region,
    credentials: Auth.essentialCredentials(credentials),
    endpoint: endpointsByProtocol.HTTPS,
    correctClockSkew: true,
  });

  console.log('Getting ICE server config response...');
  const getIceServerConfigResponse = await kinesisVideoSignalingChannelsClient
        .getIceServerConfig({
            ChannelARN: channelARN,
        })
    .promise();
  
  const iceServers = [];
  if (state.natTraversal === OPTIONS.TRAVERSAL.STUN_TURN) {
    console.log('Getting STUN servers...');
    iceServers.push({ urls: `stun:stun.kinesisvideo.${state.region}.amazonaws.com:443` });
  }
  
  if (state.natTraversal !== OPTIONS.TRAVERSAL.DISABLED) {
    console.log('Getting TURN servers...');
    getIceServerConfigResponse.IceServerList.forEach(iceServer =>
      iceServers.push({
        urls: iceServer.Uris,
        username: iceServer.Username,
        credential: iceServer.Password,
      }),
    );
  }
  
  const configuration = {
    iceServers,
    iceTransportPolicy: (state.natTraversal === OPTIONS.TRAVERSAL.TURN_ONLY) ? 'relay' : 'all',
  };

  const resolution = (state.resolution === OPTIONS.TRAVERSAL.WIDESCREEN) ? { width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 640 }, height: { ideal: 480 } };

  const constraints = {
      video: state.sendVideo ? resolution : false,
      audio: state.sendAudio,
  };

  state.peerConnection = new RTCPeerConnection(configuration);
  if (state.openDataChannel) {
      state.dataChannel = state.peerConnection.createDataChannel('kvsDataChannel');
      state.peerConnection.ondatachannel = event => {
          //event.channel.onmessage = onRemoteDataMessage;
      };
  }

  // Poll for connection stats
  state.peerConnectionStatsInterval = setInterval(() => state.peerConnection.getStats().then(onStatsReport), 1000);

  /// REVIEW BELOW HERE

  signalingClient.on('open', async () => {
    console.log('[VIEWER] Connected to signaling service');

    // Get a stream from the webcam, add it to the peer connection, and display it in the local view.
    // If no video/audio needed, no need to request for the sources. 
    // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
    if (state.sendVideo || state.sendAudio) {
        try {
            state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            state.localStream.getTracks().forEach(track => state.peerConnection.addTrack(track, state.localStream));
            state.localView.current.srcObject = state.localStream;
        } catch (e) {
            console.error('[VIEWER] Could not find webcam');
            return;
        }
    }

    // Create an SDP offer to send to the master
    console.log('[VIEWER] Creating SDP offer');
    await state.peerConnection.setLocalDescription(
        await state.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        }),
    );

    // When trickle ICE is enabled, send the offer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
    if (state.useTrickleICE) {
        console.log('[VIEWER] Sending SDP offer');
        signalingClient.sendSdpOffer(state.peerConnection.localDescription);
    }
    console.log('[VIEWER] Generating ICE candidates');
});

signalingClient.on('sdpAnswer', async answer => {
    // Add the SDP answer to the peer connection
    console.log('[VIEWER] Received SDP answer');
    await state.peerConnection.setRemoteDescription(answer);
});

signalingClient.on('iceCandidate', candidate => {
    // Add the ICE candidate received from the MASTER to the peer connection
    console.log('[VIEWER] Received ICE candidate');
    state.peerConnection.addIceCandidate(candidate);
});

signalingClient.on('close', () => {
    console.log('[VIEWER] Disconnected from signaling channel');
});

signalingClient.on('error', error => {
    console.error('[VIEWER] Signaling client error: ', error);
});

// Send any ICE candidates to the other peer
state.peerConnection.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) {
        console.log('[VIEWER] Generated ICE candidate');

        // When trickle ICE is enabled, send the ICE candidates as they are generated.
        if (state.useTrickleICE) {
            console.log('[VIEWER] Sending ICE candidate');
            signalingClient.sendIceCandidate(candidate);
        }
    } else {
        console.log('[VIEWER] All ICE candidates have been generated');

        // When trickle ICE is disabled, send the offer now that all the ICE candidates have ben generated.
        if (!state.useTrickleICE) {
            console.log('[VIEWER] Sending SDP offer');
            signalingClient.sendSdpOffer(state.peerConnection.localDescription);
        }
    }
});

// As remote tracks are received, add them to the remote view
state.peerConnection.addEventListener('track', event => {
    console.log('[VIEWER] Received remote track');
    if (state.remoteView.current.srcObject) {
        return;
    }
    state.remoteStream = event.streams[0];
    state.remoteView.current.srcObject = state.remoteStream;
});

console.log('[VIEWER] Starting viewer connection');
signalingClient.open();
  
}

//------------------------------------------------------------------------------
function onStatsReport(report) {
  // TODO: Publish stats
}

//------------------------------------------------------------------------------
// Form for user to provide KVS configuration settings before starting video:
const ConfigurationForm = view(() => {

  const classes = useStyles();
  return (
    <Widget>
    <TextField
        id="region"
        label="Region"
        onChange={(e) => updateState('region', e.target.value)}
        value={state.region} 
      />
      
      <TextField
        id="channelName"
        label="Channel name"
        onChange={(e) => updateState('channelName', e.target.value)}
        value={state.channelName} 
      />
      
      <TextField
        id="clientId"
        label="Client ID"
        onChange={(e) => updateState('clientId', e.target.value)}
        value={state.clientId} 
      />
      
      <FormControl className={classes.formControl}>
        <InputLabel id="nat-label">NAT Traversal</InputLabel>
        <Select
          labelId="NAT-Traversal"
          id="nat-traversal"
          value={state.natTraversal}
          onChange={(e) => updateState('natTraversal', e.target.value)}
        >
          <MenuItem value={OPTIONS.TRAVERSAL.STUN_TURN}>STUN/TURN</MenuItem>
          <MenuItem value={OPTIONS.TRAVERSAL.TURN_ONLY}>TURN Only (force cloud relay)</MenuItem>
          <MenuItem value={OPTIONS.TRAVERSAL.DISABLED}>Disabled</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Checkbox color="primary" checked={state.useTrickleICE} onChange={(e) => updateState('useTrickleICE', e.target.checked) }/>}
          label="Trickle ICE"
          labelPlacement="top"
      />
      <FormControl className={classes.formControl}>
        <InputLabel id="resolution-label">Resolution</InputLabel>
        <Select
          labelId="resolution"
          id="resolution"
          value={state.resolution}
          onChange={(e) => updateState('resolution', e.target.value)}
        >
          <MenuItem value={OPTIONS.RESOLUTION.WIDESCREEN}>1280x720 (16:9 widescreen)</MenuItem>
          <MenuItem value={OPTIONS.RESOLUTION.FULLSCREEN}>640x480 (4:3 fullscreen)</MenuItem>

        </Select>
      </FormControl>
      <FormControl className={classes.formControl}>
        <InputLabel id="role-label">Role</InputLabel>
        <Select
          labelId="role"
          id="role"
          value={state.role}
          onChange={(e) => updateState('role', e.target.value)}
        >
          <MenuItem value={OPTIONS.ROLE.MASTER}>Master</MenuItem>
          <MenuItem value={OPTIONS.ROLE.VIEWER}>Viewer</MenuItem>
        </Select>
      </FormControl>
      <br /><br/>
      <FormControlLabel
        control={<Checkbox color="primary" checked={state.sendVideo} onChange={(e) => updateState('sendVideo', e.target.checked) }/>}
          label="Send video"
          labelPlacement="top"
      />
      <FormControlLabel
          control={<Checkbox color="primary" checked={state.sendAudio} onChange={(e) => updateState('sendAudio', e.target.checked) } />}
          label="Send audio"
          labelPlacement="top"
      />
      <FormControlLabel
        control={<Checkbox color="primary" checked={state.openDataChannel} onChange={(e) => updateState('openDataChannel', e.target.checked) } />}
          label="Data channel"
          labelPlacement="top"
      />
      <br /><br/>
      <Button id="startPlayer" variant="contained" color="primary" onClick={startPlayer}>
        Start player
      </Button>
    </Widget>
  );
  
});

//------------------------------------------------------------------------------
// Update local state as well as save value to localStorage:
const VideoPlayers = view(() => {

  return (
    <Widget>
      <div id="video-players" className="d-none">
        <div className="row">
          <div className="col">
            <h5>Output channel</h5>
            <div className="video-container">
              <video
                className="output-view"
                ref={state.localView}
                autoPlay playsInline controls muted
              />
            </div>
          </div>

          <div className="col">
            <h5>return Channel</h5>
            <div className="video-container">
              <video
                className="return-view"
                ref={state.remoteView}
                autoPlay playsInline controls 
              />
            </div>
          </div>
        </div>

        <div className="row datachannel">
          <div className="col">
            <div className="form-group">
              <textarea type="text" className="form-control local-message" placeholder="DataChannel Message"/>
            </div>
          </div>
          <div className="col">
            <div className="card bg-light mb-3">
              <pre className="remote-message card-body text-monospace preserve-whitespace"></pre>
            </div>
          </div>
        </div>

        <div>
          <span className="send-message datachannel">
            <button type="button" className="btn btn-primary">Send DataChannel Message</button>
          </span>
        </div>
      </div>
    </Widget>
  );
  
});
//------------------------------------------------------------------------------
// Update local state as well as save value to localStorage:
function updateState(key, value) {
  state[key] = value;
  var localKey = `kvs-widget-${key}`;
  //console.log(`Setting ${localKey} = `, value);
  localStorage.setItem(localKey, value);
}

//------------------------------------------------------------------------------
// If user doesn't provide a client ID for VIEWER mode, we generate one for them:
function getRandomClientId() {
  return Math.random()
      .toString(36)
      .substring(2)
      .toUpperCase();
}

export default KinesisWebRTC; 