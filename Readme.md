
# ipm package: Two Factor Auth

## Overview

A system demonstrating the process of adding multi-factor auth to the user security authentication process

This is an ipm package, which contains one or more reusable assets within the ipm Community. The 'package.json' in this repo is a ipm spec's package.json, [here](https://docs.clearblade.com/v/3/6-ipm/spec), which is a superset of npm's package.json spec, [here](https://docs.npmjs.com/files/package.json).

[Browse ipm Packages](https://ipm.clearblade.com)

[![Live demonstration](https://img.youtube.com/vi/1mlW_3tp29o/0.jpg)](https://www.youtube.com/watch?v=1mlW_3tp29o)

## Setup

To setup this example the following 4 steps are required.
1.  Navigate to the Code / Libraries / TwoFactorConstants and provide your necessary Twilio account information

2.  As a developer, browse to the service Code / Services / TwoFactorAuthSetup
    1.  Modify the constants at the top
    2.  Save and Test the service (This service only needs to be executed once)

3.  In the devloper console set the runAs user for the TwoFactorAuthOverride service
    1.  Navigate to Code /Services / TwoFactorAuthOverride
    2.  Set the run as user to authOverrideAccount@clearblade.com
    3.  Apply

4.  Set the TwoFactorAuthOverride service for the system  
    1. Open the system settings dialog via info / System Settings and choose the Access tab
    2. Select the TwoFactorAuthOverride service to override the authentication behavior of users.

For further details please refer to [auth override docs](https://docs.clearblade.com/v/3/2-console_administration/AuthOverride/).

## Usage

After setting up the system all users will be required to supply a code given to them via an SMS text message.  Once entering the second layer of security the standard user token will be granted.  This system can be upgraded to include the ability to limit the amount of time the code is valid for. Ex: Creating a service with a timer which executes it every x mins. The service can delete records from the collection based on timestamp.

## Assets
### Code Services

TwoFactorAuthOverride - Logic to handle multiple phases of the auth lifecycle.  Factor 1 is validating the user email and password.  Factor 2 validates the factor_id and SMS confirmation code.

TwoFactorAuthSetup - a setup service that creates users and ensures all constants are set.  This service should only be run once.

### Code Libraries
`TwoFactorLib` - This library gives user the ability to run two factor auth in his system. It provides two methods, one for each step. It can be accessed creating _TwoFactor_ object.

`TwoFactorConstants` - A constants library to have a centralized location for constants.

### Portals

Two Factor Login - Portal provides an example UI to test the 2 factor model.

### Collections

TwoFactorTokens - Keeps a list of active SMS codes and the associated users who have an auth in progress

## API

## Typedefs

<dl>
<dt><a href="#phase1Response">phase1Response</a> : <code>Object</code></dt>
<dd><p>Phase1 Response structure</p>
</dd>
<dt><a href="#phase2Response">phase2Response</a> : <code>Object</code></dt>
<dd><p>Phase2 Response structure</p>
</dd>
<dt><a href="#TwoFactor">TwoFactor</a> : <code>Object</code></dt>
<dd><p>Enables developer to add two factor to his system.</p>
</dd>
</dl>

<a name="phase1Response"></a>

## phase1Response : <code>Object</code>
Phase1 Response structure

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| authToken | <code>string</code> | 
| user_id | <code>string</code> | 
| options.factor_id | <code>string</code> | 
| options.message | <code>string</code> | 
| options.err | <code>boolean</code> | 

<a name="phase2Response"></a>

## phase2Response : <code>Object</code>
Phase2 Response structure

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| authToken | <code>string</code> | 
| user_id | <code>string</code> | 
| options.message | <code>string</code> | 
| options.err | <code>boolean</code> | 

<a name="TwoFactor"></a>

## TwoFactor : <code>Object</code>
Enables developer to add two factor to his system.

**Kind**: global typedef  
**Example**  
```js
var AuthenticationProcess = TwoFactor();
```

* [TwoFactor](#TwoFactor) : <code>Object</code>
    * [.stepOneValidateUserCredential](#TwoFactor.stepOneValidateUserCredential) ⇒ [<code>phase1Response</code>](#phase1Response)
    * [.stepTwoVerifyCodeWithRecord](#TwoFactor.stepTwoVerifyCodeWithRecord) ⇒ [<code>phase2Response</code>](#phase2Response)

<a name="TwoFactor.stepOneValidateUserCredential"></a>

### TwoFactor.stepOneValidateUserCredential ⇒ [<code>phase1Response</code>](#phase1Response)
This method performs step 1 of the two factor auth. 
Following are the steps performed by this method if the previous step didn't fail:
1. Verify systemKey, systemSecret, email & password
2. Create a two factor record and stores in a collection, to be used later in 2nd factor of Authentication.
3. Generates code to be sent and stores in that record.
4. Sends the code to the user's phone number
Note: The record of the registered user should have a _valid phone number_.

**Kind**: static typedef of [<code>TwoFactor</code>](#TwoFactor)  
**Returns**: [<code>phase1Response</code>](#phase1Response) - phase1Response  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.systemKey | <code>string</code> | systemKey of the desired system |
| request.systemSecret | <code>string</code> | systemSecret of the desired system |
| request.params.email | <code>string</code> | email of the registered user |
| request.params.password | <code>string</code> | password of the registered user |
| callback |  |  |

**Example**  
```js
var callback = function(err, data){
    if (err){
        resp.error(data);
    } else {
        resp.success(data);
    }
}

var AuthenticationProcess = TwoFactor();

if (req.params.factor==1){
    AuthenticationProcess.stepOneValidateUserCredential(req, callback);
}
```
<a name="TwoFactor.stepTwoVerifyCodeWithRecord"></a>

### TwoFactor.stepTwoVerifyCodeWithRecord ⇒ [<code>phase2Response</code>](#phase2Response)
This method performs step 2 of the two factor auth. 
Following are the steps performed by this method if the previous step didn't fail:
1. Fetches the token it saved for that particular user based on the factor_id.
2. Compares it with the code user received on the phone.
3. Sends response with a token.

**Kind**: static typedef of [<code>TwoFactor</code>](#TwoFactor)  
**Returns**: [<code>phase2Response</code>](#phase2Response) - phase2Response  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.params.factor_id | <code>string</code> | a unique factor sent as a response on successful step1 of authentication |
| request.params.code | <code>string</code> | the code received on users phone |
| callback |  |  |

**Example**  
```js
var callback = function(err, data){
    if (err){
        resp.error(data);
    } else {
        resp.success(data);
    }
}

var AuthenticationProcess = TwoFactor();

if (req.params.factor==2){
    AuthenticationProcess.stepTwoVerifyCodeWithRecord(req, callback);
}
```
