'use strict';

var music = angular.module('music', []);

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
        // $rootScope.loading  =  true;
        // $rootScope.whenLoadingText = text;
        // otherwise
        $scope.loading  =  true;
        $scope.whenLoadingText = text;
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
    $scope.checkList = [];
    // localstrorage list means like music
    $scope.musiclist = ls.get('likeSong') || [];
    // pagination conf
    $scope.conf = {
        total : 100,
        currentPage : 1,
        itemPageLimit : 8,
        // 页码上限
        defaultLimit: 5,
        // 是否显示一页选择多少条
        isSelectPage : false,
        // 是否显示总页数
        isTotalPage: false,
        // 是否显示快速跳转
        isLinkPage : false
    }
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

    // pagination watch
    $scope.$watch('conf.currentPage + conf.itemPageLimit' , function (newValue){
        // 把你的http请求放到这里
        // console.log($scope.conf.currentPage , $scope.conf.itemPageLimit);
        // 发送loading事件
        $scope.$emit('loading', '加载中');
        // service 层
        var promise = MusicService.list($scope.ListType, ($scope.conf.currentPage - 1)* $scope.conf.itemPageLimit, $scope.conf.itemPageLimit);

        promise.then(function (data) {
            $scope.loading = false;
            $scope.common = data.common;
            $scope.list = data.list;
        }, function (err) {

            $scope.loading = false;
            AlertService.add('warning', '加载歌曲出错', 500);
        });
    })

    // judge index of current song
    $scope.JudgePos = function (index) {
        var _min = 0;
        var _max = $scope.list.length - 1;
        $scope.hasPrev = index > _min;
        $scope.hasNext = index < _max;
    };
    // search
    $scope.search = function () {
        $scope.isLike = false;
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
                $scope.song.album = data.album;
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
                        AlertService.add('warning', '歌词出错', 500);
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
        $scope.isLike = false;
        // 发送loading事件
        $scope.$emit('loading', '加载中');
        // for pagination
        $scope.ListType = type;
        $scope.conf.currentPage = 1;
        // service 层
        var promise = MusicService.list(type, 0, $scope.conf.itemPageLimit);

        promise.then(function (data) {
            $scope.loading = false;
            $scope.common = data.common;
            $scope.list = data.list;
        }, function (err) {
            $scope.loading = false;
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
        AlertService.add('danger', '<small>Baidu.ting.download</small>接口暂时不给下载<br>试图寻找其他方法', 1500);
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

    // ------------------ localStorage ------------------
    $scope.like = function (num) {
        var _sitem = {
            "id": $scope.list[num].id,
            "title": $scope.list[num].title,
            "author": $scope.list[num].author
        }
        Array.prototype.addMusicItem.call($scope.musiclist, _sitem);
        // attention: must use true to watch the whole object!
        ls.update('likeSong', $scope.musiclist);
    };
    $scope.unlike = function (num) {
        var _sitem = {
            "id": $scope.list[num].id,
        }
        Array.prototype.removeMusicItem.call($scope.musiclist, _sitem);
        // attention: must use true to watch the whole object!
        ls.update('likeSong', $scope.musiclist);
    }
    $scope.Getlike = function () {
        $scope.list = $scope.musiclist;
        $scope.isLike = true;
    }
    // clean my ls for debug
    $scope.cleanAll = function () {
        ls.clean();
    }
    //$scope.cleanAll();
    
    // ------------------- item ----------------------
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
        // add
        Array.prototype.add.call($scope.checkList, value);
        // $scope.checkList = value;
    }
    $scope.DeleteCheck = function (value) {
        // delete
        Array.prototype.remove.call($scope.checkList, value);
        // $scope.checkList = value;
    }
}])