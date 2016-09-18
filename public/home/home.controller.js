(function () {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['UserService', '$rootScope'];
    function HomeController(UserService, $rootScope) {
        var vm = this;

        vm.org = null;
        vm.page_number = 0;
        vm.feedPages = [];
        vm.feed = [];

        initController();

        function initController() {
            loadCurrentUser();
            loadUserFeed(1);

        }

       function loadCurrentUser() {
        console.log("user id: " + $rootScope.globals.currentUser.user_id);
        UserService.GetById($rootScope.globals.currentUser.user_id)
        .then(function (response) 
        { 
            console.log(response.data);
            if(response.success) 
                vm.org = response.data.data;
        });
        }

        function loadUserFeed(page_number) {
        console.log("org_id: " + $rootScope.globals.currentUser.user_id);
        UserService.GetFeed($rootScope.globals.currentUser.user_id, page_number)
        .then(function (response) 
        { 
            if(response.success) 
            {
                var feedPage = response.data.data;
                if (feedPage == null) return;
                vm.feedPages.push(feedPage);
                console.log();

                vm.page_number = feedPage.page_number;
                if (feedPage.tweet_list != null)
                {
                    vm.feed.push.apply(vm.feed,feedPage.tweet_list);    
                    console.log(vm.feed);
                }
            }
        });
        }
    }

})();