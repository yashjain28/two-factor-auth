function TwoFactorAuthSetup(req, resp){
    var portalEditorPassword            = "clearblade";         // change this to something unique
    var authOverrideServiceUserPassword = "clearblade";         // change this to something unique
    var testUserPassword                = "password";           // change this to something unique
    var testUserSMSPhone                = "(+1 512-000-0000)";  // Set this to a real mobile phone number 
    
    var response = {
        err:false,
        messages:[]
    };

    var new_user_id = "";
    var systemRoles =[];
    
    var getSystemRoles = function() {
         var options = {
            uri: PLATFORM_URL+"/admin/user/"+req.systemKey+"/roles",
            headers :{"ClearBlade-DevToken": req.userToken},
            body: {}
        };
        var requestObject = Requests();
        requestObject.get(options, function(err,httpresponse) {
            if (err === true){
                response.err = true;
                response.messages.push("Unable to get System roles, Please ensure you are running this service from the Developer Console");
            }
             else {
                systemRoles = JSON.parse(httpresponse);
            }
            
        });
    };
    
    var checkConstants = function(){
        var checkConstantEmpty = function(constant){
            if (constant === "") {
                return true;
            } else {
                return false;
            }
        }; 
        if( checkConstantEmpty(PLATFORM_URL) ){
            response.err = true;
            response.messages.push("PLATFORM_URL not set in ConstantsTwoFactor Library");
        }
        if( checkConstantEmpty(TWILIO_KEY) ){
            response.err = true;
            response.messages.push("TWILIO_KEY not set in ConstantsTwoFactor Library");
        }
        if( checkConstantEmpty(TWILIO_SECRET) ){
            response.err = true;
            response.messages.push("TWILIO_SECRET not set in ConstantsTwoFactor Library");
        }
        if( checkConstantEmpty(TWILIO_SOURCE_NUMBER) ){
            response.err = true;
            response.messages.push("TWILIO_SOURCE_NUMBER not set in ConstantsTwoFactor Library");
        }
    };

    var addRoleToUser = function(role) {
        if (role===""){
            
        } else {
            var roleId = ""
            
            for( var i =0; i< systemRoles.length; i++){
                    
                if (systemRoles[i].Name == role){
                    roleId = systemRoles[i].ID;
                }
            }
            
            var options = {
                uri: PLATFORM_URL+"/admin/user/"+req.systemKey,
                headers :{"ClearBlade-DevToken":req.userToken},
                body: {
                    "user":new_user_id,
                    "changes": {
                        "roles":
                            {
                                "add":[roleId]
                            }
                    }
                }
            };
            var requestObject = Requests();
            requestObject.put(options, function(err,httpresponse) {
                if (err === true){
                    
                }
                 else {
                    //role added
                }
                
            });
        }
    }
    
    var createUser = function(email, password, role, sms_phone){
        ClearBlade.init({
    		systemKey: req.systemKey,
    		systemSecret: req.systemSecret,
    		registerUser: true,
    		email: email,
    		password: password,
    		callback: function(err, body) {
    			if(err) {
    				response.err= true;
    				response.messages.push("Failed to create user "+email);
    			} else {
    			    new_user_id = body.user_id;
                    
    			    ClearBlade.init({request:req});
    			    response.messages.push("Created "+email+" user");
    			    var query = ClearBlade.Query();
                    query.equalTo("email", email);
                    var changes = {
                        "sms_phone" : sms_phone
                    };
                    var user = ClearBlade.User();
    			    user.setUsers(query,changes, function(){
    			        addRoleToUser(role);
    			    });
    			}
    		}
    	});
    };
    
    
    
    var sendResponse = function(){
        if (response.err){
            resp.error(resposne)
        }else{
            resp.success(response);    
        }
        
    };
    
    var main = function() {
        getSystemRoles();
        
        //create PortalEditor User
        checkConstants();
        if (response.err === true) {
            sendResponse();
        }else {
            createUser("portalEditorUser@clearblade.com", portalEditorPassword, "portalEditor", "");
            createUser("test@clearblade.com", testUserPassword, "", testUserSMSPhone);
            createUser("authOverrideAccount@clearblade.com", authOverrideServiceUserPassword, "authOverrideRole", "");
            sendResponse();
        }
    };
    
    main();
}