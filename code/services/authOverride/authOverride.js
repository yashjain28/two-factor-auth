function authOverride(req, resp){
    ClearBlade.init({"request":req});
    // var paramsTest1 = {
    //     "email":"test@clearblade.com",
    //     "password":"cb",
    //     "factor":1
    // }
    
    // var paramsTest2 = {
    //     "factor_id":"ccccccc-ffff-4444-bbbb-asdfasdfasdf",
    //     "code":"7005",
    //     "factor":2
    // }
    
    // req.params = paramsTest1;
    
    var phase1Response = {
        authToken:"",
        user_id:"", 
        options:{ 
            factor_id:"",
            message:"",
            err:false
        }
    };
    
    var phase1Data = {};
    
    var phase2Response = {
        authToken:"",
        user_id:"", 
        options:{
            err:false,
            message:""
        }
    };
    
    var phase2Data = {};
    
    var validateUserCredential = function() {
        log("validateUserCredential");
        try{
            ClearBlade.init({
                systemKey: req.systemKey,
                systemSecret: req.systemSecret,
                email: req.params.email,
                password: req.params.password,
                callback: function(err, body) {
                    if(err) {
                        phase1Response.options.err= true;
                        phase1Response.options.message = "email or password is not correct";
                        sendResponse(phase1Response);
                    } else {
                        ClearBlade.init({"request":req});
                        createTwoFactorRecord(body.authToken);
                    }
                }
            });   
        }catch(e){
            var message = e;
            if (typeof e === 'object') {
                message = e.message;
            }
            
            phase1Response.options.err= true;
            phase1Response.options.message = message;
            sendResponse(phase1Response);
        }
    };
    
    var generateCode = function() {
        log("generateCode");
        var val = Math.floor(1000 + Math.random() * 9000);
        return val;
    };
    
    var createTwoFactorRecord = function(authToken) {
        log("createPhaseRecord");
        var d = new Date();
        var n = d.toISOString();
        var code = generateCode().toString();
        phase1Data.code=code;
        var newPhaseRecord = {
            email: req.params.email,
            auth_token: authToken,
            sms_code: code,
            auth_date: n
        };
        var callback = function (err, data) {
            if (err) {
                phase1Response.options.err= true;
                phase1Response.options.message = "failed to complete phase 1 of the 2 factor auth.";
                sendResponse(phase1Response);
            } else {
                // log(data);
                phase1Response.options.factor_id=data[0].item_id;
                getUserPhone();
            }
        };
        var col = ClearBlade.Collection( {collectionName: "TwoFactorAuthTokens" } );
        col.create(newPhaseRecord, callback);
        //this inserts the phase record to be completed with a second factor auth
    };  
    
    var getUserPhone = function() {
        var query = ClearBlade.Query();
        query.equalTo("email",req.params.email);
        var user = ClearBlade.User();
    	user.allUsers(query, function(err, data) {
    	    if (err){
    	        phase1Response.options.err= true;
                phase1Response.options.message = "failed to look-up user by email";
    	    }else{
    	        var sms_phone = data.Data[0].sms_phone;
        		sendCode(sms_phone);
    	    }
    	   
    	});
    };
    
    var sendCode = function(sms_phone) {
        log("sendCode");
 
        var text = SMS_MESSAGE + phase1Data.code;
        var recipientNumber = sms_phone;
        
        var twilio = Twilio(TWILIO_KEY, TWILIO_SECRET, TWILIO_SOURCE_NUMBER);
        
        var callback = function(err, data){
            if(err){
                phase1Response.options.err= true;
                phase1Response.options.message = "failed to send SMS with code";
            }else{
                phase1Response.options.message = "Confirmation code sent via SMS";
                sendResponse(phase1Response) ;
            }
        };
        
        twilio.sendSMS(text, recipientNumber, callback);
    };
    
    var getTwoFactorRecord = function(){
        log("getTwoFactorRecord");
        var getCallback = function (err, data) {
            if (err) {
                phase2Response.options.err= true;
                phase2Response.options.message = "failed to find two factor record.";
                sendResponse(phase2Response);
            } else {
                if (data.DATA.length!=1){
                    phase2Response.options.err= true;
                    phase2Response.options.message = "failed to find phase 1 of the 2 factor auth.";
                    sendResponse(phase2Response);
                }else {
                    validateUserCode (data.DATA[0]);
                }
            }
        };
        var query = ClearBlade.Query();
	    query.equalTo("item_id", req.params.factor_id);
        var col = ClearBlade.Collection( {collectionName: "TwoFactorAuthTokens" } );
        col.fetch(query, getCallback);
    };
    
    var validateUserCode = function(twoFactorRecord){
        log("validateUserCode");
        if (req.params.code==twoFactorRecord.sms_code) {
            phase2Data.authToken=twoFactorRecord.auth_token;
            getUserId(twoFactorRecord.email);
        } else{
            phase2Response.options.err= true;
            phase2Response.options.message = "confirmation code not valid";
            sendResponse(phase2Response);
        }
                
    };
    
    var getUserId = function(email) {
        log("getUserId");
        var query = ClearBlade.Query();
        query.equalTo("email",email);
    
        var user = ClearBlade.User();
    	user.allUsers(query, function(err, data) {
    	    if (err){
    	        phase2Response.options.err= true;
                phase2Response.options.message = "failed to find user by email";
                sendResponse(phase2Response);
    	    }else{
    	        phase2Data.user_id = data.Data[0].user_id;
        		clearTwoFactorRecord();
    	    }
    	   
    	});
    };
    
    
    var clearTwoFactorRecord = function() {
        log("clearTwoFactorRecord");
        var clearCallback = function (err, data) {
            if (err) {
                phase2Response.options.err= true;
                phase2Response.options.message = "unable to complete two factor transaction";
                sendResponse(phase2Response);
            } else {
                phase2Response.authToken = phase2Data.authToken;
                phase2Response.user_id = phase2Data.user_id;
                phase2Response.options.message ="Successfully validated confirmation code";
                phase2Response.options.err = false;
                sendResponse(phase2Response);
            }
        };
        var query = ClearBlade.Query();
	    query.equalTo("item_id", req.params.factor_id);
        var col = ClearBlade.Collection( {collectionName: "TwoFactorAuthTokens" } );
        col.remove(query, clearCallback);
    };
    
    var sendResponse = function(response) {
        log("sendResponse");
        if (response.options.err){
            resp.error(response);
        } else {
            resp.success(response);
        }
    };
    
    if (req.params.factor==1){
        validateUserCredential();
        
    }else if (req.params.factor==2){
        getTwoFactorRecord();    
    }
    
}