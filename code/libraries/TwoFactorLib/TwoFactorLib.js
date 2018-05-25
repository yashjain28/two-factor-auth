/**
 * Enables developer to add two factor to his system.
 * @typedef {Object} TwoFactor
 * 
 * @example
 * var AuthenticationProcess = TwoFactor();
 */
function TwoFactor() {

    /**
     * This method performs step 1 of the two factor auth. 
     * Following are the steps performed by this method if the previous step didn't fail:
     * 1. Verify systemKey, systemSecret, email & password
     * 2. Create a two factor record and stores in a collection, to be used later in 2nd factor of Authentication.
     * 3. Generates code to be sent and stores in that record.
     * 4. Sends the code to the user's phone number
     * Note: The record of the registered user should have a _valid phone number_.
     * @memberof TwoFactor 
     * @typedef {Object} stepOneValidateUserCredential
     * @param {Object} request
     * @param {string} request.systemKey - systemKey of the desired system
     * @param {string} request.systemSecret - systemSecret of the desired system
     * @param {string} request.params.email - email of the registered user
     * @param {string} request.params.password - password of the registered user
     * 
     * @param callback
     * @returns {phase1Response} phase1Response
     * 
     * @example
     * 
     * var callback = function(err, data){
     *     if (err){
     *         resp.error(data);
     *     } else {
     *         resp.success(data);
     *     }
     * }
     * 
     * var AuthenticationProcess = TwoFactor();
     * 
     * if (req.params.factor==1){
     *     AuthenticationProcess.stepOneValidateUserCredential(req, callback);
     * }
     * 
     */
    function stepOneValidateUserCredential(request, callback) {
        log("stepOneValidateUserCredential");

        var phase1Data = {};
        var phase1Response = {
            authToken: "",
            user_id: "",
            options: {
                factor_id: "",
                message: "",
                err: false
            }
        };

        try {
            ClearBlade.init({
                systemKey: request.systemKey,
                systemSecret: request.systemSecret,
                email: request.params.email,
                password: request.params.password,
                callback: function (err, body) {
                    if (err) {
                        phase1Response.options.err = true;
                        phase1Response.options.message = "email or password is not correct";
                        sendResponse(phase1Response, callback);
                    } else {
                        ClearBlade.init({ "request": request });
                        createTwoFactorRecord(body.authToken);
                    }
                }
            });
        } catch (e) {
            var message = e;
            if (typeof e === 'object') {
                message = e.message;
            }

            phase1Response.options.err = true;
            phase1Response.options.message = message;
            sendResponse(phase1Response, callback);
        }

        function createTwoFactorRecord(authToken) {
            log("createPhaseRecord");
            var d = new Date();
            var n = d.toISOString();
            var code = generateCode().toString();
            phase1Data.code = code;
            var newPhaseRecord = {
                email: request.params.email,
                auth_token: authToken,
                sms_code: code,
                auth_date: n
            };

            //this inserts the phase record to be completed with a second factor auth
            var col = ClearBlade.Collection({ collectionName: "TwoFactorAuthTokens" });
            col.create(newPhaseRecord, function (err, data) {
                if (err) {
                    phase1Response.options.err = true;
                    phase1Response.options.message = "failed to complete phase 1 of the 2 factor auth.";
                    sendResponse(phase1Response, callback);
                } else {
                    phase1Response.options.factor_id = data[0].item_id;
                    getUserPhone();
                }
            });
        }

        function generateCode() {
            log("generateCode");
            var val = Math.floor(1000 + Math.random() * 9000);
            return val;
        }

        function getUserPhone() {
            var query = ClearBlade.Query();
            query.equalTo("email", request.params.email);
            var user = ClearBlade.User();
            user.allUsers(query, function (err, data) {
                if (err) {
                    phase1Response.options.err = true;
                    phase1Response.options.message = "failed to look-up user by email";
                    log(phase1Response);
                } else {
                    var sms_phone = data.Data[0].sms_phone;
                    log(sms_phone);
                    sendCode(sms_phone);
                }

            });
        }

        function sendCode(recipientNumber) {
            log("sendCode");

            var text = SMS_MESSAGE + phase1Data.code;
            var twilio = Twilio(TWILIO_KEY, TWILIO_SECRET, TWILIO_SOURCE_NUMBER);

            twilio.sendSMS(text, recipientNumber, function (err, data) {
                if (err) {
                    phase1Response.options.err = true;
                    phase1Response.options.message = "failed to send SMS with code";

                } else {
                    phase1Response.options.message = "Confirmation code sent via SMS";
                    sendResponse(phase1Response, callback);
                }
            });

        }

        

    }


    /**
     * This method performs step 2 of the two factor auth. 
     * Following are the steps performed by this method if the previous step didn't fail:
     * 1. Fetches the token it saved for that particular user based on the factor_id.
     * 2. Compares it with the code user received on the phone.
     * 3. Sends response with a token.
     * 
     * @memberof TwoFactor
     * @typedef {Object} stepTwoVerifyCodeWithRecord
     * @param {Object} request
     * @param {string} request.params.factor_id - a unique factor sent as a response on successful step1 of authentication 
     * @param {string} request.params.code - the code received on users phone
     * 
     * @returns {phase2Response} phase2Response
     * 
     * @param callback
     * 
     * @example
     * 
     * var callback = function(err, data){
     *     if (err){
     *         resp.error(data);
     *     } else {
     *         resp.success(data);
     *     }
     * }
     * 
     * var AuthenticationProcess = TwoFactor();
     * 
     * if (req.params.factor==2){
     *     AuthenticationProcess.stepTwoVerifyCodeWithRecord(req, callback);
     * }
     * 
     */
    function stepTwoVerifyCodeWithRecord(request, callback) {
        log("stepTwoVerifyCodeWithRecord");
        var phase2Data = {};
        var phase2Response = {
            authToken: "",
            user_id: "",
            options: {
                err: false,
                message: ""
            }
        };

        var query = ClearBlade.Query();
        query.equalTo("item_id", request.params.factor_id);

        var col = ClearBlade.Collection({ collectionName: "TwoFactorAuthTokens" });
        col.fetch(query, function (err, data) {
            if (err) {
                phase2Response.options.err = true;
                phase2Response.options.message = "failed to find two factor record.";
                sendResponse(phase2Response, callback);
            } else {
                if (data.DATA.length != 1) {
                    phase2Response.options.err = true;
                    phase2Response.options.message = "failed to find phase 1 of the 2 factor auth.";
                    sendResponse(phase2Response, callback);
                } else {
                    validateUserCode(data.DATA[0]);
                }
            }
        });


        function validateUserCode(twoFactorRecord) {
            log("validateUserCode");
            if (request.params.code == twoFactorRecord.sms_code) {
                phase2Data.authToken = twoFactorRecord.auth_token;
                getUserId(twoFactorRecord.email);
            } else {
                phase2Response.options.err = true;
                phase2Response.options.message = "confirmation code not valid";
                sendResponse(phase2Response, callback);
            }
        }

        function getUserId(email) {
            log("getUserId");
            var query = ClearBlade.Query();
            query.equalTo("email", email);

            var user = ClearBlade.User();
            user.allUsers(query, function (err, data) {
                if (err) {
                    phase2Response.options.err = true;
                    phase2Response.options.message = "failed to find user by email";
                    sendResponse(phase2Response, callback);
                } else {
                    phase2Data.user_id = data.Data[0].user_id;
                    clearTwoFactorRecord();
                }

            });
        }

        function clearTwoFactorRecord() {
            log("clearTwoFactorRecord");
            var query = ClearBlade.Query();
            query.equalTo("item_id", request.params.factor_id);
            var col = ClearBlade.Collection({ collectionName: "TwoFactorAuthTokens" });

            col.remove(query, function (err, data) {
                if (err) {
                    phase2Response.options.err = true;
                    phase2Response.options.message = "unable to complete two factor transaction";
                    sendResponse(phase2Response, callback);
                } else {
                    phase2Response.authToken = phase2Data.authToken;
                    phase2Response.user_id = phase2Data.user_id;
                    phase2Response.options.message = "Successfully validated confirmation code";
                    phase2Response.options.err = false;
                    sendResponse(phase2Response, callback);
                }
            });

        }

       
    }


    function sendResponse(response, callback) {
        log("sendResponse");
        if (response.options.err) {
            callback(true, response);
        } else {
            callback(false, response);
        }
    };


    return {
        stepOneValidateUserCredential,
        stepTwoVerifyCodeWithRecord
    }
}


/**
 * Phase1 Response structure
 * @typedef {Object} phase1Response
 * @property {string} authToken
 * @property {string} user_id
 * @property {string} options.factor_id
 * @property {string} options.message
 * @property {boolean} options.err
 */


/**
 * Phase2 Response structure
 * @typedef {Object} phase2Response
 * @property {string} authToken
 * @property {string} user_id
 * @property {string} options.message
 * @property {boolean} options.err
 */