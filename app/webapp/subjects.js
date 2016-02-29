'use strict';

angular.module('mainApp.subjects', [
    'ngRoute'
])

    .controller('subjectsCtrl', function($scope, $http) {
        $http.get('http://78.91.3.147:3000/subjects/')
            .success(function(response) {
                $scope.info = response;
                $scope.setColor = function (color) {
                    return {"background-color": '#'+color};
                };
                $scope.setTargetId = function(subjectId) {
                    $scope.targetId = subjectId
                }

            })

    })
    .service('targetService', function() {


    });