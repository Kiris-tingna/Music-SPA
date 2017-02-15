'use strict';

/**
 * config api for music
 * @type {String}
 */
var api_host_url = '';
var api_perfix_url = 'api/'

music.constant('M_API', api_host_url + api_perfix_url);

/**
 * 注册拦截器
 * @param  {[type]} $httpProvider [description]
 * @return {[type]}               [description]
 */
music.config(['$httpProvider', function ($httpProvider) {
    // for post
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';  
    $httpProvider.defaults.headers.post['Accept'] = 'application/json, text/javascript, */*; q=0.01';  
    $httpProvider.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';

    $httpProvider.interceptors.push('RequestInjector');
}]);

