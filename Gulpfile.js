'use strict';
// 请先运行gulp clean 在运行gulp
var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');
var gulpSequence = require('gulp-sequence');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');

var del = require('del');

// const value
var SRC_DIR = './public/src/';
var DST_DIR = './public/dist/';

// stylesheets
gulp.task('css', function () {
    return gulp.src('./public/css/**.css', {base: 'public'})
            .pipe(concat('bundle.css'))
            .pipe(gulp.dest('./public/dist/tmp'))
            .pipe(cssnano({
                discardComments: {
                    removeAll: true
                }
            }))
            .pipe(rev())
            .pipe(gulp.dest('./public/dist/css'))
            .pipe(rev.manifest())
            .pipe(gulp.dest('./public/dist/rev/css'));
});

// js
gulp.task('scripts', function (){
    return gulp.src('./public/js/**.js')
            .pipe(concat('bundle.js'))
            .pipe(gulp.dest('./public/dist/tmp'))
            .pipe(uglify())
            .pipe(rev())
            .pipe(gulp.dest('./public/dist/js'))
            .pipe(rev.manifest())
            .pipe(gulp.dest('./public/dist/rev/js'));
});

// 版本化
gulp.task('rev', function () {
    return gulp.src(['./public/dist/rev/**/*.json','./public/*.html'])
            .pipe(revCollector())
            .pipe(gulp.dest('./public'));
});

// clean
gulp.task('clean-all', function (){
    return del(['./public/dist']);
});

gulp.task('clean-tmpandrev', function (){
    return del(['./public/dist/tmp','./public/dist/rev']);
});

// watch
gulp.task('watch',function(){
    gulp.watch('./public/css/**.css',['css','rev']);
    gulp.watch('./public/js/**.js',['scripts','rev']);
})

// pc
gulp.task('pc', gulpSequence(
    'css', 'scripts', 'rev'
));

//main task
gulp.task('default', ['pc']);