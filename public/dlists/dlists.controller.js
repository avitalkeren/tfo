﻿(function () {
    'use strict';

    angular
        .module('app')
        .controller('DlistsController', DlistsController);

    DlistsController.$inject = ['UserService', '$rootScope'];
    function DlistsController(UserService, $rootScope) {
        var vm = this;

        vm.org = null;
       
       vm.newDlistName = null;
       vm.addItem = addItem;

       function addItem(){
        console.log("adding :" + vm.newDlistName);
        vm.org.distribution_list.push({
            is_everyone: 0, 
            list_name: vm.newDlistName,
            subscribers_id: null, 
            subscribers_number: 0, 
            total_num_of_tweets: 0,
            tweets_pages: 0
        });

            //update org:
            UserService.Update(vm.org) .then(function (response) 
                    { 
                        console.log(response.success)
                        if(response.success) 
                            vm.org = response.data;
                    });

       }

        initController();

        function initController() {
            loadCurrentUser();
           
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


    }

})();