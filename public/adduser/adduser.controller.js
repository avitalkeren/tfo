(function () {
    'use strict';

    angular
        .module('app')
        .controller('AdduserController', AdduserController);

    AdduserController.$inject = ['UserService', '$location', '$rootScope', 'FlashService'];
    function AdduserController(UserService, $location, $rootScope, FlashService) {

        var vm = this;
        vm.user = null;
        vm.org = null;
        vm.allUsers = [];
        vm.deleteUser = deleteUser;
        vm.addUserToDlist = addUserToDlist;

        initController();

        function initController() {

            loadCurrentUser();
            //loadAllUsers();
        }

        function addUserToDlist() {
            vm.dataLoading = true;
            vm.user.org_id = vm.org._id;

            UserService.CreateNewUser(vm.user)
                .then(function (response) {
                    if (response.success) {
                        FlashService.Success('adding a user was successful', true);
                        $location.path('/');
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
        }

        function loadCurrentUser() {
            console.log("org_id: " + $rootScope.globals.currentUser.user_id);
            UserService.GetById($rootScope.globals.currentUser.user_id)
                .then(function (response) 
                    { 
                        if(response.success) 
                            vm.org = response.data;
                    });
        }

        

        function loadAllUsers() {
            UserService.GetAll()
                .then(function (users) {
                    vm.allUsers = users;
                });
        }

        function deleteUser(id) {
            UserService.Delete(id)
            .then(function () {
                loadAllUsers();
            });
        }
    }

})();