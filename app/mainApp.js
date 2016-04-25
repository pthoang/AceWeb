'use strict';

// Declare app level module which depends on views, and components
angular.module('mainApp', [
    'ngRoute',
    'ui.bootstrap',
    'ngAnimate',
    'mainApp.about',
    'mainApp.webapp'
])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/about', {
                templateUrl: 'info/about.html',
                controller: 'aboutCtrl'
            })
            .when('/webapp', {
                templateUrl: 'webapp/webapp.html',
                controller: 'subjectsCtrl'
            })
            .when('/webapp/:subjectId', {
                templateUrl: 'webapp/collections.html',
                controller: 'collectionsCtrl'
            })
            .when('/webapp/:subjectId/:collectionName', {
                templateUrl: 'webapp/quiz.html',
                controller: 'quizCtrl'
            })
            .otherwise({redirectTo: '/webapp'});
    }])
    .controller('mainController', function($scope, $window, $http) {
        $http.post('/api', '')
            .success(function (response) {
                $scope.url = response;
                $scope.showAll = true;
            });

        $scope.loadNavbar = function() {
            var location = $window.location.hash.split('/');
            if(location.length < 3) {
                return 'navbar/navbar_main.html'
            }
            else if(location.length == 3) {
                return 'navbar/navbar_collections.html'
            }
            else if(location.length == 4) {
                return 'navbar/navbar_quiz.html'
            }


        }


});
