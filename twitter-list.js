var config = require('./config'), 
  https = require('https');

var consumerKey = encodeURIComponent( config.consumerKey );
var consumerSecret = encodeURIComponent( config.consumerSecret );

var creds = consumerKey + ":" + consumerSecret;

var encodedCreds = new Buffer(creds).toString('base64');

var options = config.connection_options;
options["headers"] = {
    "Authorization": "Basic " + encodedCreds,
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
}

var req = https.request(options, function(res){
  if(res.statusCode !== 200) {
    console.error("error", res.statusCode)
    res.on('data', function (chunk) {
      console.error(chunk.toString());
    });
  } else {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var result = JSON.parse(chunk.toString());
      var access_token = result.access_token;
      var listOptions = config.list_connection_options;
      listOptions["path"] = listOptions["path"] + "?screen_name=" + (process.argv[2] || 'raghuiyer')
      
      listOptions["headers"] = {
        "Authorization" : "Bearer " + access_token
      }

      var listreq = https.request(listOptions, function(listRes){
        if(listRes.statusCode !== 200) {
            console.error("error", listRes.statusCode);
            listRes.on("data", function(chunk){
                console.error(chunk.toString());
            })
        } else {
            listRes.setEncoding('utf8');
            var listres = "";
            listRes.on('data', function (listChunk) {
                var data = listChunk.toString();
                listres += data;
            });
            listRes.on('end', function(){
                var listResJSON = JSON.parse(listres);
                listResJSON.forEach(function(list) {
                    console.log(list.full_name)
                })
            })
        }
    });

       listreq.on('error', function(e){
            console.error("error", e)
        });
       listreq.end();
    });
 }});


req.on('error', function(e){
    console.error("error", e)
});

req.write("grant_type=client_credentials");
req.end();