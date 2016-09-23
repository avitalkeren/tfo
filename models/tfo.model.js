var log4js = require('log4js');
var logger  = log4js.getLogger();
var passwordHash = require('password-hash');
var mongodb = require("mongodb");
var Promise = require("promise");
var ObjectID = mongodb.ObjectID; 

//constans
var ENTITY_TYPE_ORG = "org";
var ENTITY_TYPE_USER = "user";
var COLLECTION_ENTITY = "entity"
var COLLECTION_SUBSCRIBERS = "subscribers"
var COLLECTION_FEED = "feed"

//authenticate user - get user by username and validate password
var Authenticate = function(request, response, db)
{
	var username = request.body.username;
	var password = request.body.password;

	logger.debug("for auth org with username: " + username);

  var find_map = { username: username};

  db.collection('entity',
    function ( outer_error, collection ) {
      collection.findOne(find_map, {password: 1}, function(err, document) {
        if (err){
         SendError(response,'An error has occurred: ' + err);
         return;
       }
       if (document == null || document.password == null)
       {
         SendError(response,"user not found");
         return;
       }
       logger.debug("hashed password: " + document.password);
       retval = passwordHash.verify(password, document.password);
       if (!retval)
       {
         SendError(response,"incorrect password");
         return;
       }
       SendSucess(response, {"_id": document._id});
     });
    });  
};

var GetEntityById = function(request_params, response, db){
   var user_id = request_params.id;
   var find_map = {_id: ObjectID(user_id)};
  logger.debug("set entity with id: " + user_id);

   AsyncFindOneObj(find_map,COLLECTION_ENTITY,db).then(function (res){
      logger.debug("res: " + JSON.stringify(res));

        SendSucess(response,res);
    }, function(error){
       SendError(response,error);
    });
};


var GetOrgSubscribersList = function(request_params, response, db){
    var org_id = request_params.id;
    var find_map = {entity_id: ObjectID(org_id)};

    AsyncFindList(find_map,{},COLLECTION_SUBSCRIBERS,db).then(function (res){
      logger.debug("GetOrgSubscribersList res: " + JSON.stringify(res));

        SendSucess(response,res);
    }, function(error){
       SendError(response,error);
    });

};


var Publish = function(request, response, db){
  logger.debug("body " +  JSON.stringify(request.body));

  var message = request.body.message;
  var org = request.body.org;
  var dlist = request.body.dlist;
  logger.debug("Publish message: " + message);
  //create tweet:
  var tweet = {
    _id: new ObjectID(),
    text: message,
    create_datetime: Date.now(),
    publisher_id: ObjectID(org._id),
    publisher_name: org.fullName,
    publisher_pic: org.pic,
    org_dsit_id: ObjectID(dlist._id),
    org_dsit_name: dlist.list_name
  };

  logger.debug(JSON.stringify(tweet));
  //add to org feeed

  var parr = [];
  parr.push(AsyncPublishToUser(ObjectID(org._id),org.entity_type, tweet,db));

  //publish message to each user in list
  for (var i = dlist.subscribers.length - 1; i >= 0; i--) {
    var userid = ObjectID(dlist.subscribers[i]._id);
    parr.push(AsyncPublishToUser(userid, ENTITY_TYPE_USER, tweet, db));
  }
  //call all promises
  Promise.all(parr).then(function(res){
    SendSucess(response,res);
  }, function(error){
    SendError(response,error);
  });
};

var GetFeedForUser = function(request_params, response, db){
    var user_id = request_params.uid;
    var page_number = parseInt(request_params.page_number);
    logger.debug("GetFeedForUser: " + user_id + " page_number: " + page_number);
    
    var find_map = {entity_id: ObjectID(user_id), page_number: page_number};

    AsyncFindOneObj(find_map,COLLECTION_FEED,db).then(function (res){
        SendSucess(response,res);
    }, function(error){
       SendError(response,error);
    });
  };



var CreateOrg = function(request, response, db)
{
  logger.debug("create new Org: " + JSON.stringify(request.body));

  var org = request.body;

  if (org.password == null) {
    SendError(response,"password is null");
    return;
  }

  org.entity_type = ENTITY_TYPE_ORG;
  //hash password:
  org.password = passwordHash.generate(org.password);
        
  //init other properties:
  org.subscribers_number = 0;
  org.total_num_of_tweets = 0;

  //insert to entity collection
  AsyncInsertObj(org, COLLECTION_ENTITY, db).then(function(res){
    //new org ID:
    org._id = res.insertedIds[0];

    logger.debug("org created with id: " +  org._id );

    var distlist = {
      entity_id: ObjectID(org._id),
      entity_type: ENTITY_TYPE_ORG,
      is_everyone: 1,
      list_name: 'everyone',
      subscribers_number: 0,
      total_num_of_tweets: 0,
      tweets_pages: 0,
      subscribers: []
    };
    AsyncInsertObj(distlist, COLLECTION_SUBSCRIBERS, db).then(function(res){
      SendSucess(response,res);
    },function(error){
      SendError(response,error);
    });
  }, function(error){
    SendError(response,error);
  });
};

var CreateSubscribers = function(request, response, db){
  logger.debug("create new Subscribers: " + JSON.stringify(request.body));

  var subscriber = request.body;
  subscriber.entity_id = ObjectID(subscriber.entity_id);

  AsyncInsertObj(subscriber, COLLECTION_SUBSCRIBERS, db).then(function(res){
      SendSucess(response,res);
    },function(error){
      SendError(response,error);
    });
};

var UpdateSubscribers = function(request, response, db){
  logger.debug("update new Subscribers: " + JSON.stringify(request.body));

  var subscriber = request.body;
  subscriber.entity_id = ObjectID(subscriber.entity_id);

  AsyncUpdateObj(subscriber, COLLECTION_SUBSCRIBERS, db).then(function(res){
      SendSucess(response,res);
    },function(error){
      SendError(response,error);
    });
};


var DeleteSubscribers = function(request_params, response, db){
    logger.debug("deleting Subscribers: " + JSON.stringify(request_params.id));

    var Subscribers_id = request_params.id;
    AsyncDeleteObj(Subscribers_id,COLLECTION_SUBSCRIBERS,db).then(function(res){
      SendSucess(response,res);
    },function(error){
      SendError(response,error);
    });
};


function CreateUser(request, response, db)
{
    logger.debug("create new USER :" +  JSON.stringify(request.body));
    
    var user = request.body;

     //check password
     if (user.password == null) {
      SendError("password is null");
      return;
     }
     //hash password
     user.password = passwordHash.generate(user.password);
     //set dlist id
     user.org_id = ObjectID(user.org_id);
     user.entity_type = ENTITY_TYPE_USER;

      AsyncInsertObj(user, COLLECTION_ENTITY, db).then(function(res) {
        var newuserid = res.insertedIds[0];
        SendSucess(response,newuserid);
        logger.debug("New Users Id: " + newuserid);
      }, function(error){
        SendError(response,error);
    });
}

//----------------------------Promises-----------------------------
//-----------------------------------------------------------------


function AsyncUpdateObj(obj, colname,db){
  var  find_map = { _id: ObjectID( obj._id ) };
  var sort_order = [];
  var options_map = {'new' : true, upsert: false, safe: true};
  obj._id = ObjectID(obj._id); 

  return new Promise(function(resolve, reject) {
    db.collection(colname,
      function ( outer_error, collection ) {
        collection.findAndModify(find_map,
          sort_order,
          obj, 
          options_map,
          function ( inner_error, result_map ) {
            if (inner_error != null) {
              reject(inner_error);
            }
            else{
              resolve(result_map);
            }
          });
      });
  });
}

function AsyncInsertObj(obj, colname,db){
  var options_map = { safe: true };

  return new Promise(function(resolve, reject) {
    db.collection(colname,
      function ( outer_error, collection ) {
        collection.insert(obj, options_map,
         function ( inner_error, result_map ) {
          if (inner_error != null) {
            reject(inner_error);
          }
          else{ 
           resolve(result_map);
         }
       });
      });
  });
}

function AsyncDeleteObj(id, colname,db){
 
  var find_map = {_id: ObjectID(id)};
  var options_map = {safe: true, single: true};


  return new Promise(function(resolve, reject) {
    db.collection(colname,
      function ( outer_error, collection ) {
        collection.remove(find_map, options_map,
         function ( inner_error, delete_count ) {
          if (inner_error != null) {
            reject(inner_error);
          }
          else{ 
           resolve({ delete_count: delete_count });
         }
       });
      });
  });
}

function AsyncFindOneObj( find_map,colname,db){
  
  return new Promise(function(resolve, reject) {
    db.collection(colname,
      function ( outer_error, collection ) {
        collection.findOne(
          find_map,
          function ( inner_error, result_map ) {
            if (inner_error != null) {
              reject(inner_error);
            }
            else{ 
              resolve(result_map);
            }
          });
      });
  });
}

function AsyncFindList( find_map, proj_map,colname,db){
  
  return new Promise(function(resolve, reject) {
    db.collection(colname,
      function ( outer_error, collection ) {
        collection.find(
          find_map,
          proj_map).toArray(
          function ( inner_error, map_list ) {
            if (inner_error != null) {
              reject(inner_error);
            }
            else{ 
              resolve(map_list);
            }
          });
      });
  });
}


function AsyncFindFeedWithMaxPage( find_map,db){
  
  return new Promise(function(resolve, reject) {
    db.collection(COLLECTION_FEED,
      function ( outer_error, collection ) {
        collection.find(find_map).sort({page_number:-1}).limit(1).toArray(
          function ( inner_error, map_list ) {
            if (inner_error != null) {
              reject(inner_error);
            }
            else{ 
              resolve(map_list[0]);
            }
          });
      });
  });
}

function AsyncPublishToUser(userid, usretype,tweet,db){
    //get feed page:
    var feedPage = null;
    logger.debug("AsyncPublishToUser: " + userid);
    var find_map = { entity_id: ObjectID(userid) } ;
     return  AsyncFindFeedWithMaxPage(find_map,db).then(function (res){
     	 logger.debug("Hi");

        if (res != null){
          logger.debug("found document with ID: " + res._id + " page number: " + res.page_number);
          feedPage = res;

          //update feed
          if (feedPage.count == 100)
          {
            //create a new feed page
            feedPage = {
              entity_id: userid, 
              entity_type: usretype,
              page_number: res.page_number + 1,
              count: 1, 
              tweet_list: [tweet]
            };
            //insert feed
            return AsyncInsertObj(feedPage, "feed", db);
          }

          feedPage.tweet_list.push(tweet);
          feedPage.count = feedPage.count + 1;

          //update feed page
          return AsyncUpdateObj(feedPage, "feed", db);
        }
        else  //doc fas not found, create a new one
        {
        	logger.debug("feed not found, creating a new one");
          //create first feed page:
          feedPage = {
            entity_id: userid, 
            entity_type: usretype,
            page_number: 1,
            count: 1, 
            tweet_list: [tweet]
          };

          //insert feed
          return AsyncInsertObj(feedPage, "feed", db);
        }

     }, function (error){ 
      logger.debug("error " + error);
     });
}




//-----------------------------error handaling-------------------------------
//---------------------------------------------------------------------------

function HandelMongoResponse(response, inner_error, result_map )
{
	if (inner_error != null) 
	{
        SendError(response,"inner_error " + inner_error);
        return;
    }
	SendSucess(response,result_map);
}

function SendSucess(response, data)
{
	logger.debug("success: " + JSON.stringify(data))
	response.send({"success": true, "data": data });
}

function SendError(response, errorMsg){
	logger.debug(errorMsg);
    response.send({"message": errorMsg});
}

//-----------------------------exports-------------------------------
//-------------------------------------------------------------------

module.exports.Authenticate = Authenticate;
module.exports.CreateOrg = CreateOrg;
module.exports.CreateUser = CreateUser;
module.exports.Publish = Publish;
module.exports.GetFeedForUser = GetFeedForUser;
module.exports.GetEntityById = GetEntityById;
module.exports.GetOrgSubscribersList = GetOrgSubscribersList;
module.exports.CreateSubscribers = CreateSubscribers;
module.exports.DeleteSubscribers = DeleteSubscribers;
module.exports.UpdateSubscribers = UpdateSubscribers;