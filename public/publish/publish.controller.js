(function () {
    'use strict';

    angular
        .module('app')
        .controller('PublishController', PublishController);

    PublishController.$inject = ['UserService', '$location', '$rootScope', 'FlashService'];
    function PublishController(UserService, $location, $rootScope, FlashService) {

        var vm = this;
        vm.user = null;
        vm.org = null;
        vm.publishMessage = publishMessage;
        vm.MsgText = "";
        vm.distlist = "";

        initController();

        function initController() {

            loadCurrentUser();
        }

        function publishMessage() {
            vm.dataLoading = true;
            console.log(vm.MsgText);
            //publish message
            UserService.PublishMessage(vm.org,vm.distlist,vm.MsgText)
                .then(function (response) {
                    if (response.success) {
                        FlashService.Success('Publish a message was successful', true);
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

        

      

      
    }

})();