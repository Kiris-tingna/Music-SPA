"use strict";var music=angular.module("music",[]);music.config(["$httpProvider",function(e){e.interceptors.push("RequestInjector")}]),music.controller("RootController",["$rootScope","$scope","$timeout","MusicService","AlertService","LocalStorage",function(e,t,n,r,o,i){e.$on("loading",function(t,n){e.loading=!0,e.whenLoadingText=n}),t.playing=!1,t.hasPrev=!1,t.hasNext=!1,t.song={},t.list={},t.keyword="",t.playMode=1,t.progressW=document.querySelector(".dc-progress-bar").clientWidth,t.progress=0;var c=document.getElementById("fr").contentWindow.document.getElementById("audio");c.addEventListener("play",function(){t.$apply(function(){t.playing=!0})},!1),c.addEventListener("pause",function(){t.$apply(function(){t.playing=!1})},!1),c.addEventListener("ended",function(){1==t.playMode?t.hasNext?t.next():t.load(t.list[0]):t.load(t.song,!0)},!1),c.addEventListener("timeupdate",function(e){var n=parseInt(e.target.currentTime);t.Animatelrc(n),t.$apply(function(){t.song.currentTime=n,t.progress=n/t.song.time})},!1),t.$watch("playMode",function(e,t){e?o.add("success","列表循环",1e3):o.add("success","单曲循环",1e3)}),t.JudgePos=function(e){var n=0,r=t.list.length-1;t.hasPrev=e>n,t.hasNext=r>e},t.search=function(){t.$emit("loading","搜索"+t.keyword);var e=r.search(t.keyword);e.then(function(e){t.loading=!1,null==e||e.error?o.add("warning","没有找到相关结果",500):(t.loading=!1,t.common=e.common,t.list=e.list)},function(e){t.loading=!1,o.add("warning","没有找到相关结果",500)})},t.load=function(e,n){if(e.id!=t.song.id){t.$emit("loading","加载"+e.title);var i=r.base(e.id);i.then(function(n){t.JudgePos(Array.prototype.indexOf.call(t.list,e)),t.song=e,t.loading=!1,t.song.img=n.img,t.song.author=n.author,t.song.title=n.title,t.song.time=n.time,t.song.currentTime=0,t.song.src=n.audio,c.src=n.audio,t.Getlrc(t.song.id),o.add("info",t.song.author+" - "+t.song.title,500),c.play()},function(e){t.loading=!1,o.add("warning","加载歌曲出错",500)})}else c.play()},t.Getlrc=function(e){var n=r.lrc(e),o="";n.then(function(e){for(var n in e)o+='<div data-timeline="'+e[n].time+'">'+e[n].text+"</div>";t.song.lrc=o},function(e){t.song.lrc=e})},t.Animatelrc=function(e){var t=document.querySelectorAll("[data-timeline]"),n=0,r=0,o={i:0,time:0};for(var i in t){var c=t[i];if(void 0!=c.dataset){var a=parseInt(c.dataset.timeline);if(a==e){r=c.clientHeight,c.className="current",o.i=parseInt(i)+1;try{o.time=t[o.i].dataset.timeline}catch(s){}if(o.time>0){var l=o.time-a;!function(e){setTimeout(function(){t[e].className=""},1e3*l)}(i)}document.querySelector(".lrc>.content").style.marginTop=-(n-r)+"px"}else e>a&&(n+=c.clientHeight)}}},t.Getlist=function(e){t.$emit("loading","加载中");var n=r.list(e,0,40);n.then(function(e){t.common=e.common,t.list=e.list},function(e){o.add("warning","加载歌曲出错",500)})},t.download=function(e){o.add("danger","<small>Baidu.ting.download</small>接口暂时不给下载<br>试图寻找其他方法",1e3)},t.play=function(){c.play()},t.pause=function(){c.pause()},t.prev=function(){var e=Array.prototype.indexOf.call(t.list,t.song);t.load(t.list[--e])},t.next=function(){var e=Array.prototype.indexOf.call(t.list,t.song);t.load(t.list[++e])},t.like=function(e){var t=!1,n=i.get("list_of_like_song")||{};for(var r in n)if(e.id==n[r].id){t=!0;break}t||Array.prototype.push.call(n,e),i.update("list_of_like_song",n)}}]),music.directive("dcToggle",[function(){return{restrict:"EA",link:function(e,t,n){}}}]),music.directive("dcProgressBar",[function(){return{link:function(e,t,n){var r=document.getElementById("fr").contentWindow.document.getElementById("audio");t.bind("click",function(n){var o=t[0].getBoundingClientRect(),i=o.left,c=n.x,a=(c-i)/o.width;a=a>1?1:a;var s=e.song.time,l=s*a;r.currentTime=l,e.song.currentTime=l})}}}]),music.filter("formatTime",[function(){return function(e){e=parseInt(e)||0;var t=0,n=0;return e>60?(t=parseInt(e/60),n=e-60*t,t=t>=10?t:"0"+t,n=n>=10?n:"0"+n):(t="00",n=e>=10?e:"0"+e),t+":"+n}}]),music.filter("trust_as_html",["$sce",function(e){return function(t){return e.trustAsHtml(t)}}]),music.filter("image_default_avatar",[function(){return function(e){if(null==e||""==e){var t="http://127.0.0.1:3000";return t+"/image/avatar/default.jpeg"}return e}}]),music.factory("RequestInjector",["$rootScope",function(e){return{request:function(t){return e.loading=!0,t.requestTimestamp=(new Date).getTime(),console.log(t),t},response:function(t){return e.loading=!1,t.config.responseTimestamp=(new Date).getTime(),console.log(t.config),t}}}]),music.factory("MusicService",["$http","$q",function(e,t){return{list:function(n,r,o){var i=t.defer();return e.get("api/list?type="+n+"&size="+o+"&offset="+r,{cache:!0}).success(function(e,t,n,r){var o=r.responseTimestamp-r.requestTimestamp;console.log("The list request took "+o/1e3+" seconds."),i.resolve(e)}).error(function(e){i.reject(e)}),i.promise},base:function(n){var r=t.defer();return e.get("api/song?song_id="+n).success(function(e,t,n,o){e.error?r.reject(e.error):r.resolve(e)}).error(function(e){r.reject("加载出错")}),r.promise},lrc:function(n){var r=t.defer();return e.get("api/lrc?songId="+n,{cache:!0}).success(function(e,t,n,o){e.error?r.reject(e.error):r.resolve(e)}).error(function(e){r.reject("加载歌词出错")}),r.promise},search:function(n){var r=t.defer();return e.get("api/search?keyword="+n).success(function(e,t,n,o){r.resolve(e)}).error(function(e){r.reject(e)}),r.promise},download:function(n){var r=t.defer();return e.get("api/download?song_id="+n).success(function(e,t,n,o){r.resolve(e)}).error(function(e){r.reject(e)}),r.promise}}}]),music.factory("AlertService",["$rootScope","$timeout",function(e,t){var n={};return e.alerts=[],n.add=function(r,o,i){var c={type:r,msg:o,close:function(){n.closeAlert(this)}};e.alerts.push(c),i&&t(function(){n.closeAlert(c)},i)},n.closeAlert=function(t){n.closeAlertIdx(e.alerts.indexOf(t))},n.closeAlertIdx=function(t){e.alerts.splice(t,1)},n.clear=function(){e.alerts=[]},n}]),music.factory("LocalStorage",[function(){return{get:function(e,t){var n=localStorage.getItem(e);try{n=angular.fromJson(n)}catch(r){n=null}return t&&null===n&&(n=t),n},update:function(e,t){t&&localStorage.setItem(e,angular.toJson(t))},"delete":function(e){localStorage.removeItem(e)},clean:function(){localStorage.clear()}}}]);