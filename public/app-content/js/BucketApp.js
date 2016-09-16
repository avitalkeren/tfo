var app = angular.module('AngularUIBucketApp', [
	"ngRoute",
	"ngTouch",
	"mobile-angular-ui",
	"firebase"
	]);

app.controller('MainController', ['$scope','$firebaseSimpleLogin','$location',
	function($scope,$firebaseSimpleLogin,$location) {

		var ref = new Firebase("https://burning-fire-1723.firebaseio.com");
		var auth = $firebaseSimpleLogin(ref);

        // Initialized the user object
        $scope.user = {
        	username: "",
        	password: ""
        };

        $scope.logout = function() {
    		$scope.loggedIn = false;   // to toggle display of SignUp/Logout
    		$scope.user = {            // re init the user object
    			username: "",
    			password: ""
    		};
    		$location.path('/');       // redirect to home page after logout    
		}

		$scope.showSignUp = function() {
		    $scope.user = {            // re init the user object
		    	username: "",
		    	password: ""
		    };
		    $location.path('/signUp'); // redirect to SignUp page 
		}

		$scope.signUp = function() {
		    $scope.org = {            // re init the user object
		    	username: "",
		    	password: ""
		    };
		    $location.path('/'); // redirect to SignUp page 
		}

        // Sign In auth function
        $scope.signin = function() {
        	console.log('m dsd');
        	var email = $scope.user.username;
        	var password = $scope.user.password;
        	if (email && password) {
        		console.log('me in');
        // Sign In Logic
        auth.$login('password', {
        	email: email,
        	password: password
        })
        .then(function(user) {
                // On success callback
                console.log('Username and password found');
                $scope.loggedIn = true;
                $scope.userEmailId = user.email;
                $location.path('/userHome');
            }, function(error) {
                // On failure callback
                console.log('Username and password not found');
            });
    }
}

}
]);

app.config(function($routeProvider, $locationProvider) {
	$routeProvider.when('/', {
		templateUrl: "signIn.html"
	});
	$routeProvider.when('/userHome', {
		templateUrl: 'userHome.html'
	});
	$routeProvider.when('/signUp', {
		templateUrl: 'signUp.html'
	});
});
