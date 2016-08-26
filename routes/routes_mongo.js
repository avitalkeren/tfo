var
  configRoutes,
  mongodb = require('mongodb'),
  log4js = require('log4js'),
  logger = log4js.getLogger(),
  mongoServer = new mongodb.Server(
    'localhost',27017
  ),
  dbHandle    = new mongodb.Db(
    'tfodb', mongoServer, { safe : true }
  ),

  makeMongoId = mongodb.ObjectID;

  configRoutes = function ( app, server ) {
  app.get( '/', function ( request, response ) {
    response.redirect( '/index.html' );
  });

  app.all( '/:obj_type/*?', function ( request, response, next ) {
    response.contentType( 'json' );
    next();
  });
  
//http://localhost:3000/users/list
  
  app.get( '/:obj_type/list', function ( request, response ) {
	 logger.debug("get " + request.params.obj_type + " list");
    dbHandle.collection(
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

  //create collections
  //usage: curl --data "p1=v1&p2=v2" http://localhost:3000/users/create/
  app.post( '/:obj_type/create', function ( request, response ) {
	logger.debug("create " + request.params.obj_type);
		
    dbHandle.collection(
      request.params.obj_type,
      function ( outer_error, collection ) {
        var
          options_map = { safe: true },
          obj_map     = request.body;
          
          logger.debug("body " +  JSON.stringify(obj_map));
    
          

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
  app.get( '/:obj_type/read/:id', function ( request, response ) {
    var find_map = { _id: makeMongoId( request.params.id ) };
    dbHandle.collection(
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

  app.post( '/:obj_type/update/:id', function ( request, response ) {
    var
      find_map = { _id: makeMongoId( request.params.id ) },
      obj_map  = request.body;

    dbHandle.collection(
      request.params.obj_type,
      function ( outer_error, collection ) {
        var
          sort_order = [],
          options_map = {
            'new' : true, upsert: false, safe: true
          };

        collection.findAndModify(
          find_map,
          sort_order,
          obj_map,
          options_map,
          function ( inner_error, updated_map ) {
            response.send( updated_map );
          }
        );
      }
    );
  });

  app.get( '/:obj_type/delete/:id', function ( request, response ) {
    var find_map = { _id: makeMongoId( request.params.id ) };

    dbHandle.collection(
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
};

module.exports = { configRoutes : configRoutes };
dbHandle.open( function () {
  console.log( '** Connected to MongoDB **' );
});

