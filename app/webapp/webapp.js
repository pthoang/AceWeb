'use strict';


angular.module('mainApp.webapp',['ngRoute', 'ngCookies', 'cfp.hotkeys'])

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
                $analytics.eventTrack('Package', {id: $scope.targetId, name:target.name,platform: 'web'});
                $cookies.putObject('targetSubject', target, {expires: $scope.expDate});
                subjectsService.setTargetSubject(target);
                subjectsService.setFilterText($scope.subjectFilter);
            };
            var w = angular.element($window);
            w.bind('scroll', function() {
                if(window.pageYOffset > 110) {
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

    .controller('collectionsCtrl', function ($scope, $http, $cookies, $routeParams, $analytics, quizService, collectionsService, subjectsService) {
        $scope.pageClass = 'page-collections';
        var subjectId = $routeParams.subjectId;
        $scope.subject = $cookies.getObject('targetSubject');
        $scope.modeModel = quizService.getModeModel() != undefined && quizService.getModeModel() != 3? quizService.getModeModel() : 10;
        $scope.loading = true;
        if (! $cookies.getObject('targetSubject') || $scope.subject.id != subjectId) {
            $scope.hideHeader = true;
        }

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
                    length: info[collection].exercises.length,
                    solved: countSolvedExercises(info[collection]),
                    value: collection,
                    id: info[collection].id
                });
            }

            $scope.setCollection = function(target, mode){
                $scope.targetCollection = target.id;
                $analytics.eventTrack('Collection', {id: $scope.targetCollection, name: target.name, platform: 'web'});
                quizService.setCollection(target);
                quizService.emptyExercises();
                for(var i=0; i < info[target.value].exercises.length; i++) {
                    quizService.addExercises(info[target.value].exercises[i])
                }
                quizService.setThreshold(mode ? mode:info[target.value].exercises.length);
                quizService.setModeModel($scope.modeModel)
            };
            subjectsService.setTargetSubject($scope.subject);
            $scope.collapse = {
                description: true,
                settings: true
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
                    console.log(response)
                    console.log(status)
                });

        }
    })

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



    })

    .controller('quizCtrl', function ($scope, $http, $cookies, $location,$uibModal, $routeParams, $timeout, $window, $analytics,
                                      quizService, collectionsService, hotkeys) {
        $scope.pageClass = 'page-quiz';
        $scope.subject = $cookies.getObject('targetSubject');
        if(quizService.getCollection()) {
            $scope.collectionId = quizService.getCollection().id;
            $scope.collectionName = quizService.getCollection().name;
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
        if($scope.collectionId) {
            if($scope.collectionId != $routeParams.collectionId) {
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

        quizService.shuffle($scope.exercises);
        $scope.number = 0;
        $scope.maxNumber = 0;
        $scope.round = 0;
        $scope.wrongList = [];

        $scope.showByType = function (number) {
            if($scope.exercises.length > 0){
                if($scope.number == $scope.threshold*$scope.round) {
                    return 'resultpage'
                }
                return $scope.exercises[number].type
            }
        };
        $scope.getTypeFile = function (type) {
            var typePath = $scope.appPath==''? 'webapp/': 'webapp/mobile/';
            if(type == 'resultpage') {
                return typePath + 'resultpage.html'
            } else {
                return typePath + type + '.html'
            }
        };

        $scope.incrementNumber = function() {
            $analytics.eventTrack('Exercise answered', {platform: 'web'});
            $scope.number++;
            $scope.maxNumber++;
            $scope.buttonClassNum = 0;
            window.scrollTo(0,0);
        };
        $scope.prevNumber = function () {
            if($scope.userAnswered[$scope.number]) {
                $scope.userAnswered[$scope.number].show = true;
            }
            $scope.number--;
        };
        $scope.nextNumber = function () {
            $scope.number++;
        };
        $scope.updateExercises = function () {
            // for(var k=0; k < $scope.wrongList.length; k++) {
            //     var insertIndex = Math.floor(Math.random()*10);
            //     $scope.exercises.splice($scope.threshold*$scope.round + insertIndex, 0, $scope.exercises[$scope.wrongList[k]]);
            //     console.log($scope.exercises[$scope.wrongList[k]])
            // }
            for(var k=0; k < $scope.wrongList.length; k++) {
                $scope.exercises.push($scope.exercises[$scope.wrongList[k]]);
            }
            var fromIndex = $scope.threshold*$scope.round;
            if($scope.exercises.length - fromIndex == 0) {
                return;
            }
            while($scope.exercises.length-fromIndex < $scope.threshold) {
                var randomExercise = Math.floor(Math.random()*(fromIndex));
                var checkArray = $scope.exercises.slice(fromIndex);
                if(checkArray.indexOf($scope.exercises[randomExercise]) == -1) {
                    $scope.exercises.push($scope.exercises[randomExercise])
                }
            }

        };
        $scope.incrementScore = function() {
            $scope.userAnswered[$scope.number].answer_status = true;
            $scope.score++;
        };
        $scope.startQuiz = function() {
            $analytics.eventTrack('Quiz started', {
                platform: 'web',
                collection: $scope.collectionName,
                subject: $scope.subject.name,
                subjectCode: $scope.subject.code
            });
            $scope.threshold = Math.min(quizService.getThreshold(), $scope.exercises.length);
            if($scope.threshold == quizService.getThreshold()) {
                $scope.updateExercises();
            };
            if($scope.number >= $scope.exercises.length) {
                $scope.number = 0;
                $scope.maxNumber = 0;
                $scope.round = 0;
                $scope.exercises = quizService.getExercises();
                quizService.shuffle($scope.exercises)
            }
            $scope.score = 0;
            $scope.userAnswered = {};
            $scope.wrongList = [];
            $scope.wrongIndexes = [0];
            $scope.round++;
            window.scrollTo(0,0)

        };
        $scope.openReport = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'reportModal.html',
                controller: 'reportModalCtrl',
                size: 'sm',
                resolve: {
                    exerciseId: function(){
                        return $scope.exercises[$scope.number].id;
                    },
                    url: function() {
                        return $scope.url
                    }
                }
            })
        };

        $scope.openExplanation = function () {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'explanationModal.html',
                controller: 'explanationModalCtrl',
                size: 'sm',
                resolve: {
                    exercise: function () {
                        return $scope.exercises[$scope.number]
                    }
                }
            })
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
        $scope.goBack = function () {
          $window.history.back();
        };

        $scope.getQHeight = function() {
            return document.getElementById('question').offsetHeight;
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
            return quizService.getCorrectStyle();
        };

        $scope.getWrongStyle = function () {
            return quizService.getWrongStyle()
        };

        hotkeys.bindTo($scope).add({
            combo: 'r',
            description: 'Rapporter oppgave',
            callback:function () {
                if(!($scope.number == $scope.threshold*$scope.round)) {
                    $scope.openReport()
                }
            }
        });
        hotkeys.bindTo($scope).add({
            combo:'right',
            description: 'Bla fram',
            callback: function () {
                if($scope.number < $scope.maxNumber) {
                    $scope.nextNumber();
                }
            }
        });
        hotkeys.bindTo($scope).add({
            combo:'left',
            description: 'Bla tilbake',
            callback: function () {
                if($scope.number-$scope.threshold*($scope.round-1) > 0) {
                    $scope.prevNumber();
                }
            }
        })

    })
    .controller('pdCtrl', function ($scope, quizService, hotkeys) {
        $scope.showBigImage = false;
        $scope.nextExercise = function() {
            if($scope.number < $scope.maxNumber) {
                $scope.nextNumber()
            } else {
                $scope.incrementNumber();
                $scope.nextBtn = false;
            }
            if($scope.exercises[$scope.number] && $scope.exercises[$scope.number].type == "pd") {
                randAlternatives = [];
                $scope.ordering = [];
                selectRandomAlternatives();
                styles = {}
            }
        };

        var styles = {};
        $scope.checkAnswer = function(i) {
            for(var j=0; j < $scope.ordering.length; j++) {
                hotkeys.del(''+(j+1));
            }
            if($scope.nextBtn){
                return $scope.nextExercise();
            }
            $scope.nextBtn = true;
            styles[$scope.ordering.length-1] = quizService.getCorrectStyle();
            $scope.userAnswered[$scope.number] = [$scope.exercises[$scope.number].content.corrects[0]];
            if(i == $scope.ordering.length-1) {
                $scope.incrementScore()
            }
            else {
                $scope.wrongList.push($scope.number);
                $scope.userAnswered[$scope.number].push(randAlternatives[i]);
                styles[i] = quizService.getWrongStyle();
                if(!$scope.userAnswered[$scope.number].answer_status){
                    $scope.userAnswered[$scope.number].answer_status = false;
                }
            }
        };
        $scope.getStyle = function(i) {
            return styles[i]

        };
        hotkeys.bindTo($scope).add({
            combo:'n',
            description: "Neste oppgave",
            callback: function () {
                if($scope.nextBtn) {
                    $scope.nextExercise()
                }
            }
        });
        $scope.makeHotkey = function (i, key) {
            hotkeys.bindTo($scope).add({
                combo: (key+1)+'',
                description: 'Svar på alternativ ' + (key+1),
                callback: function () {
                    $scope.checkAnswer(i)
                }
            })
        };
        $scope.ordering = [];
        var randAlternatives = [];
        var selectRandomAlternatives = function () {
            var relatedAlternatives = angular.copy($scope.exercises[$scope.number].content.wrongs);
            var relatedAlternativesInitLength = relatedAlternatives.length;
            for(var i=0; i<Math.min(relatedAlternativesInitLength, 3); i++) {
                var randNum = Math.floor(Math.random()*relatedAlternatives.length);
                randAlternatives.push(relatedAlternatives[randNum]);
                relatedAlternatives.splice(randNum,1);
                $scope.ordering.push(i);
            }
            $scope.ordering.push($scope.ordering.length);
            quizService.shuffle($scope.ordering);
            for(var j=0; j <$scope.ordering.length; j++) {
                $scope.makeHotkey($scope.ordering[j], j)
            }


        };
        selectRandomAlternatives();

        $scope.getAlternative = function(i) {
            if(i == $scope.ordering.length-1) {
                return $scope.exercises[$scope.number].content.corrects[0].answer
            }
            else {
                return randAlternatives[i].answer
            }
        };

    })
    .controller('mcCtrl', function($scope, quizService, hotkeys) {
        $scope.showBigImage = false;
        $scope.nextExercise = function () {
            if($scope.number < $scope.maxNumber) {
                $scope.nextNumber()
            } else {
                $scope.incrementNumber();
                $scope.nextBtn = false;
            }
            if($scope.exercises[$scope.number] && $scope.exercises[$scope.number].type == "mc") {
                initAlternatives();
                styles = {}
            }
        };


        var styles = {};
        $scope.checkAnswer = function(i) {
            for(var j=0; j < $scope.ordering.length; j++) {
                hotkeys.del(''+(j+1));
            }
            if($scope.nextBtn) {

                return $scope.nextExercise()
            }
            $scope.nextBtn = true;
            styles[$scope.alternatives.length-1] = quizService.getCorrectStyle();
            $scope.userAnswered[$scope.number] = [$scope.alternatives[$scope.alternatives.length-1]];
            if(i == $scope.alternatives.length-1) {
                $scope.incrementScore()
            }
            else {
                styles[i] = quizService.getWrongStyle();
                $scope.wrongList.push($scope.number);
                $scope.userAnswered[$scope.number].push($scope.alternatives[i]);
                if(!$scope.userAnswered[$scope.number].answer_status){
                    $scope.userAnswered[$scope.number].answer_status = false;
                }
            }
        };
        hotkeys.bindTo($scope).add({
            combo:'n',
            description: "Neste oppgave",
            callback: function () {
                if($scope.nextBtn) {
                    $scope.nextExercise()
                }
            }
        });
        $scope.makeHotkey = function (i, key) {
            hotkeys.bindTo($scope).add({
                    combo: (key+1)+'',
                    description: 'Svar på alternativ ' + (key+1),
                    callback: function () {
                        $scope.checkAnswer(i)
                    }
                })
        };


        var initAlternatives = function() {
            $scope.alternatives = [];
            $scope.ordering = [0];
            var wrongAlternatives = $scope.exercises[$scope.number].content.wrongs;
            quizService.shuffle(wrongAlternatives);
            for(var i=0; i<Math.min(wrongAlternatives.length, 4); i++) {
                $scope.alternatives.push(wrongAlternatives[i]);
                $scope.ordering.push(i+1)
            }
            var randCorrect = Math.floor(Math.random()*$scope.exercises[$scope.number].content.corrects.length);
            $scope.alternatives.push($scope.exercises[$scope.number].content.corrects[randCorrect]);
            quizService.shuffle($scope.ordering);
            for(var j=0; j <$scope.ordering.length; j++) {
                $scope.makeHotkey($scope.ordering[j], j)
            }

        };

        initAlternatives();

        $scope.getStyle = function(i) {
            return styles[i]
        };




    })
    .controller('tfCtrl', function($scope, quizService, hotkeys) {
        $scope.showBigImage = false;
        $scope.nextExercise = function () {
            if($scope.number < $scope.maxNumber) {
                $scope.nextNumber()
            } else {
                $scope.incrementNumber();
                $scope.nextBtn = false;
            }
            if($scope.exercises[$scope.number] && $scope.exercises[$scope.number].type == "tf") {
                $scope.initHotkeys();
                correctAnswer = $scope.exercises[$scope.number].content.correct.answer? 1:0;
                styles = {};
            }
        };

        var styles = {};
        var correctAnswer = $scope.exercises[$scope.number].content.correct.answer? 1:0;
        $scope.checkAnswer = function(i){
            for(var j=0; j < $scope.ordering.length; j++) {
                hotkeys.del(''+(j+1));
            }
            if($scope.nextBtn){
                return $scope.nextExercise()
            }

            $scope.nextBtn = true;
            styles[correctAnswer] = quizService.getCorrectStyle();
            $scope.userAnswered[$scope.number] = [$scope.alternatives[correctAnswer]];
            if(i == correctAnswer) {
                $scope.incrementScore()
            }
            else {
                styles[i] = quizService.getWrongStyle();
                $scope.wrongList.push($scope.number);
                $scope.userAnswered[$scope.number].push($scope.alternatives[i]);
                if(!$scope.userAnswered[$scope.number].answer_status){
                    $scope.userAnswered[$scope.number].answer_status = false;
                }
            }
        };
        $scope.getStyle = function(i) {
            return styles[i]
        };
        hotkeys.bindTo($scope).add({
            combo:'n',
            description: "Neste oppgave",
            callback: function () {
                if($scope.nextBtn) {
                    $scope.nextExercise()
                }
            }
        });
        $scope.makeHotkey = function (i, key) {
            hotkeys.bindTo($scope).add({
                combo: (key+1)+'',
                description: 'Svar på alternativ ' + (key+1),
                callback: function () {
                    $scope.checkAnswer(i)
                }
            })
        };
        $scope.alternatives =["False", "True"];
        $scope.ordering = [1,0];
        $scope.initHotkeys = function () {
            $scope.makeHotkey($scope.ordering[0], 0);
            $scope.makeHotkey($scope.ordering[1], 1)
        };
        $scope.initHotkeys()
    })
    .controller('mathCtrl', function ($scope, quizService) {
        $scope.showImage = 'question';
        $scope.nextBtn = true;
        $scope.nextExercise = function () {
            if($scope.number < $scope.maxNumber) {
                $scope.nextNumber();
            } else {
                $scope.userAnswered[$scope.number] = {};
                $scope.incrementScore();
                $scope.incrementNumber();
                $scope.nextBtn = false;
            };
            if($scope.exercises[$scope.number] && $scope.exercises[$scope.number].type == "math") {
                $scope.showAnswer = false;
                $scope.nextBtn = true;
            }
        };
        $scope.prevNumber = function () {
            $scope.$parent.prevNumber();
            if($scope.exercises[$scope.number] && $scope.exercises[$scope.number].type == "math") {
                $scope.showAnswer = false;
            }
        }


    })
    .controller('resultCtrl', function($scope, $http, $cookies, $analytics, hotkeys, quizService) {
        $scope.wrongIndexes.push($scope.wrongList.length);
        $scope.tabsArray = [];
        for(var i=0; i<$scope.round; i++) {
            $scope.tabsArray.push(i)
        }
        $analytics.eventTrack('Quiz completed', {
            platform: 'web',
            collection: $scope.collectionName,
            subject: $scope.subject.name,
            subjectCode: $scope.subject.code,
            score: $scope.score/$scope.threshold
        });
        var sendAnswerStatus = function () {
            var answerStatus = {};
            for(var i=$scope.threshold*($scope.round-1); i < $scope.threshold*$scope.round; i++) {
                $scope.exercises[i].answer_status = $scope.userAnswered[i].answer_status;
                answerStatus["E"+$scope.exercises[i].id] = {
                    uri:  $scope.url + '/exercises/' + $scope.exercises[i].id,
                    method: 'PUT',
                    json: true,
                    headers: {
                        'client-id': $cookies.getObject('userId')
                    },
                    body: {
                        answer_status: $scope.exercises[i].answer_status
                    }
                }
            }
            $http.post($scope.url + '/batch', answerStatus)
                .success(function (response) {
                    console.log(response);
                })
                .error(function (response) {
                    console.log(response)
                })
        };
        sendAnswerStatus();
        $scope.getWrongs = function(index) {
            var wrongs = [];
            for(var i=$scope.wrongIndexes[index]; i<$scope.wrongIndexes[index+1]; i++) {
                wrongs.push($scope.wrongList[i])
            };
            return wrongs
        };
        $scope.getCorrectAnswer = function(i) {
            var type = $scope.exercises[i].type;
            return [$scope.exercises[i].content.correct.answer];

        };

        $scope.getWrongAnswer = function(i) {
            var type = $scope.exercises[i].type;
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


        $scope.sendUserFeedback = function (positive, id) {
            if($scope.userFeedbackClicked) {
                return
            }

            if(positive) {
                $analytics.eventTrack('Positive feedback', {collectionId: $scope.collectionId, platform: 'web'});
                $http({
                    method: 'POST',
                    url: $scope.url + '/analytics',
                    data: {
                        type: 'click',
                        positive: true,
                        exercises: $scope.exercises.slice($scope.threshold*($scope.round-1), $scope.threshold*$scope.round)
                    }
                }).success(function (response) {
                    console.log(response)
                }).error(function (response) {
                    console.log(response)
                });
                $scope.userFeedbackOptions = ['Riktig vanskelighetsgrad', 'Relevante oppgaver', 'Kvalitetsoppgaver'];
                $scope.showPositiveFeedback = true;
            } else {
                $analytics.eventTrack('Negative feedback', {collectionId: $scope.collectionId, platform: 'web'});
                $http({
                    method: 'POST',
                    url: $scope.url + '/analytics',
                    data: {
                        type: 'click',
                        positive: false,
                        exercises: $scope.exercises.slice($scope.threshold*($scope.round-1), $scope.threshold*$scope.round)
                    }
                }).success(function (response) {
                    console.log(response)
                }).error(function (response) {
                    console.log(response)
                });
                $scope.userFeedbackOptions = ['For vanskelig', 'For lett', 'Irrelevante oppgaver', 'Dårlig kvalitet på oppgaver'];
                $scope.showNegativeFeedback = true;
            }
            $scope.userFeedbackSendList = {};
            $scope.userFeedbackClicked = true;
            $scope.showFeedback = true;
        };

        $scope.sendDetailedUserFeedback = function () {
            $http({
                method: 'POST',
                url: $scope.url + '/analytics',
                data: {
                    type: 'detailed',
                    fields: $scope.userFeedbackSendList,
                    exercises: $scope.exercises.slice($scope.threshold*($scope.round-1), $scope.threshold*$scope.round)
                }
            }).success(function (response) {
                $scope.showSentDetailed = true;
                console.log(response)
            }).error(function (response) {
                console.log(response)
            });
            $scope.showFeedback = false;
        };

        hotkeys.bindTo($scope).add({
            combo: 'n',
            description: 'Neste quiz',
            callback: function () {
                $scope.startQuiz()
            }
        });




    })


    .controller('reportModalCtrl', function($scope, $http, $uibModalInstance, $routeParams, exerciseId, url) {
        $scope.exerciseId = exerciseId;
        $scope.url = url;
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
        };
        $scope.send = function() {
            $scope.isSending = true;
            var message = {
                message: $scope.message,
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
        var collection;
        var exercises = [];
        var correctStyle = {'background-color': '#43A047', 'color': 'white'},
            wrongStyle = {'background-color': '#F44336', 'color': 'white'};
        var threshold;
        var modeModel;

        var setCollection = function(targetCollection) {
            collection = targetCollection
        };
        var getCollection = function () {
            return collection
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
            setCollection: setCollection,
            getCollection: getCollection,
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
        var targetSubject;
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
        var setTargetSubject = function(target) {
            targetSubject = target;
        };
        var getTargetSubject = function() {
            return targetSubject;
        };

        return {
            setInfo: setInfo,
            getInfo: getInfo,
            setFilterText: setFilterText,
            getFilterText: getFilterText,
            setTargetSubject: setTargetSubject,
            getTargetSubject: getTargetSubject
        }
    });
