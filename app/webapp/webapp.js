'use strict';


angular.module('mainApp.webapp',['ngRoute', 'ngCookies'])

    .controller('subjectsCtrl', function($scope, $http, $cookies, $uibModal, $location,$window, subjectsService) {
        $scope.loading = true;
        var initSubjects = function(subjectsInfo) {
            $scope.subjects = subjectsInfo;
            $scope.subjectSearch = function(item) {
                if(!$scope.subjectFilter || (item.name.toLowerCase().indexOf($scope.subjectFilter.toLowerCase()) != -1) || (item.code.toLowerCase().indexOf($scope.subjectFilter.toLowerCase()) != -1)) {
                    return true;
                }
                return false;
            };
            $scope.setColor = function (color) {
                return {"background-color": '#'+color};
            };
            $scope.setTarget = function(target) {
                $scope.targetId = target._id;
                $cookies.putObject('targetSubject', target);
                subjectsService.setScrollPos(target._id);
                subjectsService.setFilterText($scope.subjectFilter);
            };
            //var w = angular.element($window);
            //w.bind('scroll', function() {
            //    $scope.$apply();
            //});
            //$scope.getSearchClass = function() {
            //    if(window.pageYOffset > 200) {
            //        $scope.searchPosHolder = true;
            //        return 'fixed-search'
            //    } else {
            //        $scope.searchPosHolder = false;
            //        return 'container-fluid';
            //    }
            //};
            $scope.subjectFilter = subjectsService.getFilterText();
            $scope.loading = false;
            $scope.resetMain = function() {
                subjectsService.setFilterText('');
                subjectsService.setScrollPos('0');
            };
            if(subjectsService.getScrollPos()) {
                $location.replace();
                $location.hash(subjectsService.getScrollPos());
            }
        };
        if(subjectsService.getInfo()) {
            initSubjects(subjectsService.getInfo());
        }
        else {
            $http({
                method: 'GET',
                url: $scope.url + '/subjects/'
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
    .run(function($anchorScroll) {
        $anchorScroll.yOffset = window.innerHeight/2 - 70;
    })

    .controller('collectionsCtrl', function ($scope, $http, $cookies, $routeParams, quizService, collectionsService, subjectsService) {
        var subjectId = $routeParams.subjectId;
        $scope.subject = $cookies.getObject('targetSubject');
        quizService.emptyExercises();
        $scope.setColor = function (color) {
            return {"background-color": '#'+color};
        };
        $scope.modeModel = quizService.getModeModel() != undefined ? quizService.getModeModel() : 10;
        $scope.loading = true;
        if (! $cookies.getObject('targetSubject') || $scope.subject._id != subjectId) {
            $scope.hideHeader = true;
        }
        var initCollections = function(collectionsInfo) {
            if ($scope.hideHeader){
                $scope.subject = {
                    _id: collectionsInfo._id,
                    code: collectionsInfo.code,
                    name: collectionsInfo.name,
                    color: collectionsInfo.color,
                    description: collectionsInfo.description
                };
                $cookies.putObject('targetSubject', $scope.subject);
                $scope.hideHeader = false;
            }
            $scope.collections = [];
            var info = collectionsInfo.collections;
            for(var collection in info) {
                $scope.collections.push({
                    name: collection,
                    value: info[collection].length
                });
            }

            $scope.setCollection = function(target, length){

                $scope.targetCollection = target;
                quizService.setCollectionName(target);
                for(var i=0; i < info[target].length; i++) {
                    var stringExercise = JSON.stringify(info[target][i]);
                    quizService.addExercises(JSON.parse(stringExercise))
                }
                quizService.setThreshold(length ? length:info[target].length);
                quizService.setModeModel($scope.modeModel)
            };
            $scope.loading = false;
        };
        if(collectionsService.getInfo() && collectionsService.getInfo()._id == $routeParams.subjectId ) {
            initCollections(collectionsService.getInfo())
        }
        else {
            $http({
                method: 'GET',
                url: $scope.url + '/subjects/' + subjectId
            })
                .success(function(response) {
                    initCollections(response);
                    collectionsService.setInfo(response);
                });

        }
    })

    .controller('quizCtrl', function ($scope, $http, $cookies, $location,$uibModal, $routeParams, $window, quizService, collectionsService) {

        $scope.subject = $cookies.getObject('targetSubject');
        $scope.collectionName = quizService.getCollectionName();
        $scope.exercises = quizService.getExercises();
        if($scope.exercises.length == 0) {
            $location.path('/webapp/' + $routeParams.subjectId)
        }
        if($scope.subject._id != $routeParams.subjectId) {
            var info = collectionsService.getInfo();
            $scope.subject = {
                _id: info._id,
                code: info.code,
                name: info.name,
                color: info.color,
                description: info.description
            };
            $cookies.putObject('targetSubject', $scope.subject)
        }

        quizService.shuffle($scope.exercises);
        $scope.number = 0;
        $scope.round = 0;
        $scope.wrongList = [];

        $scope.showByType = function (number) {
            if($scope.number == $scope.threshold*$scope.round) {
                return 'webapp/resultpage.html'
            }
            return 'webapp/' + $scope.exercises[number].type + '.html'
        };
        $scope.incrementNumber = function() {
            $scope.number++;
            $scope.buttonClassNum = 0;
        };
        $scope.updateExercises = function () {
            for(var k=0; k < $scope.wrongList.length; k++) {
                var insertIndex = Math.floor(Math.random()*10);
                $scope.exercises.splice($scope.threshold*$scope.round + insertIndex, 0, $scope.exercises[$scope.wrongList[k]])
            }
            var fromIndex = $scope.threshold*$scope.round;
            if($scope.exercises.length - fromIndex == 0) {
                return;
            }
            while($scope.exercises.length-fromIndex < 10) {
                var randomExercise = Math.floor(Math.random()*(fromIndex));
                var checkArray = $scope.exercises.slice(fromIndex);
                if(checkArray.indexOf($scope.exercises[randomExercise]) == -1) {
                    $scope.exercises.push($scope.exercises[randomExercise])
                }
            }
        };
        $scope.incrementScore = function() {
            $scope.score++;
        };
        $scope.startQuiz = function() {
            $scope.threshold = Math.min(quizService.getThreshold(), $scope.exercises.length);
            if($scope.threshold == 10) {
                $scope.updateExercises();
            }
            if($scope.number >= $scope.exercises.length) {
                $scope.number = 0;
                $scope.round = 0;
                $scope.exercises = quizService.getExercises();
                quizService.shuffle($scope.exercises)
            }
            $scope.score = 0;
            $scope.wrongList = [];
            $scope.wrongIndexes = [0];
            $scope.round++;

        };
        $scope.openReport = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'reportModal.html',
                controller: 'reportModalCtrl',
                size: 'sm',
                resolve: {
                    exercise_id: function(){
                        return $scope.exercises[$scope.number]._id;
                    },
                    url: function() {
                        return $scope.url
                    }
                }
            })
        };
        $scope.setColor = function (color) {
            return {"background-color": '#'+color};
        };

        $scope.checkScreenRatio = function() {

            if(window.innerHeight > window.innerWidth) {
                return true;
            }
            return false;
        };

        var w = angular.element($window);
        w.bind('resize', function() {
            $scope.$apply();

        });
        $scope.buttonClassNum = 0;
        $scope.getButtonClass = function(i, length) {

            if($scope.buttonClassNum) {
                return 'btn-quizloaded'
            }
            return 'btn-quiz';
        };
        $scope.setButtonClassNum = function() {
            $scope.buttonClassNum = 1
        };

        $scope.startQuiz();

        $scope.getQHeight = function() {
            return document.getElementById('question').offsetHeight;
        }

    })
    .controller('pdCtrl', function ($scope, quizService) {
        $scope.nextExercise = function() {
            $scope.incrementNumber();
            $scope.nextBtn = false;
            if($scope.exercises[$scope.number].type == "pd") {
                randAlternatives = [];
                $scope.ordering = [];
                selectRandomAlternatives();
                quizService.shuffle($scope.ordering);
                styles = {}
            }
        };

        var styles = {};
        $scope.checkAnswer = function(i) {
            if($scope.nextBtn){

                return $scope.nextExercise();

            }
            $scope.nextBtn = true;
            styles[$scope.ordering.length-1] = quizService.getCorrectStyle();
            if(i == $scope.ordering.length-1) {
                $scope.incrementScore()
            }
            else {
                $scope.wrongList.push($scope.number);
                styles[i] = quizService.getWrongStyle()
            }
        };
        $scope.getStyle = function(i) {
            return styles[i]

        };
        $scope.ordering = [];
        var randAlternatives = [];
        var selectRandomAlternatives = function () {
            var relatedAlternatives = angular.copy($scope.exercises[$scope.number].relatedAlternatives);
            var relatedAlternativesInitLength = relatedAlternatives.length;
            for(var i=0; i<Math.min(relatedAlternativesInitLength, 3); i++) {
                var randNum = Math.floor(Math.random()*relatedAlternatives.length);
                randAlternatives.push(relatedAlternatives[randNum]);
                relatedAlternatives.splice(randNum,1);
                $scope.ordering.push(i);
            }
            $scope.ordering.push($scope.ordering.length);

        };
        selectRandomAlternatives();
        quizService.shuffle($scope.ordering);

        $scope.getAlternative = function(i) {
            if(i == $scope.ordering.length-1) {
                return $scope.exercises[$scope.number].correctAnswer
            }
            else {
                return randAlternatives[i]
            }
        };

    })
    .controller('mcCtrl', function($scope, quizService) {

        $scope.nextExercise = function () {
            $scope.incrementNumber();
            $scope.nextBtn = false;
            if($scope.exercises[$scope.number].type == "mc") {
                initAlternatives();
                quizService.shuffle($scope.ordering);
                styles = {}
            }


        };
        var styles = {};
        $scope.checkAnswer = function(i) {
            if($scope.nextBtn) {
                return $scope.nextExercise()
            }
            $scope.nextBtn = true;
            styles[$scope.alternatives.length-1] = quizService.getCorrectStyle();
            if(i == $scope.alternatives.length-1) {
                $scope.incrementScore()
            }
            else {
                styles[i] = quizService.getWrongStyle();
                $scope.wrongList.push($scope.number)
            }
        };


        var initAlternatives = function() {
            $scope.alternatives = [];
            $scope.ordering = [0];
            var wrongAlternatives = $scope.exercises[$scope.number].alternatives;
            for(var i=0; i<wrongAlternatives.length; i++) {
                $scope.alternatives.push(wrongAlternatives[i]);
                $scope.ordering.push(i+1)
            }
            $scope.alternatives.push($scope.exercises[$scope.number].correctAnswer);
        };

        initAlternatives();
        quizService.shuffle($scope.ordering);

        $scope.getStyle = function(i) {
            return styles[i]
        };


    })
    .controller('tfCtrl', function($scope, quizService) {
        $scope.nextExercise = function () {
            $scope.incrementNumber();
            $scope.nextBtn = false;
            if($scope.exercises[$scope.number].type == "tf") {
                correctAnswer = $scope.exercises[$scope.number].correctAnswer? 1:0;
                styles = {};
            }
        };

        var styles = {};
        var correctAnswer = $scope.exercises[$scope.number].correctAnswer? 1:0;

        $scope.checkAnswer = function(i){
            if($scope.nextBtn){
                return $scope.nextExercise()
            }

            $scope.nextBtn = true;
            styles[correctAnswer] = quizService.getCorrectStyle();
            if(i == correctAnswer) {
                $scope.incrementScore()
            }
            else {
                styles[i] = quizService.getWrongStyle();
                $scope.wrongList.push($scope.number)
            }
        };
        $scope.getStyle = function(i) {
            return styles[i]
        };
        $scope.alternatives =["False", "True"];
        $scope.ordering = [1,0]
    })
    .controller('mtfCtrl', function ($scope, quizService) {

        $scope.nextExercise = function() {
            $scope.incrementNumber();
            $scope.nextBtn = false;
            if($scope.exercises[$scope.number].type == "mtf") {
                $scope.alternatives = $scope.exercises[$scope.number].alternatives;
                quizService.shuffle($scope.alternatives);
                $scope.checkModel = {
                    0: false,
                    1: false,
                    2: false,
                    3: false
                };
                $scope.tabModel = "solution";
            }
        };

        $scope.alternatives = $scope.exercises[$scope.number].alternatives;
        quizService.shuffle($scope.alternatives);
        $scope.checkModel = {
            0: false,
            1: false,
            2: false,
            3: false
        };
        $scope.tabModel = "solution";
        $scope.checkAnswer = function() {

            $scope.nextBtn = true;
            var point = 1;
            for(var i=0; i<$scope.alternatives.length; i++) {
                if(! $scope.checkModel[i] == $scope.alternatives[i].correctAnswer) {
                    point = 0
                }

            }
            if(point) {
                $scope.incrementScore();
            }
            else {
                $scope.wrongList.push($scope.number)
            }
        };
        $scope.setColor = function(value) {
            if(value) {
                return $scope.tabModel=='solution' ? quizService.getCorrectStyle():{'background-color': '#E6E6E6', 'border-color': '#ADADAD'}
            }
        }



    })
    .controller('resultCtrl', function($scope) {
        $scope.wrongIndexes.push($scope.wrongList.length);
        $scope.tabsArray = [];
        for(var i=0; i<$scope.round; i++) {
            $scope.tabsArray.push(i)
        }

        $scope.getWrongs = function(index) {
            var wrongs = [];
            for(var i=$scope.wrongIndexes[index]; i<$scope.wrongIndexes[index+1]; i++) {
                wrongs.push($scope.wrongList[i])
            };
            return wrongs
        };
        $scope.getCorrectAnswer = function(i) {
            var type = $scope.exercises[i].type;
            if(type == "mtf") {
                var correctInfo = [];
                for(var j=0; j<$scope.exercises[i].alternatives.length; j++) {
                    if($scope.exercises[i].alternatives[j].correctAnswer){
                        correctInfo.push($scope.exercises[i].alternatives[j].statement)
                    }
                }
                return correctInfo;
            }
            else {
                return [$scope.exercises[i].correctAnswer];
            }
        };

        $scope.getWrongAnswer = function(i) {
            var type = $scope.exercises[i].type;
            if(type == "mtf") {
                var wrongInfo = [];
                for(var j=0; j<$scope.exercises[i].alternatives.length; j++) {
                    if(!$scope.exercises[i].alternatives[j].correctAnswer) {
                        wrongInfo.push( $scope.exercises[i].alternatives[j].statement)
                    }
                }
                return wrongInfo
            }
        };

        $scope.showContinueBtn = function() {
            if($scope.threshold == $scope.exercises.length) {
                return false;
            }
            return $scope.number < $scope.exercises.length || $scope.wrongList.length > 0;
        };
        $scope.showAgainBtn = function() {
            if($scope.threshold == $scope.exercises.length) {
                return true;
            }
            return $scope.number >= $scope.exercises.length && $scope.wrongList.length == 0;
        };

        $scope.getFeedback = function() {
            var percentage = $scope.score/$scope.threshold;
            var feedback;

            if(percentage >= 0 && percentage <= 0.29) {
                feedback = ["Godt forsøk","God innsats","Prøv igjen", "Sånn passe"]
            }
            else if(percentage > 0.29 && percentage <= 0.59) {
                feedback = ["Bra", "Godt jobba", "Respektabelt"]
            }
            else if(percentage > 0.59 && percentage <= 0.99) {
                feedback = ["Pent!", "Glimrende!", "Storartet!", "Ypperlig!"]
            }
            else if(percentage > 0.99) {
                feedback = ["FANTASTISK!" , "IMPONERENDE!", "PERFEKT!", "OVERLEGENT!"]
            }

            var randomInt = Math.floor(Math.random()*feedback.length);
            return feedback[randomInt];


        };

        $scope.feedbackText = $scope.getFeedback();

    })


    .controller('reportModalCtrl', function($scope, $http, $uibModalInstance, exercise_id, url) {
        $scope.exercise_id = exercise_id;
        $scope.url = url;
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
        };
        $scope.send = function() {
            $scope.isSending = true;
            var message = {
                message: $scope.message
            };

            $http.post($scope.url + '/reports/' + $scope.exercise_id, message)
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

    .controller('suggestionModalCtrl', function($scope, $http, $uibModalInstance, url){
        $scope.url = url;
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
        };
        $scope.send = function() {
            $scope.isSending = true;
            var message = {
                name: $scope.subjectName,
                code: $scope.subjectCode
            };

            $http.post($scope.url + '/reports/suggestions/', message)
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
    })

    .service('quizService', function() {
        var collectionName;
        var exercises = [];
        var correctStyle = {'background-color': '#43A047', 'color': 'white'},
            wrongStyle = {'background-color': '#F44336', 'color': 'white'};
        var threshold;
        var modeModel;

        var setCollectionName = function(name) {
            collectionName = name
        };
        var getCollectionName = function () {
            return collectionName
        };
        var addExercises = function(exercise) {
            exercises.push(exercise)
        };
        var getExercises = function() {
            return exercises
        };
        var emptyExercises = function() {
            exercises = []
        };

        var getCorrectStyle = function() {
            return correctStyle
        };
        var getWrongStyle = function() {
            return wrongStyle
        };

        var setThreshold = function(value) {
            threshold = value
        };
        var getThreshold = function() {
            return threshold
        };

        var setModeModel = function(mode) {
            modeModel = mode;
        };
        var getModeModel = function() {
            return modeModel
        };

        var shuffle = function(array) {
            var m = array.length;
            var t, i;

            while(m) {
                i = Math.floor(Math.random()* m--);

                t = array[m];
                array[m] = array[i];
                array[i] = t;
            }
            return array
        };

        return {
            setCollectionName: setCollectionName,
            getCollectionName: getCollectionName,
            addExercises: addExercises,
            getExercises: getExercises,
            emptyExercises: emptyExercises,
            getCorrectStyle: getCorrectStyle,
            getWrongStyle: getWrongStyle,
            setThreshold: setThreshold,
            getThreshold: getThreshold,
            setModeModel: setModeModel,
            getModeModel: getModeModel,
            shuffle: shuffle
        };
    })
    .service('collectionsService', function() {
        var collectionsInfo;

        var setInfo = function (info) {
            collectionsInfo = info;
        };
        var getInfo = function() {
            return collectionsInfo
        };

        return {
            setInfo: setInfo,
            getInfo: getInfo
        }
    })
    .service('subjectsService', function() {
        var subjectsInfo;
        var filterText;
        var scrollPos;
        var filterRemove = 0;
        var setInfo = function(info) {
            subjectsInfo = info;
        };
        var getInfo = function() {
            return subjectsInfo;
        };
        var setFilterText = function(text) {
            filterText = text;
        };
        var getFilterText = function() {
            return filterText;
        };
        var setScrollPos = function (number) {
            scrollPos = number;
        };
        var getScrollPos = function() {
            return scrollPos;
        };
        var setFilterRemove = function() {
            filterRemove = filterRemove==1? 0:1;
        };
        var getFilterRemove = function() {
            return filterRemove;
        };
        return {
            setInfo: setInfo,
            getInfo: getInfo,
            setFilterText: setFilterText,
            getFilterText: getFilterText,
            setScrollPos: setScrollPos,
            getScrollPos: getScrollPos,
            setFilterRemove: setFilterRemove,
            getFilterRemove: getFilterRemove
        }
    });
