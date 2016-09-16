// Define the `tfoApp` module
var tfoApp = angular.module('tfoApp',['ngRoute']);

// Define the `mainController` controller on the `phonecatApp` module
tfoApp.controller('mainController', function mainController($scope) {

  jQuery.ajax({
    url: '/rest/org/list',
    type: 'GET',
    success: function (data) {
      $scope.orgs = data;
      console.log(data);

    }

  });
});

tfoApp.config(function($routeProvider, $locationProvider) {

  $routeProvider
  // route for the home page
  .when('/', {
    templateUrl : 'pages/home.html',
    controller  : 'mainController'
  })
  // route for the about page
  .when('/about', {
    templateUrl : 'pages/about.html',
    controller  : 'aboutController'
  })
  // route for the contact page
  .when('/contact', {
    templateUrl : 'pages/contact.html',
    controller  : 'contactController'
  });
});