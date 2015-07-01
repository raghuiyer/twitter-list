var config = require('./config'), 
  https = require('https'),
  Q = require('q'),
  crypto = require('crypto'),
  OAuth = require('oauth');

var oauth = new OAuth.OAuth('https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  config.consumerKey,
  config.consumerSecret,
  '1.0',
  null,
  'HMAC-SHA1');


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
        getOAuthRequestToken : function(callbackurl) {
            var deferred = Q.defer();
            
            oauth.getOAuthRequestToken({oauth_callback : callbackurl}, function(err, token, tokenSecret, params){
                if(err) {
                    deferred.reject(err);
                }

                deferred.resolve({token: token, tokenSecret: tokenSecret});
            });

            return deferred.promise;
        },
        getUserAccessToken: function(token, tokenSecret, oauthverifier){
            var deferred = Q.defer();
            oauth.getOAuthAccessToken(token, tokenSecret, oauthverifier, function(err, token, tokenSecret, params){
                if(err) {
                    deferred.reject(err);
                }

               deferred.resolve({token: token, tokenSecret: tokenSecret}); 
            });

            return deferred.promise;
        }
    }
}

module.exports = TwitterAuth;