# Amazon Cognito UI Tester

This project was inspired by the [Kinesis Data Generator](https://awslabs.github.io/amazon-kinesis-data-generator/web/producer.html).

This project provides a React web UI that lets you plug in the details of an existing Cognito User Pool and Identity pool and then log in. 

After logging in, you're shown a blank dashboard where you can then write code to make AWS SDK API calls. Authentication and authorization for the API calls is handled by your Cognito Identity Pool.

The idea is that I want a reusable barebones web UI that I can use to build simple graphical demos of various AWS services. The UI takes a "widget" model where each widget is, in theory, a different test or demo of functionality. 

This barebones UI comes pre-baked with two widgets:

1. **Cognito Info** - a widget "that simply shows you the JWT from Cognito after authentication, so you can get an idea of how Cognito works. 

2. **EC2 Instances** - a widget that makes an EC2.describeInstances() API call for a region that you specify and shows you which EC2 instances are running in that region. Note - this widget will only work if your Cognito Identity pool's auth role grants users the ability to make this API call.

# Demo

https://matwerber1.github.io/amazon-cognito-ui-tester

# Setup 

## Prerequisites

### Cognito User Pool and Identity Pool

1. Outside of this project, create a Cognito User Pool and within that user pool, create an application client. Also create and associate a Cognito Identity Pool to the Cognito User Pool. 

2. For the "Auth" role associated to the identity pool, give the role whatever AWS IAM permissions you want to build into your browser app. 

## Local Deployment

1. Clone this project

  ```sh
  git clone https://github.com/matwerber1/amazon-cognito-ui-tester.git
  ```

2. Install dependencies

  ```sh
  npm install
  ```

3. Run local version of the web UI

  ```sh
  npm run start
  ```

## Publishing a github.io webpage

This optional step allows you to publish your site to GitHub.io. This project's dependencies include [react-gh-pages](https://github.com/gitname/react-gh-pages), which makes it a breeze to publish to github.io. 

1. Complete the **Local Deployment** steps above to make sure things are working as expected.

2. Open package.json and edit the replace `YOUR_GIT_USERNAME` and `YOUR_REPOSITORY_NAME` with proper values:

  ```
  "homepage": "https://YOUR_GIT_USERNAME.github.io/YOUR_REPOSITORY_NAME",
  ```

3. Build the web app app, publish to a `gh-pages` branch:

  ```
  npm run deploy
  ```

Read more about how this works at [react-gh-pages](https://github.com/gitname/react-gh-pages).

# Styling with material-ui

I'm a total amateur at front-end design, so I opted to try [material-ui](material-ui.com/) for the first time. Quite pleased with the results relative to what I could have done on my own. 

# React Component Overview

A selection of key files and usage is below. These files are relative to the ./src/ directory of this project: 

## [./components/common/app-store.js](./src/components/common/app-store.js)

This file imports [@risingstack/react-easy-state](https://github.com/RisingStack/react-easy-state) and creates an `appStore` object that contains our shared state across the app. React-easy-state is (in my humble opinion) a very simple state management alternative to something like Redux.

As long as you wrap all of your components in a view, e.g. `const myFunctionalReactComponent = view(() => {})`, the component will re-render if changes are detected to any state variables within the component. 

In this case, we create and export an `appStore` object that primarily holds the user's Cognito configuration (e.g. client ID, pool ID) and their authentication state. We import it anywhere we may need this information, such as the components that log into Cognito or the components that only conditionally display when a user is logged in. 

When the user enters non-sensitive info like Cognito client ID or pool ID, we save them to cookies. When the app first loads, we also call a method within appStore to attempt to load values from cookies (if they exist) to avoid the need to retype the values each time. 

## [./App.js](./src/App.js)

App displays a `<Header>` component and a <`Body`> component. 

If the user is not logged in, the `<Header>` will display a button that allows the user to enter/edit their Cognito configuration, i.e. their user pool ID, client ID, identity pool ID, and region. If the user is logged in, the `<Header>` displays a sign out button. 

If the user is not logged in, the `<Body>` will display a Cognito login componennt (which also includes components for user creation, password reset, etc. - if enabled for your user pool). If the user is logged in, the `<Body>` will instead display a left navigation bar with a list of "widgets" and a checkbox for each, and the right side of the screen will display whichever widgets the user has selected from the navigation bar.

# How to use AWS SDK in a component

1. Import appStore to your component:

  ```js
  import appStore from './src/common/app-store.js';
  ```

2. Import the AWS Javascript SDK(s) that you need, such as EC2:

  ```js
  import EC2 from 'aws-sdk/clients/ec2';
  ```

3. Instatiate your SDK object. It might make sense to do this on component load using React's `useEffect()`, but you can edit as needed. Look at `./src/components/widgets/ec2-describe-instances.js` for an example:

  ```js
  var credentials = await appStore.Auth.currentCredentials();
  const ec2 = new EC2({
    region: region,
    credentials: appStore.Auth.essentialCredentials(credentials)
  });
  ```

4. You can display your widget however you'd like, but if you'd like to use consistent formatting, then you should import the Widget component and wrap your output with it, like so: 

  ```js
  import Widget from './widget.js';

  const myWidget = view(() => {

    return (
      <Widget>
        <h2>EC2 Instances:</h2>
        <RegionSelector value={region} setFunction={setRegion}/><br/>
        {renderResponse()}
      </Widget>
    );
  });
  ```
  