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



// Events received from API Gateway using IAM Authentication look like this: 
/*
{
    "resource": "/demo",
    "path": "/demo",
    "httpMethod": "GET",
    "headers": {
        "Accept": "application/json, text/plain, ",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Is-Desktop-Viewer": "true",
        "CloudFront-Is-Mobile-Viewer": "false",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Tablet-Viewer": "false",
        "CloudFront-Viewer-Country": "US",
        "Host": "ghl9weghc7.execute-api.us-west-2.amazonaws.com",
        "origin": "http://localhost:3000",
        "Referer": "http://localhost:3000/",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36",
        "Via": "2.0 1ec2938341958d70d56193d709c89def.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "UeyJVG96oTb8lrvXp0lns2K-xmJGBH5wgXgW-fIqH8ziKBtuv_8XZg==",
        "x-amz-date": "20201205T010327Z",
        "x-amz-security-token": "IQoJb3JpZ2luX2VjEFkaCXVzLXdlc3QtMiJIMEYCIQC1LQZhkM8AwmkCbsoHD2/pDTfmtHyh8wQTHDKzDy56qgIhALngVcs5JHbC3Zg0GakhLxFfWQI/fUQc7bxWyANL+d8+Ks0ECOL//////////wEQAhoMNTQ0OTQxNDUzNjYwIgzPOcNr8swW0bWwcZEqoQSKgcfSUE4FjCyaf2HJoWDZNnXaWX3pjC1z26hcI25LGB7emiO/5KgWi/XBL09sMmH1iQxGnKHZWfUlTvAbLMn2EUdRx1DLCws8YRpob4OHuHbv6Lu7A+jyCNyRhyuaWAbLGxlouEnVTwSVcq2BKB6NfuKOBS87Q6QsuwtIbF6egF8P8kgLWSqgpiPxmtt+0rfpenAcixytUrdf89zuX4Zp3s2lm3CUzRqrVCcEf8utR0IF68VvMTfciJrdluA47+uHfZ7ZJAnjTAj97S1ZXhZ5kWE69U/SxaaaDiyhjsxCbd4O3/OAOq9Vj+4ihC4HOgkaBJIH+6NtAfO/WcFlD2fK5mqz6crMU5JfFW1Nu6NOpBuj1E/M4zshX6/tW5TW7/ZQl9H0xKKgKPl6izh29Dzojc59UGY/oLEp/PPtja3017lKcPc+aiwhV/5bznlyFfr6HBXmeVUpSL9pYMJgRF4CvERRJTOqZOW+YVqzgwxRZNA43NBV1E2OOMyAIGE+xKVM0Xfb7HJXdermnWlLfEbPiMFRaR/51LNpewrmmJAGbV2FpnLqLQAO+wGlUYW+Dt48HOHxYCkFYDxmsxuycFwiULT4JRxA5LRT8OAfaOWM3uxAzgdjlB4g39jp/7PGfSrhnsDLYsACg415krBBvQP6Jx06fbQs/K2vYceCOZ3K6IHLkuh8RgiOl2GzQFii7tEnFdPxZluxp+6rZ3wEgE171zDfuKv+BTqEAhgxDQhfBmcI3O00VWGFDsdiLwgin7dBHHk5veJIPbxkAkNzUXUJbdv/nyd0TEXYjGgt6e0ufYGsVaS3ChUqRvdT7xw/778AN3hXRUMFgVc/AhTSegrNcqDhZ8snXxUQexPJ5CY9xLcCaYncK3c0R+20mnWsLf1k403ivzVuIyfPMqb4nejIU2qxrKRRse63zHuKZe/g43x1eLK7BQkRHwrWw7TyNYIvbbpFXgN8+sAjgDIvJFz8wBVYSeue1mMnKPtG31dZNWo9GfRisvFl6Yu/Yr1S2UNqMfPtCIW3iqsiIChuTOYMeKtykC4/spK83ls/sa07DRDL+bTkbr9sKkz3zq1p",
        "X-Amzn-Trace-Id": "Root=1-5fcadc5f-787931785dea2be57e96c23c",
        "X-Forwarded-For": "73.140.151.157, 64.252.140.92",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders": {
        "Accept": [
            "application/json, text/plain,"
        ],
        "Accept-Encoding": [
            "gzip, deflate, br"
        ],
        "Accept-Language": [
            "en-US,en;q=0.9"
        ],
        "CloudFront-Forwarded-Proto": [
            "https"
        ],
        "CloudFront-Is-Desktop-Viewer": [
            "true"
        ],
        "CloudFront-Is-Mobile-Viewer": [
            "false"
        ],
        "CloudFront-Is-SmartTV-Viewer": [
            "false"
        ],
        "CloudFront-Is-Tablet-Viewer": [
            "false"
        ],
        "CloudFront-Viewer-Country": [
            "US"
        ],
        "Host": [
            "ghl9weghc7.execute-api.us-west-2.amazonaws.com"
        ],
        "origin": [
            "http://localhost:3000"
        ],
        "Referer": [
            "http://localhost:3000/"
        ],
        "sec-fetch-dest": [
            "empty"
        ],
        "sec-fetch-mode": [
            "cors"
        ],
        "sec-fetch-site": [
            "cross-site"
        ],
        "User-Agent": [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
        ],
        "Via": [
            "2.0 1ec2938341958d70d56193d709c89def.cloudfront.net (CloudFront)"
        ],
        "X-Amz-Cf-Id": [
            "UeyJVG96oTb8lrvXp0lns2K-xmJGBH5wgXgW-fIqH8ziKBtuv_8XZg=="
        ],
        "x-amz-date": [
            "20201205T010327Z"
        ],
        "x-amz-security-token": [
            "IQoJb3JpZ2luX2VjEFkaCXVzLXdlc3QtMiJIMEYCIQC1LQZhkM8AwmkCbsoHD2/pDTfmtHyh8wQTHDKzDy56qgIhALngVcs5JHbC3Zg0GakhLxFfWQI/fUQc7bxWyANL+d8+Ks0ECOL//////////wEQAhoMNTQ0OTQxNDUzNjYwIgzPOcNr8swW0bWwcZEqoQSKgcfSUE4FjCyaf2HJoWDZNnXaWX3pjC1z26hcI25LGB7emiO/5KgWi/XBL09sMmH1iQxGnKHZWfUlTvAbLMn2EUdRx1DLCws8YRpob4OHuHbv6Lu7A+jyCNyRhyuaWAbLGxlouEnVTwSVcq2BKB6NfuKOBS87Q6QsuwtIbF6egF8P8kgLWSqgpiPxmtt+0rfpenAcixytUrdf89zuX4Zp3s2lm3CUzRqrVCcEf8utR0IF68VvMTfciJrdluA47+uHfZ7ZJAnjTAj97S1ZXhZ5kWE69U/SxaaaDiyhjsxCbd4O3/OAOq9Vj+4ihC4HOgkaBJIH+6NtAfO/WcFlD2fK5mqz6crMU5JfFW1Nu6NOpBuj1E/M4zshX6/tW5TW7/ZQl9H0xKKgKPl6izh29Dzojc59UGY/oLEp/PPtja3017lKcPc+aiwhV/5bznlyFfr6HBXmeVUpSL9pYMJgRF4CvERRJTOqZOW+YVqzgwxRZNA43NBV1E2OOMyAIGE+xKVM0Xfb7HJXdermnWlLfEbPiMFRaR/51LNpewrmmJAGbV2FpnLqLQAO+wGlUYW+Dt48HOHxYCkFYDxmsxuycFwiULT4JRxA5LRT8OAfaOWM3uxAzgdjlB4g39jp/7PGfSrhnsDLYsACg415krBBvQP6Jx06fbQs/K2vYceCOZ3K6IHLkuh8RgiOl2GzQFii7tEnFdPxZluxp+6rZ3wEgE171zDfuKv+BTqEAhgxDQhfBmcI3O00VWGFDsdiLwgin7dBHHk5veJIPbxkAkNzUXUJbdv/nyd0TEXYjGgt6e0ufYGsVaS3ChUqRvdT7xw/778AN3hXRUMFgVc/AhTSegrNcqDhZ8snXxUQexPJ5CY9xLcCaYncK3c0R+20mnWsLf1k403ivzVuIyfPMqb4nejIU2qxrKRRse63zHuKZe/g43x1eLK7BQkRHwrWw7TyNYIvbbpFXgN8+sAjgDIvJFz8wBVYSeue1mMnKPtG31dZNWo9GfRisvFl6Yu/Yr1S2UNqMfPtCIW3iqsiIChuTOYMeKtykC4/spK83ls/sa07DRDL+bTkbr9sKkz3zq1p"
        ],
        "X-Amzn-Trace-Id": [
            "Root=1-5fcadc5f-787931785dea2be57e96c23c"
        ],
        "X-Forwarded-For": [
            "73.140.151.157, 64.252.140.92"
        ],
        "X-Forwarded-Port": [
            "443"
        ],
        "X-Forwarded-Proto": [
            "https"
        ]
    },
    "queryStringParameters": null,
    "multiValueQueryStringParameters": null,
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
        "resourceId": "t1ltv4",
        "resourcePath": "/demo",
        "httpMethod": "GET",
        "extendedRequestId": "XDdfAGTIvHcF37Q=",
        "requestTime": "05/Dec/2020:01:03:27 +0000",
        "path": "/dev/demo",
        "accountId": "544941453660",
        "protocol": "HTTP/1.1",
        "stage": "dev",
        "domainPrefix": "ghl9weghc7",
        "requestTimeEpoch": 1607130207917,
        "requestId": "3e657bee-a83f-455e-aa1f-89d1bc2dcef4",
        "identity": {
            "cognitoIdentityPoolId": "us-west-2:5214f2db-370c-456c-8c4a-c8a348ada679",
            "accountId": "544941453660",
            "cognitoIdentityId": "us-west-2:d625c9c7-9a79-483c-bb4a-c8333d6249cb",
            "caller": "AROAX5YIKWFOA7TX3PTGF:CognitoIdentityCredentials",
            "sourceIp": "73.140.151.157",
            "principalOrgId": "o-5csdfze7w6",
            "accessKey": "ASIAX5YIKWFOLP33BIJ5",
            "cognitoAuthenticationType": "authenticated",
            "cognitoAuthenticationProvider": "cognito-idp.us-west-2.amazonaws.com/us-west-2_LoM7etRWg,cognito-idp.us-west-2.amazonaws.com/us-west-2_LoM7etRWg:CognitoSignIn:1e10ff5b-642b-489a-894c-91de0fe4f8a9",
            "userArn": "arn:aws:sts::544941453660:assumed-role/amplify-awstoolkit-dev-155847-authRole/CognitoIdentityCredentials",
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36",
            "user": "AROAX5YIKWFOA7TX3PTGF:CognitoIdentityCredentials"
        },
        "domainName": "ghl9weghc7.execute-api.us-west-2.amazonaws.com",
        "apiId": "ghl9weghc7"
    },
    "body": null,
    "isBase64Encoded": false
}
*/