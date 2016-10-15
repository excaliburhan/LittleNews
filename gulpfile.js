/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @gulp
 */

const gulp = require('gulp')
const gulpLess = require('gulp-less')
const cleanCss = require('gulp-clean-css')
const concat = require('gulp-concat')

const paths = {
  js: './js/*.js',
  css: './css/*.less',
  img: './img/**',
}

gulp.task('css', () => {
  gulp
    .src(paths.css)
    .pipe(gulpLess())
    .pipe(concat('bundle.min.css'))
    .pipe(cleanCss())
    .pipe(gulp.dest('./css'))
})

gulp.task('reload', () => {
  gulp.watch(paths.css, ['css'])
})

gulp.task('default', ['reload'])
