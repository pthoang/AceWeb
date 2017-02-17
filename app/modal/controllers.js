'use strict';
angular.module("mainApp.modalcontrollers", [])
    .controller('reportModalCtrl', function($scope, $http, $uibModalInstance, $routeParams, exerciseId, url) {
        $scope.exerciseId = exerciseId;
        $scope.url = url;
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
        };
        $scope.send = function() {
            $scope.isSending = true;
            var message = {
                message: $scope.userMail+": "+$scope.message,
                device: 'web'
            };

            $http.post($scope.url + '/exercises/'+$scope.exerciseId+'/reports', message)
                .success(function(response) {
                    $scope.sendPressed = true;
                    $scope.isSuccess = true;
                })
                .error(function (response, errorCode) {
                    $scope.sendPressed = true;
                    $scope.isSuccess = false;
                    if(errorCode == 400) {
                        $scope.errorMessage = "Vennligst fyll inn en kommentar"
                    }
                    else {
                        $scope.errorMessage = "Feil på serverside"
                    }
                });
        };
        $scope.tryAgain = function() {
            $scope.isSending = false;
            $scope.sendPressed = false;
        }
    })
    .controller('explanationModalCtrl', function ($scope, $uibModalInstance, exercise) {
        $scope.exercise = exercise;

        $scope.close = function () {
            $uibModalInstance.dismiss('close')
        }
    })
    .controller('suggestionModalCtrl', function($scope, $http, $uibModalInstance, url){
        $scope.url = url;
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
        };
        $scope.send = function() {
            $scope.isSending = true;
            var message = {
                type: 'suggestion',
                name: $scope.subjectName,
                code: $scope.subjectCode
            };

            $http.post($scope.url + '/analytics', message)
                .success(function(response) {
                    $scope.sendPressed = true;
                    $scope.isSuccess = true;
                })
                .error(function (response, errorCode) {
                    $scope.sendPressed = true;
                    $scope.isSuccess = false;
                    if(errorCode == 400) {
                        $scope.errorMessage = "Vennligst fyll inn feltene"
                    }
                    else {
                        $scope.errorMessage = "Feil på serverside"
                    }
                });
        };
        $scope.tryAgain = function() {
            $scope.isSending = false;
            $scope.sendPressed = false;
        }
    });