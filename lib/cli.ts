import _ = require('lodash');
const tap = require('gulp-tap');
import File = require('vinyl');
import vfs = require('vinyl-fs');
import gutil = require('gulp-util');

import eclint = require('./eclint');

const cli = require('gitlike-cli');
const pkg = require('../package');
const reporter = require('gulp-reporter');
const filter = require('gulp-filter');
const fileType = require('file-type');
const binaryexts = require('binaryextensions');

cli.on('error', err => {
	console.error('\n  ' + gutil.colors.red(err.toString()));
	err.command.outputUsage();
	err.command.outputCommands();
	err.command.outputOptions();
	process.exit(1);
});

cli.version(pkg.version);
cli.description(pkg.description);

function addSettings(cmd): void {
	cmd.option('-c, --charset <charset>',        'Set to latin1, utf-8, utf-8-bom (see docs)');
	cmd.option('-i, --indent_style <style>',     'Set to tab or space');
	cmd.option('-s, --indent_size <n>',          'Set to a whole number or tab');
	cmd.option('-t, --tab_width <n>',            'Columns used to represent a tab character');
	cmd.option('-w, --trim_trailing_whitespace', 'Trims any trailing whitespace');
	cmd.option('-e, --end_of_line <newline>',    'Set to lf, cr, crlf');
	cmd.option('-n, --insert_final_newline',     'Ensures files ends with a newline');
	cmd.option('-m, --max_line_length <n>',      'Set to a whole number');
}

function excludeBinaryFile(file: File) {
	const type = file && file.isBuffer() && fileType(file.contents);
	return !(type && type.ext && binaryexts.indexOf(type.ext) >= 1);
}

interface CheckOptions extends eclint.Settings {
	reporter?: (file: File, message: string) => void;
}

function handleNegativeGlobs(files?: string[]): string[] {
	if (!files) {
		return ['**/*', '!**/.git', '!**/.svn', '!**/.hg', '!**/.DS_Store', '!**/node_modules', '!**/bower_components'];
	}
	return files.filter(file => (
		typeof file === 'string'
	)).map(glob => (
		glob.replace(/^\[!\]/, '!')
	));
}

const check = cli.command('check [<files>...]');
check.description('Validate that file(s) adhere to .editorconfig settings');
addSettings(check);
check.action((args: any, options: CheckOptions) => {
	const stream = vfs.src(handleNegativeGlobs(args.files), {
		stripBOM: false
	})
		.pipe(filter(excludeBinaryFile))
		.pipe(eclint.check({
			settings: _.pick(options, eclint.ruleNames),
		})).pipe(reporter({
			console: console.error,
			filter: null,
		}))
		.on('error', (error) => {
			if (error.plugin !== 'gulp-reporter') {
				console.error(error);
			}
			process.exit(1);
		});
	(<any>stream).resume();
});

interface FixOptions extends eclint.Settings {
	/**
	 * Destination folder to pipe source files.
	 */
	dest?: string;
}

const fix = cli.command('fix [<files>...]');
fix.description('Fix formatting errors that disobey .editorconfig settings');
addSettings(fix);
fix.option('-d, --dest <folder>', 'Destination folder to pipe source files');
fix.action((args: any, options: FixOptions) => {
	const stream = vfs.src(handleNegativeGlobs(args.files), {
		stripBOM: false
	})
		.pipe(filter(excludeBinaryFile))
		.pipe(eclint.fix({ settings: _.pick(options, eclint.ruleNames) }));
	if (options.dest) {
		return stream.pipe(vfs.dest(options.dest));
	}
	return stream.pipe((<any>vfs.dest)((file: File) => {
		return file.base;
	}));
});

const infer = cli.command('infer [<files>...]');
infer.description('Infer .editorconfig settings from one or more files');
infer.option('-s, --score', 'Shows the tallied score for each setting');
infer.option('-i, --ini',   'Exports file as ini file type');
infer.option('-r, --root',  'Adds root = true to your ini file, if any');
infer.action((args: any, options: eclint.InferOptions) => {
	return vfs.src(handleNegativeGlobs(args.files), {
		stripBOM: false
	})
		.pipe(filter(excludeBinaryFile))
		.pipe(eclint.infer(options))
		.pipe(tap((file: File) => {
			console.log(file.contents + '');
		}));
});

export = cli;
