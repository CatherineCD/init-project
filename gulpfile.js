const {
  src,
  dest,
  parallel,
  series,
  watch
} = require('gulp');

// Load plugins
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const stylelint = require('stylelint');
const reporter = require('postcss-reporter');
const cssnano = require('cssnano');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const postcss = require('gulp-postcss');
const plumber = require('gulp-plumber');
const pug = require('gulp-pug');
const pugLinter = require('gulp-pug-linter');
const eslint = require('gulp-eslint');
const include = require('gulp-include');;
const sourcemaps = require('gulp-sourcemaps');
const sortMediaQueries = require('postcss-sort-media-queries');
const changed = require('gulp-changed');
const cached = require('gulp-cached');
const dependents = require('gulp-dependents');
const browsersync = require('browser-sync').create();

// Variables
const pages = './src/**/**/*.pug';
const components = './src/views/components/**/*.pug';

// Clean assets
function clear() {
  return src('./assets/*', {
    read: false,
  }).pipe(clean());
}

// JS function
function js() {
  const source = './src/js/**/*.js';
  const pages = './src/js/pages/*.js';

  return src([pages], source)
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(
      eslint({
        rules: {
          camelcase: 1,
          'comma-dangle': 2,
          quotes: 0,
        },
      })
    )
    .pipe(include())
    .pipe(uglify())
    .pipe(
      rename({
        extname: '-bundle.min.js',
      })
    )
    .pipe(dest('./build/js/'))
    .pipe(browsersync.stream());
}

// HTML function
function html() {
  const components = './src/views/components/**/*.pug';
  const pages = './src/views/pages/*.pug';
  const index = './src/index.pug';

  return src([index, pages], components)
    .pipe(plumber())
    .pipe(pugLinter({
      reporter: 'default'
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(dest('./build'))
    .pipe(browsersync.stream());
}

// CSS function
function css() {
  const main = './src/scss/main.scss';
  const pages = './src/scss/pages/*.scss';

  return src([main, pages])
    .pipe(cached('sasscache'))
    .pipe(dependents())
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(postcss([autoprefixer('> 0.2%'), sortMediaQueries(), stylelint({
      fix: true
    }), reporter({
      clearMessages: true,
      throwError: true
    }), cssnano()]))
    .pipe(
      rename({
        extname: '.min.css',
      })
    )
    .pipe(dest('./build/css/pages', {
      sourcemaps: true
    }))
    .pipe(browsersync.stream());
}

// Optimize images
function img() {
  return src('./src/img/**/*')
    .pipe(changed('./build/img'))
    // .pipe(imagemin())
    .pipe(dest('./build/img'));
}

// Optimize images
function fonts() {
  return src('./src/fonts/**/*')
    .pipe(dest('./build/fonts'));
}

// Watch files
function watchFiles() {
  watch('./src/scss/**/*.scss', css);
  watch('./src/js/**/*.js', js);
  watch('./src/js/**/*.js', html);
  watch('./src/img/*', img);
  watch('./src/fonts/*', fonts);
  watch(pages, html);
}

// BrowserSync
function browserSync() {
  browsersync.init({
    server: {
      baseDir: ['./build', './build/views/pages'],
      notify: false
    },
  });
}

exports.watch = parallel(watchFiles, browserSync);
exports.default = series(clear, html, parallel(js, css, img, fonts));