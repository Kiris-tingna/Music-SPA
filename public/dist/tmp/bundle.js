'use strict';

var music = angular.module('music',[]);

/**
 * 注册拦截器
 * @param  {[type]} $httpProvider [description]
 * @return {[type]}               [description]
 */
music.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('RequestInjector');
}]);

/**
 * 主控制器RootController
 */
music.controller('RootController', [
    '$rootScope', 
    '$scope',
    '$timeout',
    'MusicService',
    'AlertService',
    'LocalStorage', function ($rootScope, $scope, $timeout, MusicService, AlertService, ls){
    // $on loading 动画
    // 父级接受loading事件
    $rootScope.$on('loading', function (event, text) {
        // when we use injector
        $rootScope.loading  =  true;
        $rootScope.whenLoadingText = text;
        // otherwise
        // $scope.loading  =  true;
        // $scope.whenLoadingText = text;
    });

    // config preload
    $scope.playing = false;// 播放状态
    $scope.hasPrev = false;
    $scope.hasNext = false;
    $scope.song = {};
    $scope.list = {}; // watch important
    $scope.keyword = '';
    $scope.playMode = 1;

    // UI state
    $scope.progressW = document.querySelector('.dc-progress-bar').clientWidth;
    $scope.progress = 0;

    // check list
    $scope.checkList = 3;
    
    // audio event
    var audio = document.getElementById('fr').contentWindow.document.getElementById('audio');
    
    audio.addEventListener('play', function () {
        // play state
        $scope.$apply(function() {$scope.playing = true;})
    }, false);
    
    audio.addEventListener('pause', function () {
        // pause state
        $scope.$apply(function() {$scope.playing = false;})
    }, false);

    audio.addEventListener('ended', function () {
        // 列表循环
        if ($scope.playMode == 1) {
            if ($scope.hasNext) {
                $scope.next();
            }else{
                $scope.load($scope.list[0]);
            }
        } else {
        // 单曲循环
            $scope.load($scope.song, true);
        }
    }, false);

    audio.addEventListener('timeupdate', function (e) {
        var time = parseInt(e.target.currentTime);
        $scope.Animatelrc(time);
        // 仅在回调中需要更新 important
        $scope.$apply(function() {
            $scope.song.currentTime = time;
            //  除法产生小数 精度不高
            $scope.progress = time / $scope.song.time;
        })
    }, false);

    //  watch
     $scope.$watch('playMode', function (newValue, oldValue) {
        if (newValue) {
            AlertService.add('success', '列表循环', 1000);// 1
            // AlertService.add('success', '列表循环');// 1
        }
        else {
            AlertService.add('success', '单曲循环', 1000);// 0
            // AlertService.add('success', '单曲循环');// 0
        }
    });

    // judge index of current song
    $scope.JudgePos = function (index) {
        var _min = 0;
        var _max = $scope.list.length - 1;
        $scope.hasPrev = index > _min;
        $scope.hasNext = index < _max;
    };
    // search
    $scope.search = function () {
        $scope.$emit('loading', '搜索' + $scope.keyword);
        var promise = MusicService.search($scope.keyword);
        promise.then(function (data) {
            $scope.loading = false;
            if (data != null && !data.error) {
                $scope.loading = false;
                $scope.common = data.common;
                $scope.list = data.list;
            }
            else {
                AlertService.add('warning', '没有找到相关结果', 500);
            }
        }, function (data) {
            $scope.loading = false;
            AlertService.add('warning', '没有找到相关结果', 500);
        });
    };
    // load music to play also lrc
    $scope.load = function (item, force) {
        // when different song
        if (item.id != $scope.song.id) {
            $scope.$emit('loading', '加载' + item.title + '');

            var promise = MusicService.base(item.id);
            promise.then(function (data) {
                $scope.JudgePos(Array.prototype.indexOf.call($scope.list, item));

                $scope.song = item;
                // 覆盖
                $scope.loading = false;
                $scope.song.img = data.img;
                $scope.song.author = data.author;
                $scope.song.title = data.title;
                $scope.song.time = data.time;
                $scope.song.currentTime = 0;
                $scope.song.src = data.audio;
                audio.src = data.audio;
                // load lrc
                $scope.Getlrc($scope.song.id);
                AlertService.add('info', $scope.song.author + ' - ' + $scope.song.title, 500);
                // play music
                audio.play();

            },function (err) {
                $scope.loading = false;
                AlertService.add('warning', '加载歌曲出错', 500);
            })
        }else {
        // same song
           audio.play(); 
        }
    };
    // load lrc by song_id
    $scope.Getlrc = function (id) {
        var promise = MusicService.lrc(id);
        var lrc = '';
        promise.then(function (data) {
            for (var i in data) {
                lrc += '<div data-timeline="' + data[i].time + '">' + data[i].text + '</div>';
            }
            $scope.song.lrc = lrc;
        }, function (err) {
            $scope.song.lrc = err;
        });
    };
    // change lrc
    // 实现不是很好,需改进!!!
    $scope.Animatelrc = function (time) {

        var lines = document.querySelectorAll('[data-timeline]');
        var top = 0;
        var _thisHeight = 0;
        var nextLine = {
            i: 0,
            time: 0
        };
        for (var i in lines) {
            var line = lines[i];
            if (line.dataset != undefined) {
                var timeline = parseInt(line.dataset.timeline);
                if (timeline == time) {
                    _thisHeight = line.clientHeight;
                    line.className = "current";
                    //获取下一句歌词
                    nextLine.i = parseInt(i) + 1;
                    try {
                        nextLine.time = lines[nextLine.i].dataset.timeline;
                    }
                    catch (e) {
                    }
                    if (nextLine.time > 0) {
                        var interval = nextLine.time - timeline;
                        (function(k) {
                            setTimeout(function() {
                                lines[k].className = "";
                            }, interval * 1000);
                        })(i);
                    }
                    document.querySelector('.lrc>.content').style.marginTop = -(top - _thisHeight) + 'px';
                }
                else if (timeline < time) {
                    top += line.clientHeight;
                }
            }
        }
    };
    // load a list of music
    $scope.Getlist = function (type) {
        // 发送loading事件
        $scope.$emit('loading', '加载中');
        // service 层
        var promise = MusicService.list(type, 0, 40);

        promise.then(function (data) {
            // $scope.loading = false;
            $scope.common = data.common;
            $scope.list = data.list;
        }, function (err) {

            // $scope.loading = false;
            AlertService.add('warning', '加载歌曲出错', 500);
        });
    }
    //download music
    $scope.download = function (item) {
        // var promise = MusicService.download(item.id);
        // promise.then(function (data) {
        //    console.log("下载成功");
        // }, function (err) {
        //    console.log("下载失败");
        // });
        AlertService.add('danger', '<small>Baidu.ting.download</small>接口暂时不给下载<br>试图寻找其他方法', 1000);
    }
    // 原子级的 function
    $scope.play = function () {
        audio.play();
    };
    $scope.pause = function () {
        audio.pause();
    };
    $scope.prev = function () {
        var _index = Array.prototype.indexOf.call($scope.list, $scope.song);
        $scope.load($scope.list[--_index]);
    };
    $scope.next = function () {
        var _index = Array.prototype.indexOf.call($scope.list, $scope.song);
        $scope.load($scope.list[++_index]);
    };
    $scope.like = function (item) {
        // ls.clean();
        var is_repeated = false;
        var musiclist = ls.get('list_of_like_song') || {};
        for(var _l in musiclist){
            if(item.id == musiclist[_l].id) {
                is_repeated = true;
                break;
            }
        }
        if(!is_repeated) {
            Array.prototype.push.call(musiclist, item);
        }
        ls.update('list_of_like_song', musiclist);
    };
    // checkbox list operatation
    $scope.ChooseAll = function () {
        if($scope.boolAllChecked){
            $scope.boolAllChecked = !$scope.boolAllChecked;
            // console.log($scope.boolAllChecked);
        }else{
           $scope.boolAllChecked = true;
           // console.log($scope.boolAllChecked);
        }
    }
    $scope.GetAllChoose = function () {
        console.log($scope.checkList);
    }
    $scope.UpdateCheck = function (value) {
        $scope.checkList = value;
    }
}])
'use strict';
/**
 * dcToggle
 * @return {[type]} [description]
 */
music.directive('dcToggle', [function() {
        return {
            restrict: 'EA',
            link: function(scope, ele, attrs) {
                // var target = attrs.xlToggle;
                // if (target != undefined) {
                //     var dom = angular.element(document.querySelector(target));
                //     ele.bind('click', function() {
                //         dom.toggleClass('active');
                //     });
                // }
            }
        };
    }
]);
/**
 * [description]
 * @return {[type]} [description]
 */
music.directive('dcProgressBar', [function () {
        return {
            link: function(scope, ele, attrs) {
                var audio = document.getElementById('fr').contentWindow.document.getElementById('audio');
                ele.bind('click', function (e) {
                    var rect = ele[0].getBoundingClientRect(); //进度条rect
                    var _beginX = rect.left;//进度条X坐标
                    var x = e.x;//点击点坐标
                    var percent = (x - _beginX) / rect.width;//百分比
                    percent = percent > 1 ? 1 : percent;
                    var time = scope.song.time;
                    var played = time * percent;
                    audio.currentTime = played;
                    scope.song.currentTime = played;
                });
            }
        }
    }
]);
/**
 * Ioslate scope
 * 隔离作用域
 * @return {[type]} [description]
 */
music.directive('lycheck', [function () {
    return {
        restrict: 'E',
        template: "<input type='checkbox' ng-model='checkValue' value='checkId'/>",
        scope: {
            checkId:'@',
            isAll: '=',
        },
        link: function(scope, element) {
            // initilize every checkbox
            scope.checkValue = false;
            // watch value change
            scope.$watch('isAll', function (newValue, oldValue) {
                scope.checkValue = newValue;
            })
            scope.$watch('checkValue', function (newValue, oldValue) {
                if(newValue) {// newValue is true
                    scope.$parent.UpdateCheck(scope.checkId);
                }
            })
        }
    }
}]);
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
'use strict';
/**
 * 请求拦截器
 */
music.factory('RequestInjector', ['$rootScope', function ($rootScope){
    return {
        // request configure
        request: function (conf) {
            $rootScope.loading = true;
            conf.requestTimestamp = new Date().getTime();
            
            // console.log(conf);
            
            return conf;
        },
        response: function (res) {
            $rootScope.loading = false;
            res.config.responseTimestamp = new Date().getTime();
            
            // console.log(res.config);

            return res;
        }
    }
}]);
/**
 * music http api 请求服务
 */
music.factory('MusicService',['$http', '$q', function ($http, $q){
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
            
            $http.get('api/list?type=' + type + '&size=' + size + '&offset=' + offset , {cache: true})
            .success(function (data, status, headers, config) {
                // 计算请求时间
                var time = config.responseTimestamp - config.requestTimestamp;
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
            $http.get('api/song?song_id=' + id)
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
            
            $http.get('api/lrc?songId=' + sid , {cache: true})
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
            $http.get('api/search?keyword=' + key)
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
            $http.get('api/download?song_id=' + songid)
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
        get: function (key, defaultValue){
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
            if(value){
                localStorage.setItem(key, angular.toJson(value));
            }
        },
        delete: function (key) {
            localStorage.removeItem(key);
        },
        clean: function () {
            localStorage.clear();
        }
    }
}])