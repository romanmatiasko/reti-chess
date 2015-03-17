var ENV = process.env.NODE_ENV;
var IS_DEVELOPMENT;

if (ENV !== 'development' && ENV !== 'production')
  throw new Error('NODE_ENV must be set to either development or production.');
else
  IS_DEVELOPMENT = ENV === 'development';

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var cssmin = require('gulp-cssmin');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');

// external dependencies that are not rebundled while developing,
// but included in production
var dependencies = [
  'react',
  'react/addons',
  'immutable',
  'flux',
  'eventemitter2',
  'chess.js',
  'lodash.omit',
  'socket.io-client',
  'es6-shim'
];

var browserifyTask = function() {

  ['index.js', 'play.js'].forEach(function(bundle) {
    var appBundler = browserify({
      entries: './src/js/' + bundle,
      transform: [babelify],
      debug: IS_DEVELOPMENT,
      // required by watchify
      cache: {}, packageCache: {}, fullPaths: IS_DEVELOPMENT
    });
      
    (IS_DEVELOPMENT ? dependencies : []).forEach(function(dep) {
      appBundler.external(dep);
    });

    var rebundle = function() {
      var start = Date.now();
      console.log('Building BROWSERIFY(' + bundle + ') bundle');
      appBundler.bundle()
        .on('error', gutil.log)
        .pipe(source(bundle))
        .pipe(gulpif(!IS_DEVELOPMENT, streamify(uglify())))
        .pipe(gulp.dest(IS_DEVELOPMENT ? './build/js/' : './dist/js/'))
        .pipe(notify(function() {
          gutil.log(gutil.colors.green('BROWSERIFY(' + bundle +
            ') bundle built in ' + (Date.now() - start) + 'ms'));
        }));
    };

    if (IS_DEVELOPMENT) {
      appBundler = watchify(appBundler);
      appBundler.on('update', rebundle);
    }
    
    rebundle();
  });
  
  if (IS_DEVELOPMENT) {
    var vendorBundler = browserify({
      debug: true,
      require: dependencies
    });

    var start = new Date();
    console.log('Building VENDOR bundle');
    vendorBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('vendor.js'))
      .pipe(gulp.dest('./build/js/'))
      .pipe(notify(function() {
        gutil.log(gutil.colors.green(
          'VENDOR bundle built in ' + (Date.now() - start) + 'ms'));
      }));
    }
  
};

var cssTask = function() {
  if (IS_DEVELOPMENT) {
    var run = function() {
      var start = new Date();
      console.log('Building CSS bundle');

      gulp.src('./src/css/main.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
          errLogToConsole: true
        }))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./build/css/'))
        .pipe(notify({
          message: function() {
            gutil.log(gutil.colors.green(
              'CSS bundle built in ' + (Date.now() - start) + 'ms'));
          },
          onLast: true
        }));
    };
    run();
    gulp.watch('./src/css/*.scss', run);
  } else {
    gulp.src('./src/css/main.scss')
      .pipe(sass({
        errLogToConsole: true
      }))
      .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
      }))
      .pipe(cssmin())
      .pipe(gulp.dest('./dist/css/'))
      .pipe(notify({
        message: function() {
          gutil.log(gutil.colors.green('CSS bundle built.'));
        },
        onLast: true
      }));
  }
};

var imageminTask = function() {
  console.log('Optimizing images');
  gulp.src('./src/img/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}]
    }))
    .pipe(gulp.dest('./' + (IS_DEVELOPMENT ? 'build' : 'dist') + '/img/'))
    .pipe(notify({
      message: function() {
        gutil.log(gutil.colors.green('IMAGES/SVG optimized.'));
      },
      onLast: true
    }));
};

var copyTask = function() {
  console.log('Copying sound files and fonts');
  gulp.src('./src/snd/*')
    .pipe(gulp.dest(IS_DEVELOPMENT ? './build/snd/' : './dist/snd/'))
    .pipe(notify({
      message: function() {
        gutil.log(gutil.colors.green('SOUND FILES copied.'));
      },
      onLast: true
    }));

  gulp.src('./src/fonts/*')
    .pipe(gulp.dest(IS_DEVELOPMENT ? './build/fonts/' : './dist/fonts/'))
    .pipe(notify({
      message: function() {
        gutil.log(gutil.colors.green('FONTS copied.'));
      },
      onLast: true
    }));
};

gulp.task('default', function() {
  browserifyTask();
  cssTask();
  imageminTask();
  copyTask();
});