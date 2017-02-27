///<reference path="../../typings/lodash/lodash.d.ts" />
var _ = require('lodash');
import linez = require('linez');

import eclint = require('../eclint');
import EditorConfigError =  require('../editor-config-error');

var newlines = {
	lf: '\n',
	crlf: '\r\n',
	cr: '\r'
};

function resolve(settings: eclint.Settings) {
	if (_.isBoolean(settings.insert_final_newline)) {
		return settings.insert_final_newline;
	}
	return void(0);
}

function check(context: eclint.Context, settings: eclint.Settings, doc: linez.Document) {
	var configSetting = resolve(settings);
	var inferredSetting = infer(doc);
	if (configSetting == null || inferredSetting === configSetting) {
		return;
	}
	var message: string;
	if (configSetting) {
		message = 'expected final newline';
	} else {
		message = 'unexpected final newline';
	}
	context.report(message);

	var error = new EditorConfigError(message);
	error.lineNumber = doc.lines.length;
	var lastLine: linez.Line = doc.lines[doc.lines.length - 1];
	error.columnNumber = lastLine.text.length;
	error.rule = 'end_of_line';
	error.source = lastLine.text.length + lastLine.ending.length;
	return [error];
}

function fix(settings: eclint.Settings, doc: linez.Document) {
	var lastLine: linez.Line;
	var configSetting = resolve(settings);
	if (configSetting && !infer(doc)) {
		lastLine = doc.lines[doc.lines.length - 1];
		var endOfLineSetting = settings.end_of_line || 'lf';
		if (lastLine) {
			lastLine.ending = newlines[endOfLineSetting];
		} else {
			doc.lines.push({
				number: 1,
				text: '',
				ending: newlines[endOfLineSetting],
				offset: 0
			});
		}
		return doc;
	}
	if (!configSetting) {
		while (infer(doc)) {
			lastLine = doc.lines[doc.lines.length - 1];
			if (lastLine.text) {
				lastLine.ending = '';
				break;
			}
			doc.lines.pop();
		}
		return doc;
	}
	return doc;
}

function infer(doc: linez.Document) {
	var lastLine = doc.lines[doc.lines.length - 1];
	if (lastLine && lastLine.ending) {
		return true;
	}
	return false;
}

var InsertFinalNewlineRule: eclint.DocumentRule = {
	type: 'DocumentRule',
	resolve: resolve,
	check: check,
	fix: fix,
	infer: infer
};

export = InsertFinalNewlineRule;
