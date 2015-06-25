var config = require('./config'), 
  https = require('https'),
  Q = require('q');

var TwitterAuth = function(){
    var encodeSecret = function(consumerKey, consumerSecret) {
        return new Buffer(encodeURIComponent( config.consumerKey ) + ":" + encodeURIComponent( config.consumerSecret )).toString('base64');
    }

    return {
        getAppAuthToken : function(consumerKey, consumerSecret) {
            var encodedCreds = encodeSecret(consumerKey, consumerSecret);
            var options = config.connection_options;
            options["headers"] = {
                "Authorization": "Basic " + encodedCreds,
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            }

            var deferred = Q.defer();

            var req = https.request(options, function(res){
              if(res.statusCode !== 200) {            
                var errorMsg = ""
                res.on('data', function (chunk) {
                  errorMsg += chunk.toString();
                });
                res.on('end', function(){
                    deferred.reject( new Error("Unable to connect to get auth token." + errorMsg + ", status code: " + res.statusCode) );
                });
                
              } else {
                res.setEncoding('utf8');
                var tokenresp = "";
                res.on('data', function (chunk) {
                    tokenresp += chunk.toString();
                });
                res.on("end", function(){
                    deferred.resolve(JSON.parse(tokenresp));
                });
              };
            });

            req.on('error', function(e){
                deferred.reject(new Error("General failure: " + e));
            });

            req.write("grant_type=client_credentials");
            req.end();

            return deferred.promise;
        },
        getUserAuthToken : function() {

        }
    }
}

module.exports = TwitterAuth;