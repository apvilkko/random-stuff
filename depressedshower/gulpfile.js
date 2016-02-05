const gulp = require('gulp');
const connect = require('gulp-connect');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');


gulp.task('html', () => {
  gulp.src('index.html').pipe(connect.reload());
});

gulp.task('sass', () => {
  gulp.src('css/main.scss')
    .pipe(sass())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    }))
    .pipe(gulp.dest('css/'));
});

gulp.task('style', () => {
  gulp.src('css/main.css').pipe(connect.reload());
});

gulp.task('script', () => {
  gulp.src('js/*.js').pipe(connect.reload());
});

gulp.task('watch', () => {
  gulp.watch(['js/*.js'], ['script']);
  gulp.watch(['css/main.scss'], ['sass']);
  gulp.watch(['css/main.css'], ['style']);
  gulp.watch(['index.html'], ['html']);
});
gulp.task('webserver', function() { connect.server({livereload: true}); });
gulp.task('default', ['webserver', 'sass', 'watch']);
