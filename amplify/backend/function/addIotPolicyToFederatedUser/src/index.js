 /* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */
const aws = require('aws-sdk');
const iot = new aws.Iot();
const cognito = new aws.CognitoIdentityServiceProvider();

// This should be changed to dynamically assigned by a function env variable:
const IOT_POLICY = 'amplify-toolkit-iot-message-viewer';

// This should match what you have configured as a custom attribute in your user pool:
const COGNITO_ATTRIBUTE_NAME = 'custom:iotPolicyIsAttached';


/**
 * Lambda function is invoked by a Cognito Federated User via API Gateway. The function
 * parses the event input to determine the user's federated identity ID and user pool ID,
 * attaches an IoT policy to the user, and updates the user's user pool attributes to 
 * set ioTPolicyIsAttached = true. The client-side app inspect this user attribute value when
 * the user signs in (or attempts to use AWS IoT) to determine whether or not this function
 * needs to be invoked first.
 * @param {*} event - event provided by API Gateway to invoke the Lambda function
 */
exports.handler = async (event) => {
    
    var responseMessage = "";

    try {
      var identityId = event.requestContext.identity.cognitoIdentityId;
      var cognitoAuthenticationProvider = event.requestContext.identity.cognitoAuthenticationProvider;
      
      await attachIoTPolicyToFederatedIdentity(IOT_POLICY, identityId);
      
      var { userPoolId, username } = await getUserPoolInfoFromAuthProviderString(cognitoAuthenticationProvider);
      await updateUserPoolAttribute(userPoolId, username);
      
      responseMessage = `IoT Policy ${IOT_POLICY} attached to Cognito federated identity ID ${identityId}`;
    }
    catch (error) {
      responseMessage = error.message;
    }

    var responseBody = {
      msg: responseMessage
    };

    const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }, 
        body: JSON.stringify(responseBody, null, 2),
        
    };
    return response;
};


/**
 * Attach an IoT Policy to a Cognito federated user ID
 * @param {*} policyName Name of an IoT Policy to attach to a federated identity
 * @param {*} target The Federated Identity Pool ID of the user to attach the policy to
 */
async function attachIoTPolicyToFederatedIdentity(policyName, target) {
    
    console.log(`Attaching ${policyName} IoT policy to federated ID ${target}...`);
    await iot.attachPolicy({policyName, target}).promise();
    
}
 
 /**
  * When API Gateway with IAM authentication sends a request to Lambda that was invoked
  * by an Cognito Federated Identity user, the request parameters contain an authProvider
  * string that can be parsed to get the user's Cognito User Pool "sub" user ID. This user
  * ID can then be used with the ListUsers() API to find the user's username:
  * @param {*} authProviderString - The event.requestContext.identity.cognitoAuthenticationProvider value provided by API Gateway in the invocation event
  */
async function getUserPoolInfoFromAuthProviderString(authProviderString) {
    
    console.log(`Extracting Cognito user ID (aka 'sub') from auth string ${authProviderString}...`);

    var parts = authProviderString.split(':');
    var userPoolIdParts = parts[parts.length - 3].split('/');
    var userPoolId = userPoolIdParts[userPoolIdParts.length - 1];
    var userPoolUserId = parts[parts.length - 1];
    
    // The userPoolUserId is the "sub" attribute. We need to find the user's name from this value:
    var userFilter = `sub = \"${userPoolUserId}\"`;
    
    var params = {
        UserPoolId: userPoolId,
        AttributesToGet: [],
      Filter: userFilter,
      Limit: 1,
    };
    
    console.log(`Calling Cognito.listUsers() to find username from user ID ${userPoolUserId}...`);
    var response = await cognito.listUsers(params).promise();
    var username = response.Users[0].Username;
    console.log(`Username is ${username}...`);
    
    return { userPoolId, username };
}


/**
 * Update the user attribute COGNITO_ATTRIBUTE_NAME to "true"
 * @param {*} userPoolId - the Cognito User Pool ID
 * @param {*} username - the Cognito User Pool username (not sub)
 */
async function updateUserPoolAttribute(userPoolId, username) {
    
    console.log(`Setting user attribute ${COGNITO_ATTRIBUTE_NAME} to "true"...`);
    
    var params = {
        UserAttributes: [ 
            {
                Name: COGNITO_ATTRIBUTE_NAME,
                Value: "true"
            }
      ],
      UserPoolId: userPoolId,
      Username: username
    };
    
    await cognito.adminUpdateUserAttributes(params).promise();

}