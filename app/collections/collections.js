"use strict";

angular.module('mainApp.collections', [])
    .controller('collectionsCtrl', function ($scope, $http, $cookies, $routeParams,
                                             $analytics, quizService, collectionsService, subjectsService) {
        $scope.pageClass = 'page-collections';
        var subjectId = $routeParams.subjectId;
        $scope.subject = $cookies.getObject('targetSubject');
        $scope.modeModel = quizService.getModeModel() != undefined && quizService.getModeModel() != 3? quizService.getModeModel() : 10;
        $scope.loading = true;
        if (! $cookies.getObject('targetSubject') || $scope.subject.id != subjectId) {
            $scope.hideHeader = true;
        };

        var countSolvedExercises = function (collection) {
            var solved = 0;
            angular.forEach(collection.exercises, function (exercise) {
                solved += exercise.answer_status ? 1:0;
            });
            return solved
        };


        var initCollections = function(collectionsInfo) {
            $scope.subject = {
                id: collectionsInfo.id,
                code: collectionsInfo.code,
                name: collectionsInfo.name,
                color: collectionsInfo.color,
                description: collectionsInfo.description
            };
            $cookies.putObject('targetSubject', $scope.subject, {expires: $scope.expDate});
            $scope.hideHeader = false;
            $scope.collections = [];
            var info = collectionsInfo.collections;
            for(var collection in info) {
                $scope.collections.push({
                    name: info[collection].name,
                    exercises: info[collection].exercises,
                    solved: countSolvedExercises(info[collection]),
                    id: info[collection].id
                });
            }

            $scope.setCollection = function(target, mode){
                $scope.targetCollection = target.id;
                $analytics.eventTrack('Collection', {id: $scope.targetCollection, name: target.name, platform: 'web'});
                quizService.setCollection(target);
                quizService.emptyExercises();
                for(var i=0; i < target.exercises.length; i++) {
                    quizService.addExercises(target.exercises[i])
                }
                quizService.setThreshold(mode ? mode:target.exercises.length);
                quizService.setModeModel($scope.modeModel)
            };
            subjectsService.setTargetSubject($scope.subject);
            $scope.collapse = {
                description: true,
                settings: true
            };

            $scope.getAllCollection = function () {
                $analytics.eventTrack('Quiz me', {
                    subject: $scope.subject.name,
                    subjectCode: $scope.subject.code,
                    platform: 'web'
                });
                var allCollection = {
                    id: 'quizme',
                    name: 'Quiz me - Tilfeldig blanding av alt',
                    exercises: []

                };
                angular.forEach($scope.collections, function (collection) {
                    allCollection.exercises = allCollection.exercises.concat(collection.exercises);
                });
                return allCollection
            };


            $scope.isMath = function () {
                return ($scope.subject.code.indexOf('TMA') != -1)
            };
            if($scope.isMath()) {
                $scope.modeModel = quizService.getModeModel() == 3 || quizService.getModeModel() == 0 ? quizService.getModeModel(): 3;
            };

            $scope.loading = false;


        };
        if(collectionsService.getInfo() && collectionsService.getInfo().id == $routeParams.subjectId ) {
            initCollections(collectionsService.getInfo())
        }
        else {
            quizService.emptyExercises();
            $http({
                method: 'GET',
                url: $scope.url + '/subjects/' + subjectId + ($routeParams.hashCode ? '/'+$routeParams.hashCode:''),
                headers: {
                    'client-id': $cookies.getObject('userId')
                }
            })
                .success(function(response) {
                    initCollections(response);
                    collectionsService.setInfo(response);
                })
                .error(function (response, status) {
                    console.log(response);
                    console.log(status)
                });

        }
    });
