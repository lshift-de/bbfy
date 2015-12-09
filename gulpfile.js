var gulp = require('gulp');
var util = require('gulp-util');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');
var exec = require('child_process').exec;
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');

gulp.task('compile', function () {
  return gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('bbfy.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('target'));
});

gulp.task('test', ['compile'], function () {
  return gulp.src(['test/unit.js', 'test/html.js'])
    .pipe(tape({
      reporter: tapColorize()
    }));
});

gulp.task('tape', ['compile'], function (cb) {
  exec(process.argv.slice(0, 2).concat(['test']).join(' '), function (e, out, err) {
    console.log(out);
    console.log(err);
    cb();
  });
});

gulp.task('bundle', ['compile'], function () {
  return browserify({ entries: ['target/bbfy.js'], standalone: 'bbfy' })
    .bundle()
    .pipe(source('bbfy.browser.js'))
    .on('error', util.log)
    .pipe(gulp.dest('target'));
});

gulp.task('watch', ['tape'], function (cb) {
  gulp.watch(['src/*.js', 'test/*.js'], ['tape']);
});

gulp.task('default', ['test']);
