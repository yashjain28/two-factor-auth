function TwoFactorAuthOverride(req, resp){
    ClearBlade.init({"request":req});
    
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
    else if (req.params.factor==2){
        AuthenticationProcess.stepTwoVerifyCodeWithRecord(req, callback);    
    }
}