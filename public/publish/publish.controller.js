(function () {
    'use strict';

    angular
        .module('app')
        .controller('PublishController', PublishController);

    PublishController.$inject = ['UserService', '$location', '$rootScope', 'FlashService'];
    function PublishController(UserService, $location, $rootScope, FlashService) {

        var vm = this;
        vm.user = null;
        vm.org = {};
        vm.publishMessage = publishMessage;
        vm.MsgText = "";
        vm.distlist = "";
        vm.org_id = $rootScope.globals.currentUser.user_id;
        vm.selected_distlist = {};
        vm.dlists = [];


        initController();

        function initController() {

            loadOrgdlist();

            loadCurrentUser();
        }

        function publishMessage() {
            vm.dataLoading = true;
            console.log(vm.MsgText);
            //publish message
            var list = angular.fromJson(vm.selected_distlist)
            UserService.PublishMessage(vm.org,list,vm.MsgText)
                .then(function (response) {
                    if (response.success) {
                        FlashService.Success('Publish a message was successful', true);
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
        }

        function loadCurrentUser() {
            console.log("org_id: " + $rootScope.globals.currentUser.user_id);
            UserService.GetEntityById($rootScope.globals.currentUser.user_id)
                .then(function (response) 
                    { 
                        if(response.success) 
                            vm.org = response.data;

                         vm.dataLoading = false;
                    });
        }

        
        function loadOrgdlist()
        {
            vm.dataLoading = true;
            UserService.GetDistributionLists(vm.org_id).then(function (response){ 
                if(response.success) 
                    vm.dlists = response.data.data;
                vm.dataLoading = false;


            });
        }
    }

})();