(function () {
    'use strict';

    angular
        .module('app')
        .factory('UserService', UserService);

    UserService.$inject = ['$http'];
    function UserService($http) {
        var service = {};

        service.GetAll = GetAll;
        service.GetById = GetById;
        service.GetByUsername = GetByUsername;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;
        service.CreateNewUser = CreateNewUser;
        service.PublishMessage = PublishMessage;
        service.GetFeed = GetFeed;

        return service;

        function GetFeed(userid, page_number) {

            return $http.get('/api/feed/' + userid + "/" + page_number).then(handleSuccess, handleError('Error getting feed'));
        }



        function PublishMessage(org, dlist, message) {

            return $http.post('/api/org/publish', {"org": org, "dlist": dlist, "message": message}).then(handleSuccess, handleError('Error creating user'));

        }

         function Create(user) {

            return $http.post('/api/org/create', user).then(handleSuccess, handleError('Error creating user'));
        }

        function CreateNewUser(user){

            return $http.post('/api/user/create', user).then(handleSuccess, handleError('Error creating user'));
        }
        
        function Update(org) {
            return $http.post('/api/org/update/' + org._id, org).then(handleSuccess, handleError('Error updating org'));
        }

        function GetAll() {
            return $http.get('/api/users').then(handleSuccess, handleError('Error getting all users'));
        }

        function GetById(id) {
            return $http.get('/api/org/read/' + id).then(handleSuccess, handleError('Error getting user by id'));
        }

        function GetByUsername(username) {
            return $http.get('/api/org/read/username/' + username).then(handleSuccess, handleError('Error getting user by username'));
        }

/*
        function Create(user) {
            return $http.post('/api/users', user).then(handleSuccess, handleError('Error creating user'));
        }
*/
       

        function Delete(id) {
            return $http.delete('/api/users/' + id).then(handleSuccess, handleError('Error deleting user'));
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
