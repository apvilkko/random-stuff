var gulp = require('gulp');

var source = require('vinyl-source-stream');
var browserify = require('browserify');
var tsify = require('tsify');
var browserSync = require('browser-sync');
var tslint = require('gulp-tslint');
var domain = require('domain');
var tap = require('gulp-tap');
var streamify = require('gulp-streamify');
var concat = require('gulp-concat');
var gutil = require('gulp-util');

var config = {
  publicPath: __dirname + '/src/dist',
  app: {
    path: __dirname + '/src/app',
    main: 'index.ts',
    result: 'application.js'
  }
};

/*function handleError(error) {
  console.log(error);
  this.emit('end');
}*/

gulp.task('ts-lint', function () {
  return gulp.src(config.app.path + '/**/*.ts')
    .pipe(tslint())
    .pipe(tslint.report('prose'));
});

gulp.task('compile-js', function() {
  var bundler = browserify({basedir: config.app.path})
    .add(config.app.path + '/' + config.app.main)
    .plugin(tsify, {target: 'ES5'})
    ;

  return bundler.bundle()
    .pipe(source(config.app.result))
    .pipe(gulp.dest(config.publicPath));
});

gulp.task('copy-lib', function () {
  return gulp.src(__dirname + '/node_modules/color-scheme/lib/color-scheme.min.js')
    .pipe(gulp.dest(__dirname + '/src/dist'));
});

gulp.task('scripts', function() {
    gulp.src(config.app.path + '/' + config.app.main, {read: false})
        .pipe(tap(function(file) {
            var d = domain.create();

            d.on("error", function(err) {
                gutil.log(
                    gutil.colors.red("Browserify compile error:"),
                    err.message,
                    "\n\t",
                    gutil.colors.cyan("in file"),
                    file.path
                );
            });

            d.run(function() {
                file.contents = browserify({
                    basedir: config.app.path,
                    entries: [file.path]
                })
                //.add(es6ify.runtime)
                //.add(config.app.path + '/' + config.app.main)
                //.transform(hbsfy)
                //.transform(es6ify.configure(/^(?!.*node_modules)+.+\.js$/))
                //.transform(bulkify)
                //.transform(aliasify)
                .plugin(tsify, {target: 'ES5'})
                .bundle();
            });
        }))
        //.pipe(streamify(concat(config.app.result)))
        .pipe(streamify(concat(config.app.result)))
        .pipe(gulp.dest(config.publicPath));
});

gulp.task('watch', function() {
    gulp.watch([config.app.path + '/**/*.ts'], ['ts-lint', 'scripts', 'copy-lib']);
});

gulp.task('serve', ['ts-lint', 'scripts', 'copy-lib', 'watch'], function() {
  process.stdout.write('Serving...\n');
  browserSync({
    port: 3000,
    files: ['index.html', '**/*.js'],
    injectChanges: true,
    logFileChanges: false,
    logLevel: 'silent',
    logPrefix: 'dhgen',
    notify: true,
    reloadDelay: 1000,
    server: {
      baseDir: './src'
    }
  });
});

gulp.task('default', ['ts-lint', 'scripts', 'copy-lib']);
