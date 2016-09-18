(function () {
    'use strict';

    angular
        .module('app')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['UserService', '$location', '$rootScope', 'FlashService'];
    function RegisterController(UserService, $location, $rootScope, FlashService) {
        var vm = this;
        vm.user = {};
        
        //for demo add user pic - remove in real app
        var random = Math.floor(Math.random() * (17 - 1 + 1)) + 1;
        vm.user.pic = "/app-content/userImages/" + random + ".png" ;

        vm.register = register;

        function register() {
           

            vm.dataLoading = true;
            UserService.CreateOrg(vm.user)
                .then(function (response) {
                    if (response.success) {
                        FlashService.Success('Registration successful', true);
                        $location.path('/login');
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
        }
    }

})();
