"use strict";

angular.module('mainApp.exercises', [])
    .controller('exercisesCtrl', function ($scope, $cookies, $window, $location, $routeParams, quizService, collectionsService, hotkeys) {
        $scope.pageClass='page-exercises';
        $scope.subject = $cookies.getObject('targetSubject');
        if(quizService.getCollection()) {
            $scope.collection = quizService.getCollection();

        }
        if($scope.subject.id != $routeParams.subjectId) {
            var info = collectionsService.getInfo();
            $scope.subject = {
                id: info.id,
                code: info.code,
                name: info.name,
                color: info.color,
                description: info.description
            };
            $cookies.putObject('targetSubject', $scope.subject, {expires: $scope.expDate})
        }
        if($scope.collection) {
            if($scope.collection.id!= $routeParams.collectionId) {
                quizService.emptyExercises()
            };
        }

        $scope.exercises = quizService.getExercises();
        if($scope.exercises.length == 0) {
            if($scope.appPath == '') {
                $location.path('/webapp/' + $routeParams.subjectId)
            } else {
                $location.path('/mobile/' + $routeParams.subjectId)
            }
        }

        $scope.exerciseOpen = {};
        for(var i=0; i < $scope.exercises.length; i++) {
            $scope.exerciseOpen[i] = true
        }
        $scope.goBack = function () {
            $window.history.back();
        };

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

        $scope.getCorrectStyle = function () {
            return {'color': '#43A047'}
        };

        $scope.openAll = function () {
            for(var i=0; i < $scope.exercises.length; i++) {
                $scope.exerciseOpen[i] = false;
            }
        };

        $scope.closeAll = function () {
            for(var i=0; i < $scope.exercises.length; i++) {
                $scope.exerciseOpen[i] = true;
            }
        }

        hotkeys.bindTo($scope)
            .add({
                combo: 'o',
                description: 'Vis fasit til alle oppgaver',
                callback: $scope.openAll
            })
            .add({
                combo: 'p',
                description: 'Skjul fasit til alle oppgaver',
                callback: $scope.closeAll
            })



    });
