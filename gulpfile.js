'use strict';

var gulp = require('gulp');
var path = require('path');
var del = require('del');
var sass = require('gulp-sass');
var cache = require('gulp-cache');
var gutil = require('gulp-util');
var exec = require('child_process').exec;
var autoprefixer = require('gulp-autoprefixer');
var jshint = require('gulp-jshint');

var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var karma = require('karma').server;

var assetPaths = Object.freeze({
  ROOT: 'app'
});

var publicPaths = Object.freeze({
  ROOT: 'public'
});

/* MAIN TASKS */
var baseTasks = ['clean', 'styles'];
gulp.task('dev', baseTasks.concat(['webpack-dev-server', 'watch']));
gulp.task('default', ['dev']);

/* BASE TASKS */
gulp.task('clean', function(done){
  del([
    publicPaths.ROOT + '/**.*'
  ], done)
});

gulp.task('watch', function(){
  gulp.watch(assetPaths.ROOT + '/**/*', ['jshint', 'styles'])
});

/* STYLESHEETS
 * Use SCSS as a pre-processor along with autoprefixer to automatically
 * add vendor prefixes.
*/
gulp.task('styles', [], function(){
  var options = {
    style: 'compressed',
    precision: 2,
    sourcemap: false
  };

  return gulp.src(assetPaths.ROOT + '/main.scss')
    .pipe(sass(options))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'Safari >= 6.1'],
      cascade: false,
      remove: true
    }))
    .pipe(gulp.dest(publicPaths.ROOT));
});

/* JAVASCRIPT
 * Use Webpack for building modules
*/

gulp.task('webpack-dev-server', function(done){
  var webpackConfig = require(__dirname + '/' + 'webpack.config.js');
  var compiler = webpack(webpackConfig);

  new webpackDevServer(compiler, {
    stats: {
      color: true
    },
    hot: true,
    historyApiFallback: true,
    publicPath: '/public/'
  }).listen(8080, 'localhost', function(err) {
      if (err) throw new gutil.PluginError('webpack-dev-server Error', err);
    });
});

gulp.task('jshint', function() {
  return gulp.src([assetPaths.ROOT + '/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

/* TESTS
 * Karma as test runner with Jasmine as unit testing library
*/
gulp.task('test', function(done){
  karma.start({
    configFile: __dirname + '/' + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('test-watch', function(done) {
  karma.start({
    configFile: __dirname + '/' + '/karma.conf.js'
  }, done);
});