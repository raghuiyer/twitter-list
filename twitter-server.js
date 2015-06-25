var config = require('./config'), 
  https = require('https'),
  TwitterAuth = require('./twitter-auth'),
  TwitterFunctions = require('./twitter-functions'),
  Q = require('q'),
  express = require('express');

var app = express();

var twitterAuth = new TwitterAuth(),
twitterFunctions = new TwitterFunctions();

app.use(function(err, req, res, next){
  res.status(500);
  res.render('error', {error: err});
});

app.get('/list', function(req, res){

  twitterAuth.getAppAuthToken(config.consumerKey, config.consumerSecret)
  .then(function(token) {
    twitterFunctions.list(req.query.username, token.access_token)
      .then(function(listResJSON){
        res.json(listResJSON);
      }).fail(function(e){
        throw new Error(e);
      });
  }).fail(function(error){
    throw new Error(error);
  }); 
});


app.listen(process.argv[2])