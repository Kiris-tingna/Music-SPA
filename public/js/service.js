/**
 * music http api 请求服务
 * 2016/3/18 : 扩展了api设置性
 */
music.factory('ApiService', ['$http', 'M_API', function ($http, M_API) {
    var Mget = function (url, params) {
        return $http({
            method: 'GET',
            headers: {'Authorization': '?????'},// 可配置
            url: M_API + url,
            params: params,
            cache: true
        });
    }
    var Mpost = function (url, params) {
        return $http({
            method: 'POST',
            url: M_API + url,
            params: params
        });
    }

    // api 列表
    return {
        MlistGetApi: function (type, offset, size) {
            return Mget('list', {'type': type, 'size': size , 'offset': offset});
        },
        MbaseGetApi: function (sid){
            return Mget('song', {'song_id':sid});
        },
        MlrcGetApi: function (sid) {
            return Mget('lrc', {'songId': sid});
        },
        MsearchGetApi: function (key) {
            return Mget('search', {'keyword': key});
        },
        MdownlaodGetApi: function (sid) {
            return Mget('download',{'song_id': sid});
        }

    }
}]);

music.factory('MusicService',['$q', 'ApiService', function ( $q, Api){
    return {
        /**
         * promise http request
         * 带缓存
         * @param  {[type]} type   [description]
         * @param  {[type]} offset [description]
         * @param  {[type]} size   [description]
         * @return {[type]}        [description]
         */
        list: function (type, offset, size) {
            var defer = $q.defer();
            
            Api.MlistGetApi(type, offset, size)
            .success(function (data, status, headers, config) {
                // 计算请求时间
                // var time = config.responseTimestamp - config.requestTimestamp;
                // console.log('The list request took ' + (time / 1000) + ' seconds.');
                
                defer.resolve(data);
            })
            .error(function (err) {
                defer.reject(err);
            });
            
            return defer.promise;
        },
        /**
         * 根据id请求具体数据
         * @param  {[type]} id [description]
         * @return {[type]}    [description]
         */
        base: function (id) {
            var defer = $q.defer();

            Api.MbaseGetApi(id)
            .success(function (data, status, headers, config) {
                if (data.error) {
                    defer.reject(data.error);
                }
                else {
                    defer.resolve(data);
                }
            })
            .error(function (err) {
                defer.reject('加载出错');
            });
            return defer.promise;
        },
        /**
         * 根据歌曲id请求歌词
         * @param  {[type]} sid [description]
         * @return {[type]}     [description]
         */
        lrc: function (sid) {
            var defer = $q.defer();
            
            Api.MlrcGetApi(sid)
            .success(function (data, status, headers, config) {
                if(data.error) {
                    defer.reject(data.error);
                }else{
                    defer.resolve(data);
                }
            })
            .error(function (err) {
                defer.reject('加载歌词出错');
            });
            
            return defer.promise;
        },
        /**
         * 根据关键字请求接口
         * @param  {[type]} key [description]
         * @return {[type]}     [description]
         */
        search: function (key) {
            var defer = $q.defer();

            Api.MsearchGetApi(key)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (err) {
                defer.reject(err);
            })
            return defer.promise;
        },
        /**
         * 根据sid下载歌曲
         * @param  {[type]} songid [description]
         * @return {[type]}        [description]
         */
        download: function (songid) {
            var defer = $q.defer();

            Api.MdownlaodGetApi(songid)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (err) {
                defer.reject(err);
            })
            return defer.promise;
        }
    }
}]);

/**
 * music common alert service
 * pay attention to value 
 */
music.factory('AlertService',['$rootScope', '$timeout', function ($rootScope, $timeout) {
    var alertService = {};
    // 创建一个全局的 alert 数组
    $rootScope.alerts = [];

    alertService.add = function(type, msg, time) {
        var _o = {'type': type, 'msg': msg, 'close': function(){ alertService.closeAlert(this); }};
        
        $rootScope.alerts.push(_o);
        
        if(time){
            $timeout(function() { 
                alertService.closeAlert(_o);
            },time);
        }
    };
 
    alertService.closeAlert = function(alert) {
        alertService.closeAlertIdx($rootScope.alerts.indexOf(alert));
    };
 
    alertService.closeAlertIdx = function(index) {
        $rootScope.alerts.splice(index, 1);
    };

    alertService.clear = function() {
        $rootScope.alerts = [];
    };
    return alertService;
}]);

/**
 * localstorage service
 * @return {[type]} [description]
 */
music.factory('LocalStorage', [function () {
    return {
        perfixKey : function (key) {
            return 'lcy_'+ key;
        },
        get: function (key, defaultValue){
            key = this.perfixKey(key);
            var stored = localStorage.getItem(key);
            try{
                stored = angular.fromJson(stored);
            }catch(err){
                stored = null;
            }
            if(defaultValue && stored === null){
                stored = defaultValue;
            }
            return stored;
        },
        update: function (key, value){
            key = this.perfixKey(key);

            if(value){
                localStorage.setItem(key, angular.toJson(value));
            }
        },
        delete: function (key) {
            key = this.perfixKey(key);

            localStorage.removeItem(key);
        },
        clean: function () {
            localStorage.clear();
        }
    }
}])