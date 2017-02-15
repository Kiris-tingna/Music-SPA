'use strict';

music.filter('formatTime', [function () {
    /**
     * time过滤器
     * @param  {[type]} time [输入时间]
     * @return {[type]} min:sec [输出时间戳]
     */
    return function (time) {
        time = parseInt(time) || 0;
        var min = 0,
            sec = 0;
        if (time > 60) {
            min = parseInt(time / 60);
            sec = time - 60 * min;
            min = min >= 10 ? min : '0' + min;
            sec = sec >= 10 ? sec : '0' + sec;
        }else {
            min = '00';
            sec = time >= 10 ? time : '0' + time;
        }
        return min + ":" + sec;
    }
}]);

/**
 * angular 填充html需要 ng-bind-html和这个filter
 * @param  {[type]} $sce  特殊服务
 * @return {[type]}       [description]
 */
music.filter('trust_as_html', [
    '$sce', function($sce) {
        return function(input) {
            return $sce.trustAsHtml(input);
        }
    }
]);

/**
 * 图片默认占位过滤器
 * 需要考虑如何配置参数化
 * @return {[type]} [description]
 */
music.filter('image_default_avatar', [function () {
    return function (image) {
        if(image == null || image == ''){
            var baseUrl = 'http://127.0.0.1:3000';
            return baseUrl + '/image/avatar/default.jpeg';
        }else {
            return image;
        }
    }
}])