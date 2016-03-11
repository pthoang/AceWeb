'use strict';


angular.module('mainApp.webapp',['ngRoute', 'ngCookies'])

    .controller('subjectsCtrl', function($scope, $http, $cookies) {
        $scope.loading = true;
        $http({
            method: 'GET',
            url: $scope.url + '/subjects/',
            headers: {
                environment: "production"
            }
        })
            .success(function (response) {
                $scope.subjects = response;
                $scope.setColor = function (color) {
                    return {"background-color": '#'+color};
                };
                $scope.setTarget = function(target) {
                    $scope.targetId = target._id;
                    $cookies.putObject('targetSubject', target);
                };
                $scope.loading = false;
            })
            .error(function(response) {
                alert("En feil oppstod, prøv igjen om 1 minutt")
            });

    })

    .controller('collectionsCtrl', function ($scope, $http, $cookies, $routeParams, quizService) {
        var subjectId = $routeParams.subjectId;
        $scope.subject = $cookies.getObject('targetSubject');
        quizService.emptyExercises();
        $scope.setColor = function (color) {
            return {"background-color": '#'+color};
        };
        $scope.modeModel = quizService.getModeModel() != undefined ? quizService.getModeModel() : 10;
        $scope.loading = true;
        $http({
            method: 'GET',
            url: $scope.url + '/subjects/' + subjectId,
            headers: {
                environment: "production"
            }
        })
            .success(function(response) {
                if (! $cookies.getObject('targetSubject') || $scope.subject._id != subjectId){
                    $scope.subject = {
                        _id: response._id,
                        code: response.code,
                        name: response.name,
                        color: response.color
                    };
                    $cookies.putObject('targetSubject', $scope.subject)
                }
                $scope.collections = [];
                var info = response.collections;
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
            });
    })

    .controller('quizCtrl', function ($scope, $cookies, $location,$uibModal, $routeParams, quizService) {

        $scope.subject = $cookies.getObject('targetSubject');
        $scope.collectionName = quizService.getCollectionName();
        $scope.exercises = quizService.getExercises();
        if($scope.exercises.length == 0) {
            $location.path('/webapp/' + $routeParams.subjectId)
        }

        //-------------- Shuffles the exercises---------------
        quizService.shuffle($scope.exercises);


        $scope.showByType = function (number) {
            if($scope.number == $scope.threshold) {
                return 'webapp/resultpage.html'
            }
            return 'webapp/' + $scope.exercises[number].type + '.html'
        };
        $scope.incrementNumber = function() {
            $scope.number++;
        };
        $scope.increaseThreshold = function () {
            $scope.round++;
            $scope.threshold = Math.min(quizService.getThreshold()*$scope.round, $scope.exercises.length);
        };
        $scope.incrementScore = function() {
            $scope.score++;
        };
        $scope.bottom = function () {
            window.scrollTo(0, document.body.scrollHeight)
        };
        $scope.startQuiz = function() {
            $scope.number = 0;
            $scope.score = 0;
            $scope.wrongList = [];
            $scope.wrongIndexes = [0];
            $scope.round = 0;
            $scope.increaseThreshold();
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
        $scope.startQuiz()

    })
    .controller('pdCtrl', function ($scope, quizService) {

        $scope.nextExercise = function() {
            $scope.incrementNumber();
            $scope.nextBtn = false;
            if($scope.exercises[$scope.number].type == "pd") {
                quizService.shuffle($scope.ordering);
                randAlternatives = [];
                selectRandomAlternatives();
                styles = {}
            }
        };

        var styles = {};
        $scope.checkAnswer = function(i) {
            if($scope.nextBtn){
                return $scope.nextExercise();

            }
            $scope.nextBtn = true;
            styles[3] = quizService.getCorrectStyle();
            if(i == 3) {
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

        var randAlternatives = [];
        var selectRandomAlternatives = function () {
            var relatedAlternatives = angular.copy($scope.exercises[$scope.number].relatedAlternatives);
            for(var i=0; i<3; i++) {
                var randNum = Math.floor(Math.random()*relatedAlternatives.length);
                randAlternatives.push(relatedAlternatives[randNum]);
                relatedAlternatives.splice(randNum,1)
            }

        };
        selectRandomAlternatives();
        $scope.ordering = [0,1,2,3];
        quizService.shuffle($scope.ordering);

        $scope.getAlternative = function(i) {
            if(i == 3) {
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
        }

    })
    .controller('tfCtrl', function($scope, quizService) {
        $scope.nextExercise = function () {
            $scope.incrementNumber();
            $scope.nextBtn = false;
            if($scope.exercises[$scope.number].type == "tf") {
                correctAnswer = $scope.exercises[$scope.number].correctAnswer? 1:0;
                styles = {}
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
        }

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
                        $scope.errorMessage = "Tom melding ble sendt"
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
    });
