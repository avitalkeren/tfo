(function () {
    'use strict';


    //disable jquery routing
    //---------------------------------------------------
   // $.mobile.ajaxEnabled = false;
   // $.mobile.linkBindingEnabled = false; 
  //  $.mobile.hashListeningEnabled = false; 
   // $.mobile.pushStateEnabled = false; 
   // $.mobile.changePage.defaults.changeHash = false;
    //---------------------------------------------------

    angular
        .module('app', ['ngRoute', 'ngCookies' ,"mobile-angular-ui"])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                controller: 'HomeController',
                templateUrl: 'home/home.view.html',
                controllerAs: 'vm'
            })

            .when('/login', {
                controller: 'LoginController',
                templateUrl: 'login/login.view.html',
                controllerAs: 'vm'
            })

            .when('/register', {
                controller: 'RegisterController',
                templateUrl: 'register/register.view.html',
                controllerAs: 'vm'
            })

            .when('/adduser', {
                controller: 'AdduserController',
                templateUrl: 'adduser/adduser.view.html',
                controllerAs: 'vm'
            })
            .when('/dlists', {
                controller: 'DlistsController',
                templateUrl: 'dlists/dlists.view.html',
                controllerAs: 'vm'
            })
            .otherwise({ redirectTo: '/login' });
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http'];
    function run($rootScope, $location, $cookieStore, $http) {
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        });
    }

})();