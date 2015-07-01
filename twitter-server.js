var config = require('./config'), 
  https = require('https'),
  TwitterAuth = require('./twitter-auth'),
  TwitterFunctions = require('./twitter-functions'),
  Q = require('q'),
  express = require('express'),
  connectDomain = require('connect-domain'),
  session = require('express-session'),
  FileStore = require('session-file-store')(session);;

var app = express();

var twitterAuth = new TwitterAuth(),
twitterFunctions = new TwitterFunctions();

app.use(express.static('static'))
app.use(session({
  store: new FileStore(),
  secret : config.session_secret,
  cookie : {maxAge: 60000},
  resave: false,
  saveUninitialized: true
}));
app.use(connectDomain());

app.set('view engine', 'jade');


//"https://api.twitter.com/1.1/lists/list.json?screen_name=" + (req.query.username || 'raghuiyer')

app.get('/authorize', function(req, res){
  req.session.screen_name = req.query.screen_name;

  if(req.session.oauth_token && req.session.oauth_token_secret) {
    res.redirect("https://api.twitter.com/oauth/authorize?oauth_token=" + resp.token);
  } else {
    twitterAuth.getOAuthRequestToken("http://localhost:8000/twitter_cb")
    .then(function(resp) {
      req.session.oauth_token = resp.token;
      req.session.oauth_token_secret = resp.tokenSecret;
      res.redirect("https://api.twitter.com/oauth/authorize?oauth_token=" + resp.token);
    }).fail(function(error){
      process.nextTick(function(){
        throw error;
      });
    })
  }
});

app.get('/twitter_cb', function(req, res){
  twitterAuth.getUserAccessToken(req.query.oauth_token, req.session.oauth_token_secret, req.query.oauth_verifier)
    .then(function(resp){
      req.session.oauth_token = resp.token;
      req.session.oauth_token_secret = resp.tokenSecret;
      res.redirect('/list?screen_name=' + req.session.screen_name);
    }).fail(function(error){
      process.nextTick(function(){
        throw error;
      })
    })
});

app.get('/list', function(req, res){
  if(req.session.oauth_token && req.session.oauth_token_secret) {
    twitterFunctions.list(req.session.screen_name, req.session.oauth_token)
    .then(function(listResJSON){
      res.render('list', {resultsJSON: listResJSON, screenName: req.query.username});
    }).fail(function(error){
      process.nextTick(function() {
        throw error;
      });
    });
  } else {
    twitterAuth.getAppAuthToken(config.consumerKey, config.consumerSecret)
    .then(function(token) {
      return twitterFunctions.list(req.query.username, token.access_token +"-")
    }).then(function(listResJSON){
      res.render('list', {resultsJSON: listResJSON, screenName: req.query.username});
    }).fail(function(error){
      process.nextTick(function() {
        throw error;
      });
    });
  }
});

app.use(function(error, req, res, next){
  console.log(error)
  res.status(error.statuscode).send(error)//json({error: error.error[0].message});
});

app.listen(process.argv[2] || 8000)