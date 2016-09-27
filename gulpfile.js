// Dependencias
var gulp = require('gulp');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var pngquant = require('imagemin-pngquant');
var $ = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});
var BROWSER_SYNC_RELOAD_DELAY = 500;

// Rutas
paths = {
	bower: './dev/libs',
	dev: './dev',
	dist: './dist',
	base: './'
};

files = {
	jade: {
		watch: paths.dev + "/jade/**/*.jade",
		src: paths.dev + "/jade/**/*.jade",
		dist: paths.dist
	},
  scss: {
    watch: paths.dev + "/scss/**/*.scss",
    src: paths.dev + "/scss/main.scss",
    dest: paths.dev + "/css",
    dist: paths.dist + "/css"
  },
	js: {
		watch: paths.dev + "/js/**/*.js",
		src: paths.dev + "/js/**/*.js",
		dist: paths.dist + "/js",
		libs: paths.dist + "/js/libs"
	},
	img: {
		watch : paths.dev + "/img/**/*",
		src : paths.dev + "/img/**/*.{jpg,png,gif}",
		dist: paths.dist + "/img"
	},
	fonts: {
		watch: paths.dev + '/fonts',
		src: paths.dev + '/fonts/**/*.{eot,svg,ttf,woff,woff2}',
		dist: paths.dist +'/fonts'
	}

};

// Tareas
gulp.task('default', ['browser-sync', 'watch']);

gulp.task('libs', function() {
	gulp.start(['browserify']);
	return;
});

gulp.task("build:html", function() {
	gulp.src([files.jade.src, '!./dev/jade/layouts/**/*', '!./dev/jade/partials/**/*'])
	.pipe($.plumber({errorHandler: $.notify.onError("<%= error.message %>")}))
	.pipe($.changed(files.jade.dist,{extension: '.html'}))
	.pipe($.jade({pretty: true}))
	.pipe($.notify("Compiled: <%= file.relative %>"))
	.pipe(gulp.dest(files.jade.dist))
});

gulp.task("build:js", function() {
  gulp.src(files.js.src)
  .pipe($.concat('main.js'))
  .pipe($.plumber({errorHandler: $.notify.onError("<%= error.message %>")}))
  .pipe($.uglify())
  .pipe($.rename({suffix: '.min'}))
  .pipe($.notify("Compiled: <%= file.relative %>"))
  .pipe(gulp.dest(files.js.dist));
});

gulp.task("build:css", function() {
  gulp.src(files.scss.src)
  .pipe($.plumber({errorHandler: $.notify.onError("<%= error.message %>")}))
  .pipe($.sass({outputStyle: 'compressed'}))
  .pipe($.notify("Compiled: <%= file.relative %>"))
  .pipe($.autoprefixer())
  .pipe($.csso())
  // .pipe($.uglify())
  .pipe($.rename({suffix: '.min'}))
  .pipe(gulp.dest(files.scss.dist))
});

gulp.task('copy', function() {
	gulp.src(files.fonts.src)
		.pipe(gulp.dest(files.fonts.dist));
	gulp.src(files.img.src)
		.pipe($.changed(files.img.dist))
		.pipe($.imagemin({
			progressive: true,
			use: [
			pngquant({
				floyd: 0.7,
				quality: 80
			})
			]
		}))
		.pipe(gulp.dest(files.img.dist));
});

gulp.task('watch', function () {
	gulp.watch(files.jade.watch, ["build:html"]);
	gulp.watch(files.js.watch, ["build:js"]);
	gulp.watch(files.scss.watch, ["build:css"]);
	gulp.watch(paths.base+'sources.js', ['browserify']);
});

// Servidor
gulp.task('browser-sync', ['nodemon'], function() {
	browserSync.init(null, {
		files: ["dist/**/*.*"],
		proxy: "http://localhost:3000",
		browser: ['google chrome'],
		port: 3000
	});
});

gulp.task('nodemon', function (cb) {
	var started = false;
	return $.nodemon({
		script: 'server.js',
		watch: ['server.js'],
		ignore: [
			'gulpfile.js',
			'node_modules/',
			'.DS_Store'
		]
	})
	.on('start', function () {
		if (!started) {
			started = true;
			cb();
		}
	})
  .on('restart', function onRestart() {
    setTimeout(function reload() {
      browserSync.reload({
        stream: false
      });
    }, BROWSER_SYNC_RELOAD_DELAY);
  });
});

// Constructor Librerías
gulp.task('browserify', function() {
	return browserify('./sources.js')
	.bundle()
	.pipe(source('bundle.js'))
	.pipe(buffer())
	.pipe($.uglify())
	.pipe(gulp.dest(files.js.libs));
});
