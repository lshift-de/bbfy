var gulp = require('gulp');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');

var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');
var exec = require('child_process').exec;

gulp.task('compile', function () {
  return gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({ modules: 'umd' }))
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

gulp.task('watch', ['tape'], function (cb) {
  gulp.watch(['src/*.js', 'test/*.js'], ['tape']);
});

gulp.task('default', ['test']);
