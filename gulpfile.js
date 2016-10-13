/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @gulp
 */

const gulp = require('gulp')
const gulpBabel = require('gulp-babel')
const gulpUglify = require('gulp-uglify')
const gulpLess = require('gulp-less')
const cleanCss = require('gulp-clean-css')
const gulpImagemin = require('gulp-imagemin')
const concat = require('gulp-concat')
const del = require('del')

const paths = {
  js: './js/*.js',
  css: './css/*.less',
  img: './img/**',
}

gulp.task('js', () => {
  del('js/bundle.min.js')
  .then(() => {
    gulp
      .src(paths.js)
      .pipe(gulpBabel({
        presets: ['es2015'],
      }))
      .pipe(concat('bundle.min.js'))
      .pipe(gulpUglify())
      .pipe(gulp.dest('./js'))
  })
})

gulp.task('css', () => {
  gulp
    .src(paths.css)
    .pipe(gulpLess())
    .pipe(concat('bundle.min.css'))
    .pipe(cleanCss())
    .pipe(gulp.dest('./css'))
})

gulp.task('img', () => {
  gulp
    .src(paths.img)
    .pipe(gulpImagemin())
    .pipe(gulp.dest('./img'))
})

gulp.task('reload', () => {
  // gulp.watch(paths.js, ['js'])
  gulp.watch(paths.css, ['css'])
  // gulp.watch(paths.img, ['img'])
})

gulp.task('default', ['reload'])
