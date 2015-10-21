var gulp = require('gulp');
var umd = require('gulp-umd');
var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');
var es6transpiler = require('gulp-es6-transpiler');
var exec = require('child_process').exec;

var es6_options = { globals: {
  require: false,
  define: false
}};

gulp.task('umd', function () {
  return gulp.src('src/*.js')
    .pipe(umd({
      dependencies: function (file) { return ['parsimmon', 'underscore']; }
    }))
    .pipe(es6transpiler(es6_options))
    .pipe(gulp.dest('target'));
});

gulp.task('test', ['umd'], function () {
  return gulp.src(['test/unit.js', 'test/html.js'])
    .pipe(tape({
      reporter: tapColorize()
    }));
});

gulp.task('tape', ['umd'], function (cb) {
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
