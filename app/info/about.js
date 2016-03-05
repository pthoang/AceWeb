'use strict';

angular.module('mainApp.about', ['ngRoute', 'ezfb'])

    .config(function(ezfbProvider) {
        ezfbProvider.setLocale('nb_NO');
        ezfbProvider.setInitParams({
            appId: '565637640270871'
        })
    })


    .controller('aboutCtrl', function($scope, $route) {

    });


