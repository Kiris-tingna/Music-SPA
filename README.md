# less
less技术

# 全局安装
`npm install less -g`

#lessc 编译器
`lessc sample.less > sample.css (--source-map)`

# gulp插件
`npm install gulp-less --save`

## 引入
`var less = require('gulp-less')`

## 使用
```
gulp.task( 'less', function(){
    gulp.src( [srcPath] )
        .pipe( less() )
        .pipe( gulp.dest(destPath) );
} )
```
