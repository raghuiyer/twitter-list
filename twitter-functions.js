var Q = require('q'),
    https = require('https');

module.exports = function() {
    return {
        list : function callList(screen_name, access_token) {
            var deferred = Q.defer();

            var listOptions = {
                host : "api.twitter.com",
                path: "/1.1/lists/list.json?screen_name=" + screen_name,
                headers : { "Authorization" : "Bearer " + access_token }
            }

            var listreq = https.request(listOptions, function(listRes){
                if(listRes.statusCode !== 200) {
                    var errorMsg = ""
                    listRes.on('data', function (chunk) {
                      errorMsg += chunk.toString();
                    });
                    listRes.on('end', function(){
                        deferred.reject({ error : JSON.parse(errorMsg).errors , statuscode: listRes.statusCode });
                    });
                } else {
                  listRes.setEncoding('utf8');
                  var listres = "";
                  listRes.on('data', function (listChunk) {
                    listres += listChunk.toString();
                  });
                  listRes.on('end', function(){
                    deferred.resolve( JSON.parse(listres) );
                  });
                }
            });

            listreq.on('error', function(e){
              deferred.reject(e);
            });

            listreq.end();

            return deferred.promise;
        }
    }
}