(function () {
    'use strict';

    angular
        .module('app')
        .factory('UserService', UserService);

    UserService.$inject = ['$http'];
    function UserService($http) {
        var service = {};

        service.GetEntityById = GetEntityById;
        service.CreateOrg = CreateOrg;
        service.CreateNewUser = CreateNewUser;
        service.PublishMessage = PublishMessage;
        service.GetFeed = GetFeed;
        service.GetDistributionLists = GetDistributionLists;
        service.AddSubscriber = AddSubscriber;
        service.UpdateSubscriber = UpdateSubscriber;
        service.DeleteSubscriber = DeleteSubscriber;

        return service;

        function GetFeed(userid, page_number) {

            return $http.get('/api/feed/' + userid + "/" + page_number).then(handleSuccess, handleError('Error getting feed'));
        }

        function PublishMessage(org, dlist, message) {

            return $http.post('/api/org/publish', {"org": org, "dlist": dlist, "message": message}).then(handleSuccess, handleError('Error creating user'));
        }

        function CreateOrg(user) {
            return $http.post('/api/org/create', user).then(handleSuccess, handleError('Error creating Org entity'));
        }

        function GetDistributionLists(userid){
            return $http.get('/api/subscribers/list/' + userid).then(handleSuccess, handleError('Error getting Distribution list'));
        }

        function AddSubscriber(subscriber){
            return $http.post('/api/subscribers/create', subscriber).then(handleSuccess, handleError('Error creating subscribers '));
        }

        function UpdateSubscriber(subscriber)
        {
            return $http.post('/api/subscribers/update', subscriber).then(handleSuccess, handleError('Error update subscribers '));
        }

        function DeleteSubscriber(subscriber_id){
            return $http.get('/api/subscribers/delete/' + subscriber_id).then(handleSuccess, handleError('Error deleting subscribers '));
        }

        function CreateNewUser(user){
            return $http.post('/api/user/create', user).then(handleSuccess, handleError('Error creating user entity'));
        }


        function GetEntityById(id) {
            return $http.get('/api/entity/read/' + id).then(handleSuccess, handleError('Error getting user/org by id'));
        }

        // private functions

        function handleSuccess(res) {

            console.log("success");

            return { success: true, data: res.data };
        }

        function handleError(error) {
            return function () {
                return { success: false, message: error };
            };
        }
    }

})();
