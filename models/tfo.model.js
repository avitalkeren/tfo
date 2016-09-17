


var log4js = require('log4js');
var logger  = log4js.getLogger();
var passwordHash = require('password-hash');
var mongodb = require("mongodb");
var Promise = require("promise");
var ObjectID = mongodb.ObjectID; 

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
    org_dsit_list: dlist
  };


 

  AsyncPublishToUser(ObjectID(org._id),"org", tweet,db).then(function(res){
    SendSucess(response,res);
  }, function(error){
    SendError(response,error);

  });

  //get subsribers for dlist

  //get tweet page

  //publish message to each user in list

  //add to org published messages

}

 var GetFeedForUser = function(request_params, response, db){
    var user_id = request_params.uid;
    var page_number = parseInt(request_params.page_number);
    logger.debug("GetFeedForUser: " + user_id + " page_number: " + page_number);
    
    var find_map = {entity_id: ObjectID(user_id), page_number: page_number};

    AsyncFindOneObj(find_map,"feed",db).then(function (res){
        SendSucess(response,res);
    }, function(error){
       SendError(response,error);
    });
  }


function AsyncPublishToUser(userid, usretype,tweet,db)
{
    //get feed page:
    var feedPage = null;

    var find_map = { $query: {entity_id: userid}, $orderby: { page : -1 } }
     return  AsyncFindOneObj(find_map,"feed",db).then(function (res){
        if (res != null){
          logger.debug("found document with ID: " + res._id);
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






var CreateOrg = function(request, response, db)
{
	logger.debug("create new Org");
    
    db.collection("org",
      function ( outer_error, collection ) {
        var
        options_map = { safe: true },
        obj_map     = request.body;
        
        logger.debug("body " +  JSON.stringify(obj_map));

        if (obj_map.password == null) 
        {
        	SendError(response,"password is null");
          return;
        }
        //hash password
        obj_map.password = passwordHash.generate(obj_map.password);
        
        //create new  subscribers list
        //CreateNewSubscribersList();

       

      //  collection.insert();



        //create new dist list:
        obj_map.distribution_list = [{
        	_id: new ObjectID(),
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
          options_map, HandelMongoResponse);

      });
};

function CreateNewSubscribersList( response, db, entity_id, entity_type)
{
	var options_map = { safe: true };
	 var SubscribersList = {
        	entity_id: ObjectID(entity_id),
        	entity_type: entity_type,
        	subscribers_list: []
        };

     db.collection("subscribers",
     	 function ( outer_error, collection ) {
     	 	collection.insert(options_map,SubscribersList, 
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
}

//promise
function AsyncCreateUser(user,db) {
	return AsyncInsertObj(user, "user", db);
}




function AsyncUpdateObj(obj, colname,db){

      var  find_map = { _id: ObjectID( obj._id ) };
      var sort_order = [];
      var options_map = {'new' : true, upsert: false, safe: true};
      obj._id = ObjectID(obj._id); 

// perform some asynchronous operation, resolve or reject the promise when appropriate.
    return new Promise(function(resolve, reject) {
    //insert user to users
  db.collection(colname,
       function ( outer_error, collection ) {
        collection.findAndModify(find_map, sort_order, obj, options_map,
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
// perform some asynchronous operation, resolve or reject the promise when appropriate.
  	return new Promise(function(resolve, reject) {
   	//insert user to users
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


//promise
function AsyncCreateSubscription(entity_id,entity_type ,db) {

	var subscription = {
		entity_id: entity_id, 
		entity_type: entity_type,
		subscriptions: []
	}

	return AsyncInsertObj(subscription, "subscriptions", db);
}

//promise
function AsyncInsertNewSubscription(userid,entity_type ,db) {

	var subscription = {
		entity_id: entity_id, 
		entity_type: entity_type,
		subscriptions: []
	}

	return AsyncInsertObj(subscription, "subscriptions", db);
}

function CreateUser(request, response, db)
{
	logger.debug("create new User");
    
    var user = request.body;

    logger.debug("user :" +  JSON.stringify(user));

    //get user dlist id
   	var distlist = ObjectID(user.distlist);
    delete user.distlist;

	//check password
     if (user.password == null) {
     	SendError("password is null");
     	return;
     }
     //hash password
     user.password = passwordHash.generate(user.password);
     //set dlist id
     user.org_id = ObjectID(user.org_id);

	var asyncCreateUserPromise = AsyncCreateUser(user,db);
	asyncCreateUserPromise.then(function(res) {

		var newuserid = res.insertedIds[0];
		logger.debug("New Id: " + newuserid);
		
		//create subscription for the user with ID
		var asyncCreateSubscriptionPromise = AsyncCreateSubscription(newuserid,"user",db);
		asyncCreateSubscriptionPromise.then(function(res){
			var newsubid = res.insertedIds[0];
			logger.debug("New Id: " + newuserid);

			//add dllist to subscribed

		}, function(error){

		});

		SendSucess(response,res);
	}, function(error){
		SendError(response,error);
	});
}

function AddSubscriptionToUser(userid, subid, subtype, db)
{
	//get user subscriptions

	//if there is no creste one

	//add the sub to the user list.

}

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

module.exports.Authenticate = Authenticate;
module.exports.CreateOrg = CreateOrg;
module.exports.CreateUser = CreateUser;
module.exports.Publish = Publish;
module.exports.GetFeedForUser = GetFeedForUser;
