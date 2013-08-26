///<reference path='../../vendor/dt-node/node.d.ts'/>
///<reference path='../../vendor/dt-mocha/mocha.d.ts'/>
///<reference path='../../vendor/dt-chai/chai.d.ts'/>
///<reference path='../../vendor/dt-sinon/sinon.d.ts'/>
import common = require('./common');
import _line = require('../../lib/line');


var expect = common.expect;
var reporter = common.reporter;
var context = common.context;
var Line = _line.Line;
var Charsets = _line.Charsets;

describe('Line class', function() {

	describe('Byte Order Mark (BOM signature)', function() {

		it('ignores BOM signature when not line number 1', function() {
			var line = new Line('\u00EF\u00BB\u00BFfoo\n');
			expect(line.BOM).to.be.undefined;
			expect(line.Charsets).to.be.undefined;
			expect(line.Text).to.equal('\u00EF\u00BB\u00BFfoo');
		});

		it('detects BOM signature when assigned line number 1', function() {
			var line = new Line('\u00EF\u00BB\u00BFfoo');
			expect(line.BOM).to.be.undefined;
			line.Number = 1;
			expect(line.BOM).to.equal('\u00EF\u00BB\u00BF');
			expect(line.Charsets).to.equal(Charsets.utf_8_bom);
			expect(line.Text).to.equal('foo');
		});

		it('detects utf-8-bom charset', function() {
			var line = new Line('\u00EF\u00BB\u00BFfoo\n', { number: 1 });
			expect(line.BOM).to.equal('\u00EF\u00BB\u00BF');
			expect(line.Charsets).to.equal(Charsets.utf_8_bom);
		});

		it('detects utf-16be charset', function() {
			var line = new Line('\u00FE\u00FFfoo', { number: 1 });
			expect(line.BOM).to.equal('\u00FE\u00FF');
			expect(line.Charsets).to.equal(Charsets.utf_16be);
		});

		it('detects utf-16le charset', function() {
			var line = new Line('\u00FF\u00FEfoo', { number: 1 });
			expect(line.BOM).to.equal('\u00FF\u00FE');
			expect(line.Charsets).to.equal(Charsets.utf_16le);
		});

		it('detects utf-32le charset', function() {
			var line = new Line('\u00FF\u00FE\u0000\u0000foo', { number: 1 });
			expect(line.BOM).to.equal('\u00FF\u00FE\u0000\u0000');
			expect(line.Charsets).to.equal(Charsets.utf_32le);
		});

		it('detects utf-32be charset', function() {
			var line = new Line('\u0000\u0000\u00FE\u00FFfoo', { number: 1 });
			expect(line.BOM).to.equal('\u0000\u0000\u00FE\u00FF');
			expect(line.Charsets).to.equal(Charsets.utf_32be);
		});

		it('allows creation of a solo BOM signature character', function() {
			var line = new Line('\u0000\u0000\u00FE\u00FF', { number: 1 });
			expect(line.BOM).to.equal('\u0000\u0000\u00FE\u00FF');
			expect(line.Charsets).to.equal(Charsets.utf_32be);
		});

	});

	it('separates line text from the BOM signature and newline character', function() {
		var line = new Line('\u00EF\u00BB\u00BFfoo\n', { number: 1 });
		expect(line.BOM).to.equal('\u00EF\u00BB\u00BF');
		expect(line.Charsets).to.equal(Charsets.utf_8_bom);
		expect(line.Text).to.equal('foo');
		expect(line.Newline.Character).to.equal('\n');
		expect(line.Raw).to.equal('\u00EF\u00BB\u00BFfoo\n');
	});

	it('allows creation of an undefined line', function() {
		var line = new Line();
		expect(line.Number).to.be.undefined;
		expect(line.BOM).to.be.undefined;
		expect(line.Charsets).to.be.undefined;
		expect(line.Text).to.be.undefined;
		expect(line.Newline).to.be.undefined;
		expect(line.Raw).to.be.undefined;
	});

	it('allows creation of an empty line, but the text is undefined', function() {
		var line = new Line('');
		expect(line.Text).to.be.undefined;
	});

	it('allows creation of a solo newline character', function() {
		var line = new Line('\n');
		expect(line.Text).to.be.undefined;
		expect(line.Newline.Character).to.equal('\n');
	});

	it('throws an InvalidBomError if the BOM is invalid or unsupported', function() {
		var fn = function() {
			new Line('', { bom: '\u00AA' });
		};
		expect(fn).to.throw(Line.InvalidBomError);
	});

});
