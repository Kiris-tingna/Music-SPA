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
 * 指令必须是单节点的
 * @return {[type]} [description]
 */
music.directive('lycheck', [function () {
    return {
        restrict: 'E',
        replace: true,
        template: "<div class='mc-checkbox-warpper'>\
        <input class='mc-checkbox' type='checkbox' ng-model='checkValue' id='{{checkId}}' value='{{checkId}}'/>\
        <label for='{{checkId}}'></label>\
        </div>",
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
                }else{
                    // newValue is false
                    scope.$parent.DeleteCheck(scope.checkId);
                }
            })
        }
    }
}]);
/**
 * 分页指令
 * @return {[type]} [description]
 */
music.directive('pagination',[function() {
    return {
        restrict : 'EA',
        templateUrl : '/tpls/pagination.html',
        replace : true,
        scope : {
            conf : '='
        },
        link : function(scope , ele , attrs){
            var page = scope.page = {};
            var conf = scope.conf ;
            // 初始化一页展示多少条  默认为10
            conf.pageLimit = [10 , 15 , 20 , 30 ,50];
            if(!conf.itemPageLimit ){
                conf.itemPageLimit = conf.pageLimit[0];
            }else{
                // 把自定义的条目加入到pagelimit中
                if(conf.pageLimit.indexOf(conf.itemPageLimit)){
                    conf.pageLimit.push(conf.itemPageLimit);
                    conf.pageLimit = conf.pageLimit.sort(function(a ,b ){ return a - b; })
                }
            }

            // 分页数组
            scope.pageListFn = function(chosePage){
                scope.pageList = [];
                conf.itemPageLimit = chosePage || conf.itemPageLimit;
                page.limit = Math.floor(conf.total / conf.itemPageLimit); // total page
                // 最多展示多少可见页码 默认为10
                page.defaultLimit = conf.defaultLimit ? conf.defaultLimit : 10;
                // 三种打点方式 ， 中间打点， 左边打点， 后边打点
                if(page.limit <  page.defaultLimit ){
                    for(var i=1; i< page.limit ; i++){
                        scope.pageList.push(i);
                    }
                }else{
                    if(conf.currentPage < page.defaultLimit){
                        for(var i = 1 ; i <= page.defaultLimit; i++){
                            scope.pageList.push(i);
                        }
                        scope.pageList.push('...' , page.limit);
                    }else if(conf.currentPage > page.limit - page.defaultLimit + 1){
                        for(var i= page.limit - page.defaultLimit + 1; i<= page.limit; i++){
                            scope.pageList.push(i);
                        }
                        scope.pageList.unshift(1 , '...');
                    }else{
                        for(var i = conf.currentPage - Math.floor(page.defaultLimit / 2) ; i< conf.currentPage + Math.ceil(page.defaultLimit / 2) ; i++){
                            scope.pageList.push(i);
                        }
                        scope.pageList.push('...' , page.limit );
                        scope.pageList.unshift(1 , '...');
                    }
                }
            }
            // 执行
            scope.pageListFn();

            // 点击页码
            scope.changePage = function(page){
                if(page == '...') return ;
                conf.currentPage = page ;
            }
            // 上一页
            scope.prevPage = function(){
                if(conf.currentPage <= 1) return ;
                conf.currentPage -= 1;
                scope.pageListFn();
            }

            // 下一页
            scope.nextPage = function(){
                if(conf.currentPage >= page.limit ) return ;
                conf.currentPage += 1;
                scope.pageListFn();
            }

            // 改变一页显示条目
            scope.selectPage = function(page){
                conf.currentPage = 1;
                scope.pageListFn(page);
            }
            scope.$watch('conf.currentPage', function (news, old){
                if(news == old) return;
                scope.pageList = [];
                scope.pageLength = null;
                scope.pageListFn();
                return;
            })
            // 跳转页
            scope.linkPage = function(){
                if(!conf.linkPage) return ;
                conf.linkPage = conf.linkPage.replace(/[^0-9]/ , '');

                if(conf.linkPage == 0 || conf.linkPage > page.limit){
                    conf.linkPage = page.limit ;
                }
                conf.currentPage = conf.linkPage ;
            }
        }
    }
}])