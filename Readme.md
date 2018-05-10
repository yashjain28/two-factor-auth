
# ipm package: Two Factor Auth

## Overview

A system demonstrating the process of adding multi-factor auth to the user security authentication process

This is an ipm package, which contains one or more reusable assets within the ipm Community. The 'package.json' in this repo is a ipm spec's package.json, [here](https://docs.clearblade.com/v/3/6-ipm/spec), which is a superset of npm's package.json spec, [here](https://docs.npmjs.com/files/package.json).

[Browse ipm Packages](https://ipm.clearblade.com)

[![Live demonstration](https://img.youtube.com/vi/1mlW_3tp29o/0.jpg)](https://www.youtube.com/watch?v=1mlW_3tp29o){:target="_blank"}

## Setup

To setup this example the following 4 steps are required.
1.  Navigate to the Code / Libraries / ConstantsTwoFactor and provide your necessary Twilio account information

2.  As a developer, browse to the service Code / Services / SetupTwoFactorAuth
    1.  Modify the constants at the top
    2.  Save and Test the service (This service only needs to be executed once)

3.  In the devloper console set the runAs user for the authOverride service
    1.  Navigate to Code /Services / authOverride
    2.  Set the run as user to authOverrideAccount@clearblade.com
    3.  Apply

4.  Set the authOverride service for the system  
    1. Open the system settings dialog via info / System Settings and choose the Access tab
    2. Select the authOverride service to override the authentication behavior of users.


## Usage

After setting up the system all users will be required to supply a code given to them via an SMS text message.  Once entering the second layer of security the standard user token will be granted.  This system can be upgraded to include the ability to limit the amount of time the code is valid for.

### Code Services

authOverride - Logic to handle multiple phases of the auth lifecycle.  Factor 1 is validating the user email and password.  Factor 2 validates the factor_id and SMS confirmation code.

SetupTwoFactorAuth - a setup service that creates users and ensures all constants are set.  This service should only be run once.

### Code Libraries

### Portals
Two Factor Login - Portal provides an example UI to test the 2 factor model.

### Collections
TwoFactorTokens - Keeps a list of active SMS codes and the associated users who have an auth in progress

### ...

## Thank you

Powered by ClearBlade Enterprise IoT Platform: [https://platform.clearblade.com](https://platform.clearblade.com)

