/*

    Ziggeo API AngularJs Wrapper

    By: Khashayar Pourdeilami [me@kpourdeilami.me]

    Documentation: https://github.com/kpourdeilami/angular-Ziggeo

 */

angular.module('angular-ziggeo', [])

    .factory('$ZiggeoEvents', ['$window', function () {
        return ZiggeoApi.Events
    }])

    .factory('$ZiggeoStreams', ['$window', function () {
        return ZiggeoApi.Streams
    }])

    .factory('$ZiggeoVideos', ['$window', function () {
        return ZiggeoApi.Videos
    }])

    .factory('$ZiggeoStyles', ['$window', function () {
        return ZiggeoApi.Styles
    }])


    .directive('ziggeoAngular', function() {
        return {
            restrict: 'E',
            scope: {
                options: '=info'
            },
            templateUrl: 'partials/ziggeo.html'
        };
    });


