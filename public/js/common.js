"use strict";
/*---------- Localstorage Service/addMusic -------------*/
// this function is designed for Music list item
// id same is forbidden
Array.prototype.addMusicItem = function (val) {
    var is_repeated = false;
    for (var i = 0; i < this.length; i++) {
        if (this[i].id == val.id){
            is_repeated = true;
            break;
        }
    }
    if(!is_repeated) {
        Array.prototype.push.call(this, {"id":val.id, "title":val.title,"author":val.author});
    }
};
Array.prototype.removeMusicItem = function (val) {
    var is_repeated = false;
    var index = null;
    for (var i = 0; i < this.length; i++) {
        if (this[i].id == val.id){
            is_repeated = true;
            index = i;
            break;
        }
    }
    if(is_repeated) {
        Array.prototype.splice.call(this, index, 1);
    }
};
// ------------------- common:Array -----------------
Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
Array.prototype.add = function (val) {
    var is_repeated = false;
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val){
            is_repeated = true;
            break;
        }
    }
    if(!is_repeated) {
        Array.prototype.push.call(this, val);
    }
};

Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

// utils
var isFunction = function (fn) {
    return Object.prototype.toString.call(fn) == "[object Function]";
}

function random(min, max){
    min = min || 0;
    max = max || 1;
    return max >= min ? Math.round(Math.random()*(max - min) + min) : 0;
}