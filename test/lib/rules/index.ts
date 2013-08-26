﻿///<reference path='../../../vendor/dt-node/node.d.ts'/>


var rules = [];

[
	'charset',
	'end_of_line',
	'indent_size',
	'indent_style',
	'insert_final_newline',
	'max_line_length',
	'tab_width',
	'trim_trailing_whitespace'
].forEach((ruleName) => {
	rules.push(require('./' + ruleName));
});

module.exports = rules;
