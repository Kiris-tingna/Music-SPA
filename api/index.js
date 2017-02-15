var fs = require('fs');
var path = require('path');
var request = require("request");
var qs = require('querystring');
var _ = require("underscore");
/**
 * API
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {
    // list
    app.get('/api/list', function (req, res) {
        var size = req.query.size ? req.query.size : 40;
        var offset = req.query.offset ? req.query.offset : 0;
        var type = req.query.type ? req.query.type : 2;
        
        var param = {
            'type': type,
            'size': size,
            'offset': offset,
            'format': 'json',
            'method': 'baidu.ting.billboard.billList'
        };

        var baseurl = 'http://tingapi.ting.baidu.com/v1/restserver/ting'
        var url = baseurl + '?' + qs.stringify(param);
        request(url, function (err, response, body){
            if(err){
                console.log(err);
                return;
            }
            var result = {'common':{},'list':{}};

            var data = JSON.parse(body);
            
            result.common = {
                'title': data.billboard.name ? data.billboard.name :'',
                'desc' : data.billboard.comment ? data.billboard.comment :'',
                'date' : data.billboard.update_date ? data.billboard.update_date :''
            }

            _.each(data.song_list, function (value, key) {
                var _data = {
                    'id': value.song_id,
                    'title': value.title ? value.title :'',
                    'author': value.author ? value.author :''
                };
                Array.prototype.push.call(result.list, _data);
            })

            res.status(200).json(result);
        });
    });
    // single song
    app.get('/api/song', function (req, res) {
        if(_.isUndefined(req.query.song_id)){
            res.status(500).json('缺少id');
        }
        
        var id = parseInt(req.query.song_id);
        var param = {
            'from':  'webapp_music',
            'format': 'json',
            'method': 'baidu.ting.song.play',
            'songIds': id
        };
        var baseurl = "http://ting.baidu.com/data/music/links";
        var url = baseurl + '?' + qs.stringify(param);
        
        request.get(url, function (err, response, body) {
            if(err){
                console.log(err);
                return;
            }
            var data = JSON.parse(body);
            if(data.errorCode != 22000) {
                res.status(400).json('加载歌曲出错');
            }
            var rs = data.data.songList[0];
            res.status(200).json({
                'id': rs.songId,
                // 'img': rs.songPicSmall, // 小图
                'img': rs.songPicRadio, // 大图 
                'author': rs.artistName,
                'title': rs.songName,
                'album': rs.albumName,
                'time': rs.time,
                'audio': rs.songLink
            });
        })
    })
    // lrc
    app.get('/api/lrc', function (req, res) {
        if(_.isUndefined(req.query.songId)){
            res.status(500).json('缺少id');
        }
        var id = parseInt(req.query.songId);
        var param = {
            'from':  'webapp_music',
            'format': 'json',
            'method': 'baidu.ting.song.lry',
            'songid': id
        };
        var baseurl = "http://tingapi.ting.baidu.com/v1/restserver/ting";
        var url = baseurl + '?' + qs.stringify(param);
        request.get(url, function (err, response, body) {
            if(err){
                console.log(err);
                return;
            }
            var data = JSON.parse(body);
            if(data.hasOwnProperty('errorCode') && data.errorCode == 22005) {
                res.status(400).json('加载歌词失败');
                return;
            }
            if(!data.hasOwnProperty('title')){
                res.status(400).json('加载歌词失败');
                return;
            }
            var pattern = /(\[.*\])+(.+)?/,
                timePattern = /(\d{2}):(\d{2})\.(\d{2})/;
            var list = data.lrcContent.split('\n');
            var lrc = {};
            _.each(list, function (value, key) {
                var texts = value.match(pattern);
                if(!texts) return;
                var time = texts[1];
                var text = texts[2]?texts[2] : '';
                var times = time.match(timePattern);
                if(!times) return;
                var min = parseInt(times[1]);
                var secs = parseInt(times[2]);

                var _t = min * 60 + secs;
                Array.prototype.push.call(lrc, {'time': _t,'text': text});

            });
            // sort
            res.status(200).json(lrc);
        })
    });
    // search
    app.get('/api/search', function (req, res) {
        if(_.isUndefined(req.query.keyword)){
            res.status(400).json({'error':'请输入关键词'});
        }
        var keyword = req.query.keyword;
        var param = {
            'query': keyword,
            'format': 'json',
            'from': 'webapp_music',
            'method': 'baidu.ting.search.catalogSug'
        };

        var baseurl = 'http://tingapi.ting.baidu.com/v1/restserver/ting';
        var url = baseurl + '?' + qs.stringify(param);

        request(url, function (err, response, body){
            if(err){
                console.log(err);
                res.status(400).json({'error':'搜索失败'});
                return;
            }
            var result = {'common':{},'list':{}};
            var data = JSON.parse(body);
            result.common = {
                'title': keyword + '的搜索结果',
                'desc' : '歌曲来源于百度，本站仅供试听',
                'date' : '更新日期-' + new Date('Y-m-d')
            }

            _.each(data.song, function (value, key) {
                var _data = {
                    'id': value.songid,
                    'title': value.songname ? value.songname :'',
                    'author': value.artistname ? value.artistname :''
                };
                Array.prototype.push.call(result.list, _data);
            })

            res.status(200).json(result);
        });
    });
    // download
    app.get('/api/download', function (req, res) {
        if(_.isUndefined(req.query.song_id)){
            res.status(400).json({'error':'请输入下载歌曲id'});
        }
        var sid = req.query.song_id;
        var param = {
            'songIds': sid,
            // 'format': 'json',
            // 'from': 'webapp_music',
            // 'bit': '192',
            // 'method': 'baidu.ting.song.downWeb',
            // '_t': Date().now
        };

        var baseurl = 'http://ting.baidu.com/data/music/links';
        var url = baseurl + '?' + qs.stringify(param);

        request(url, function (err, response, body){
            if(err){
                console.log(err);
                res.status(400).json({'error':'下载失败'});
                return;
            }
            
            var data = JSON.parse(body);
            var name = data.data.songList.artistName + ' - ' + 
                       data.data.songList.songName + '.mp3';

            _.each(data.data.songList, function (value, key) {
                var name = value.artistName + ' - ' + value.songName + '.mp3';
                var surl = value.songLink;
                
                console.log(name);
                console.log(surl);

                // res.download(surl, name, function (err){
                //     if(err) {
                //         console.log(err);
                //     }
                // });
            });
        });
    });
}