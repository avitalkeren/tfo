(function () {
    'use strict';

    angular
        .module('app')
        .controller('AdduserController', AdduserController);

    AdduserController.$inject = ['UserService', '$location', '$rootScope', 'FlashService'];
    function AdduserController(UserService, $location, $rootScope, FlashService) {

        var vm = this;
        vm.user = {};
        vm.org = null;
        vm.dlists = [];
        vm.allUsers = [];
      //  vm.deleteUser = deleteUser;
        vm.addUserToDlist = addUserToDlist;
        vm.selected_distlist = {};
        vm.org_id = $rootScope.globals.currentUser.user_id;

        //for demo add user pic - remove in real app
        var random = Math.floor(Math.random() * (17 - 1 + 1)) + 1;
        vm.user.pic = "/app-content/userImages/" + random + ".png" ;


        initController();

        function initController() {

            loadOrgdlist();
        }

        function addUserToDlist() {
            vm.dataLoading = true;
            vm.user.org_id = vm.org_id;

            UserService.CreateNewUser(vm.user)
                .then(function (response) {
                    if (response.success) {
                        FlashService.Success('adding a user was successful', true);
                        console.log("response:");
                        console.log(response);
                        AdduserTodlist(response.data.data);
                        //$location.path('/');
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
        }

        function AdduserTodlist(user_id){

            var lists = [angular.fromJson(vm.selected_distlist)];
            //add to everyone always

            if (lists[0].is_everyone == 0)
            {
                for (var i = vm.dlists.length - 1; i >= 0; i--) {
                    if (vm.dlists[i].is_everyone == 1)
                        lists.push(vm.dlists[i]);
                    
                }
            }
            console.log("ffff");
            console.log(lists);
            for (var i = lists.length - 1; i >= 0; i--) {
                if (lists[i].subscribers == null) lists[i].subscribers = [];
                lists[i].subscribers.push({_id: user_id, name: vm.user.fullName, pic: vm.user.pic });
                lists[i].subscribers_number++;
                UserService.UpdateSubscriber(lists[i]).then(function (response) {
                    if (response.success) {
                        FlashService.Success('update a dlist was successful', true);
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
            }
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

        function loadOrgdlist()
        {
            UserService.GetDistributionLists(vm.org_id).then(function (response){ 
                if(response.success) 
                    vm.dlists = response.data.data;
                console.log("lists: ");
                console.log(vm.dlists);
                //$("#dlist_listview").listview("refresh");

            });
        }
        

      


    }

})();