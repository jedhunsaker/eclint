import isNumber = require('lodash.isnumber');
import linez = require('linez');

import eclint = require('../eclint');

function resolve(settings: eclint.Settings) {
	return isNumber(settings.max_line_length) ? settings.max_line_length : void(0);
}

function check(context: eclint.Context, settings: eclint.Settings, line: linez.Line) {
	var inferredSetting = infer(line);
	var configSetting = resolve(settings);
	if (inferredSetting > settings.max_line_length) {
		context.report([
			'line ' + line.number + ':',
			'line length: ' + inferredSetting + ',',
			'exceeds: ' + configSetting
		].join(' '));
	}
}

function fix(settings: eclint.Settings, line: linez.Line) {
	return line; // noop
}

function infer(line: linez.Line) {
	return line.text.length;
}

var MaxLineLengthRule: eclint.LineRule = {
	type: 'LineRule',
	resolve: resolve,
	check: check,
	fix: fix,
	infer: infer
};

export = MaxLineLengthRule;
