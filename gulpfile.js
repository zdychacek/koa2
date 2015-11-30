/* eslint-disable strict, no-console */
'use strict';

require('shelljs/global');
require('shelljs').config.fatal = true;

const path = require('path');
const fs = require('fs');
const respawn = require('respawn');
const program = require('commander');
const runSequence = require('run-sequence');
const gulp = require('gulp');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const eslint = require('gulp-eslint');
const cache = require('gulp-cached');
const del = require('del');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');

program.option('-d, --debug', 'Debug mode on');
program.parse(process.argv);

const env = process.env;

env.NODE_PATH = env.NODE_PATH || path.resolve(__dirname, 'dist');
env.NODE_ENV = env.NODE_ENV || 'development';

const paths = {
	src: 'src',
	dist: 'dist',
	sourceRoot: path.join(__dirname, 'src'),
};

let babelOptions = null;

// read babel options from .babelrc file
try {
	babelOptions = JSON.parse(fs.readFileSync('./.babelrc', 'utf8'));
}
catch (ex) {
	throw new SyntaxError('Error while parsing .babelrc file.');
}

function transpile (src, dest) {
	console.log(gutil.colors.cyan('⚒ Transpiling...'));

	return gulp.src(src)
		.pipe(plumber())
		.pipe(cache('transpile'))
		.pipe(sourcemaps.init())
		.pipe(babel(babelOptions))
		.pipe(sourcemaps.write('.', { sourceRoot: paths.sourceRoot }))
		.pipe(gulp.dest(dest));
}

function lint (src) {
	console.log(gutil.colors.cyan('⚒ Linting...'));

	return gulp.src(src)
		.pipe(cache('lint'))
		.pipe(eslint({ useEslintrc: true }))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

gulp.task('transpile', () => transpile(`${paths.src}/**/*.js`, paths.dist));

gulp.task('lint', () => lint([ `${paths.src}/**/*.js`, 'gulpfile.js' ]));

gulp.task('clean', (done) => del([ paths.dist ], done));

gulp.task('default', (done) => {
	const command = [ 'node', '--es_staging', '--harmony_proxies' ];

	// if debug flag was specified, run node in debug mode
	if (program.debug) {
		command.push('--debug');
	}

	command.push('index.js');

	const monitor = respawn(command, {
		env,
		cwd: paths.dist,
		maxRestarts: 10,
		sleep: 300,
		stdio: 'inherit',
	});

	runSequence([ 'clean', 'lint' ], 'transpile', () => {
		monitor.start();
		done();
	});

	monitor
		.on('stdout', (data) => console.log(data.toString()))
		.on('stderr', (err) => console.error(err.toString()));

	function restartMonitor () {
		monitor.stop(() => monitor.start());
	}

	gulp.watch(`${paths.src}/**/*.js`, (event) => {
		gutil.log(`File changed: ${gutil.colors.yellow(event.path)}`);

		let isLintError = false;

		lint(`${paths.src}/**/*.js`)
			.resume()
			.on('error', () => isLintError = true)
			.on('end', () => {
				if (isLintError) {
					return;
				}

				transpile(`${paths.src}/**/*.js`, paths.dist).on('end', restartMonitor);
			});
	});
});
