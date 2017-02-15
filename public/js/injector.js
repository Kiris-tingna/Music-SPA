'use strict';

/**
 * 请求拦截器
 */
music.factory('RequestInjector', ['$rootScope', function ($rootScope){
    return {
        // request configure
        request: function (conf) {
            // 这里可以调整HTTP请求的配置
            // $rootScope.loading = true;
            conf.requestTimestamp = new Date().getTime();
            
            // console.log(conf);
            
            return conf;
        },
        response: function (res) {
            // 这里能拿到响应对象，当然也可以更改它
            // $rootScope.loading = false;
            res.config.responseTimestamp = new Date().getTime();
            
            // console.log(res.config);

            return res;
        }
    }
}]);