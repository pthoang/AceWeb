"use strict";

angular.module('mainApp.services', [])
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