// server.js

var
http    = require('http'),
express = require('express'),
 // angularRoute = require('angular-route'),
 log4js = require('log4js'),
 logger  = log4js.getLogger(),
passwordHash = require('password-hash'),

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

  // Create a database variable outside of the database connection callback to reuse the connection pool in your app.
  var db;

  app.all( '/api/:obj_type/*?', function ( request, response, next ) {
    response.contentType( 'json' );
    next();
  });

  app.post('/api/authenticate', function ( request, response, next ) {


    logger.debug("for auth org with username: " + request.body.username);

    var find_map = { username: request.body.username};

    db.collection('org',
      function ( outer_error, collection ) {
        collection.findOne(find_map, {password: 1}, function(err, document) {
          if (err){
            logger.debug(err);
            response.send({'message':'An error has occurred: ' + err});
            return;
          }
          if (document == null || document.password == null)
          {
            logger.debug("user not found");
            response.send({"message": "user not found"});
            return;
          }
            logger.debug("hashed password: " + document.password);
            retval = passwordHash.verify(request.body.password, document.password);
           if (!retval)
           {
              logger.debug("incorrect password");
              response.send({"message": "incorrect password"});
              return;
           }
           response.send({"success": true, "data": {"_id": document._id}});
          });
      });    
  });

  app.get( '/api/:obj_type/:id/subscribers/list', function ( request, response ) {

    logger.debug("for " + request.params.obj_type + " with ID: " + request.params.id  + " list of subscribers");

    var find_map = { entity_id: ObjectID( request.params.id ) , entity_type: request.params.obj_type};

    db.collection('subscribers',
      function ( outer_error, collection ) {
        collection.find(find_map, {subscribers_list: 1}).toArray(
          function ( inner_error, map_list ) {
            response.send( map_list );
          });
      });
  });

  app.get( '/api/:obj_type/list', function ( request, response ) {
   logger.debug("get " + request.params.obj_type + " list");

   db.collection(
    request.params.obj_type,
    function ( outer_error, collection ) {
      collection.find().toArray(
        function ( inner_error, map_list ) {
          response.send( map_list );
        }
        );
    }
    );
 });


 //create org
  app.post( '/api/org/create', function ( request, response ) {
    logger.debug("create new Org");
    
    db.collection("org",
      function ( outer_error, collection ) {
        var
        options_map = { safe: true },
        obj_map     = request.body;
        
        logger.debug("body " +  JSON.stringify(obj_map));

        if (obj_map.password == null) 
        {
          logger.debug("password is null");
          response.send({"message":"password is empty"});
          return;
        }
        //hash password
        obj_map.password = passwordHash.generate(obj_map.password);
            
        //create new dist list:
        obj_map.distribution_list = [{
          is_everyone: 1,
          list_name: 'everyone',
          subscribers_number: 0, 
          total_num_of_tweets: 0,
          tweets_pages: 0,
          subscribers_id: null
        }];

        //init other properties:
        obj_map.subscribers_number = 0;
        obj_map.total_num_of_tweets = 0;


        collection.insert(
          obj_map,
          options_map,
          function ( inner_error, result_map ) {
            if (inner_error != null) 
              {
                logger.debug("inner_error " + inner_error);
                response.send({"message": inner_error});
                return;
              }
              response.send( result_map );
          });
      });
  });


 //create user
  app.post( '/api/user/create', function ( request, response ) {
    logger.debug("create new User");
    
    db.collection("user",
      function ( outer_error, collection ) {
        var
        options_map = { safe: true },
        obj_map     = request.body;
        
        logger.debug("body " +  JSON.stringify(obj_map));

        if (obj_map.password == null) 
        {
          logger.debug("password is null");
          response.send({"message":"password is empty"});
          return;
        }
        //hash password
        obj_map.password = passwordHash.generate(obj_map.password);
            
        //add to org dlist:
        var dlist = obj_map.dlist;
      
        //init other properties:
      

        collection.insert(
          obj_map,
          options_map,
          function ( inner_error, result_map ) {
            if (inner_error != null) 
              {
                logger.debug("inner_error " + inner_error);
                response.send({"message": inner_error});
                return;
              }
              response.send( result_map );
          });
      });
  });


  //create collections
  //usage: curl --data "p1=v1&p2=v2" http://localhost:3000/users/create/
  app.post( '/api/:obj_type/create', function ( request, response ) {
    logger.debug("create " + request.params.obj_type);
    
    db.collection(
      request.params.obj_type,
      function ( outer_error, collection ) {
        var
        options_map = { safe: true },
        obj_map     = request.body;
        
        logger.debug("body " +  JSON.stringify(obj_map));

        if (request.params.obj_type == "user" || request.params.obj_type == "org")
        {
          //hash password
          obj_map.password = passwordHash.generate(obj_map.password);
        }        

        collection.insert(
          obj_map,
          options_map,
          function ( inner_error, result_map ) {
            if (inner_error != null) logger.debug("inner_error " + inner_error);
            response.send( result_map );
          }
          );
      }
      );
  });

//usage: http://localhost:3000/users/read/53f63a65948852900a002816
app.get( '/api/:obj_type/read/:id', function ( request, response ) {
  logger.debug("get " + request.params.obj_type + " with id: " +request.params.id );
  var find_map = { _id: ObjectID( request.params.id ) };
  db.collection(
    request.params.obj_type,
    function ( outer_error, collection ) {
      collection.findOne(
        find_map,
        function ( inner_error, result_map ) {
          response.send( result_map );
        }
        );
    }
    );
});

app.post( '/api/:obj_type/update/:id', function ( request, response ) {
  var
  find_map = { _id: ObjectID( request.params.id ) },
  obj_map  = request.body;

  logger.debug("update " + request.params.obj_type + " with id: " + request.params.id);
  logger.debug("body " +  JSON.stringify(obj_map));
  db.collection(
    request.params.obj_type,
    function ( outer_error, collection ) {
      var
      sort_order = [],
      options_map = {
        'new' : true, upsert: false, safe: true
      };

      obj_map._id = ObjectID(obj_map._id); 
      collection.findAndModify(
        find_map,
        sort_order,
        obj_map,
        options_map,
        function ( inner_error, updated_map ) {
          logger.debug(inner_error);
          response.send( updated_map );
        }
        );
    }
    );
});

app.get( '/api/:obj_type/delete/:id', function ( request, response ) {
  var find_map = { _id: ObjectID( request.params.id ) };

  db.collection(
    request.params.obj_type,
    function ( outer_error, collection ) {
      var options_map = { safe: true, single: true };

      collection.remove(
        find_map,
        options_map,
        function ( inner_error, delete_count ) {
          response.send({ delete_count: delete_count });
        }
        );
    }
    );
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

    db.collection('org').ensureIndex({username:1},{unique:1});

  });