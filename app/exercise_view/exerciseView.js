"use strict";

angular.module('mainApp.exerciseView', [])
    .controller('exerciseViewCtrl', function ($scope, $http, $location, $routeParams) {
        $scope.loading = true;
        $scope.showAnswer = {};
        $http({
            method: 'GET',
            url: $scope.url + "/exercises/" + $routeParams.exerciseId
        })
            .success(function (response) {
                $scope.loading = false;
                $scope.exercise = response
            });

        $scope.getImage = function (image) {
            var imageUrlParts = image.url.split('/');
            imageUrlParts[imageUrlParts.indexOf("upload") + 1] = "w_900";
            imageUrlParts.splice(0, 2);
            var newUrl = "https:/";
            angular.forEach(imageUrlParts, function (part) {
                newUrl = newUrl + "/" + part
            });
            return newUrl;
        };
        $scope.goBack = function () {
            $location.path($location.path().replace($routeParams.collectionId + '/exercises/' + $routeParams.exerciseId, ''))
        };
    });
