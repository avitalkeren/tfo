// server.js

var
http    = require('http'),
express = require('express'),
 // angularRoute = require('angular-route'),
 log4js = require('log4js'),
 logger  = log4js.getLogger(),
 passwordHash = require('password-hash'),
 tfom  = require('./models/tfo.model'),

//routes  = require('./routes/routes_mongo'),
app     = express(),
mongodb = require("mongodb"),
ObjectID = mongodb.ObjectID

server  = http.createServer(app);

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));

  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.logger());
  app.use(express.errorHandler({
    dumpExceptions : true,
    showStack      : true
  }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

  // Create a database variable outside of the database connection callback to reuse the connection pool.
  var db;

  app.all( '/api/:obj_type/*?', function ( request, response, next ) {
    response.contentType( 'json' );
    next();
  });

  app.post('/api/authenticate', function ( request, response, next ) {
    tfom.Authenticate(request, response, db);
  });

 //create org
 app.post( '/api/org/create', function ( request, response ) {
   tfom.CreateOrg(request, response, db);
 });

 app.post('/api/org/publish', function ( request, response, next ) {
  tfom.Publish(request, response, db);
});

 app.get('/api/feed/:uid/:page_number', function ( request, response ) {
  tfom.GetFeedForUser(request.params, response, db);
});

 app.get('/api/subscribers/list/:id', function ( request, response ) {
  tfom.GetOrgSubscribersList(request.params, response, db);
});

 app.post('/api/subscribers/create', function ( request, response, next ) {
  tfom.CreateSubscribers(request, response, db);
});

 app.post('/api/subscribers/update', function ( request, response, next ) {
  tfom.UpdateSubscribers(request, response, db);
});

 app.get('/api/subscribers/delete/:id', function ( request, response ) {
  tfom.DeleteSubscribers(request.params, response, db);
});

 //create user
 app.post( '/api/user/create', function ( request, response ) {
  tfom.CreateUser(request, response, db);
});

 //create user
 app.get('/api/entity/read/:id', function ( request, response ) {
  tfom.GetEntityById(request.params, response, db);
});



 app.get('*', function(request, response) {
        response.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
      });

  // Connect to the database before starting the application server.
  mongodb.MongoClient.connect('mongodb://localhost:27017/tfodb', function (err, database) {
    if (err) {
      logger.debug(err);
      process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    logger.debug("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 3000, function () {
      var port = server.address().port;
      logger.debug("App now running on port", port);
    });

    //setting indexes:
    db.collection("entity").ensureIndex({username:1},{unique:1});
    db.collection("feed").ensureIndex({entity_id:1});
    db.collection("feed").ensureIndex({page_number:1});
    db.collection("subscribers").ensureIndex({entity_id:1});
    db.collection("subscriptions").ensureIndex({entity_id:1});

  });