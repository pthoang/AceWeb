"use strict";

angular.module('mainApp.subjects', [])
    .controller('subjectsCtrl', function($scope, $http, $cookies, $uibModal, $location,$window, $analytics, subjectsService) {
        $scope.loading = true;
        var initSubjects = function(subjectsInfo) {
            $scope.subjects = subjectsInfo;
            $scope.subjectSearch = function(item) {
                if(!$scope.subjectFilter || (item.name.toLowerCase().indexOf($scope.subjectFilter.toLowerCase()) != -1) || (item.code.toLowerCase().indexOf($scope.subjectFilter.toLowerCase()) != -1)) {
                    return true;
                }
                return false;
            };

            $scope.setTarget = function(target) {
                $scope.targetId = target.id;
                $analytics.eventTrack('Subject', {id: $scope.targetId, name:target.name,platform: 'web'});
                $cookies.putObject('targetSubject', target, {expires: $scope.expDate});
                subjectsService.setTargetSubject(target);
                subjectsService.setFilterText($scope.subjectFilter);
            };
            var w = angular.element($window);
            w.bind('scroll', function() {
                if(window.pageYOffset > document.getElementById('0').offsetTop-10) {
                    document.getElementById('0').blur();
                    $scope.stickySearch = true;

                } else {
                    if(document.getElementById('1').value.length > 0 && $scope.stickySearch) {
                        document.getElementById('0').focus();
                    }
                    $scope.stickySearch = false;
                }
                $scope.$apply();
            });

            $scope.$on('$destroy', function () {
                w.unbind('scroll');
            });

            $scope.subjectFilter = subjectsService.getFilterText();
            $scope.prevSubject = subjectsService.getTargetSubject();
            if($cookies.getObject('targetSubject') && !$scope.prevSubject) {
                $scope.prevSubject = $cookies.getObject('targetSubject')
            }
            $scope.loading = false;
            $scope.resetMain = function() {
                subjectsService.setFilterText('');
            };
        };
        if(subjectsService.getInfo()) {
            initSubjects(subjectsService.getInfo());
        }
        else {
            $http({
                method: 'GET',
                url: $scope.url + '/subjects/',
                headers: {
                    platform: 'web'
                }
            })
                .success(function (response) {
                    initSubjects(response);
                    subjectsService.setInfo(response);
                })
                .error(function(response) {
                    alert("En feil oppstod, prøv igjen om 1 minutt" + resp)
                });
        }

        $scope.openSuggestion = function() {
            $analytics.eventTrack('Open Suggestion', {platform: 'web'});
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'suggestionModal.html',
                controller: 'suggestionModalCtrl',
                size: 'sm',
                resolve: {
                    url: function() {
                        return $scope.url
                    }
                }
            })
        };


    })