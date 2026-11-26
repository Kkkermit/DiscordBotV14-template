'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { printBanner, renderAsciiArt } = require('../src/lib/banner');
const { createClient } = require('./helpers/fakes');

describe('renderAsciiArt', () => {
	it('draws the text with the chosen figlet font', () => {
		const art = renderAsciiArt('Hi', 'Standard', 80);
		assert.ok(art.split('\n').length > 1, 'expected several lines of art');
		assert.doesNotMatch(art, /Hi/);
	});

	it('wraps long names to the given width', () => {
		const art = renderAsciiArt('A really long bot name', 'Standard', 40);
		assert.ok(art.split('\n').every((line) => line.length <= 40));
	});

	it('falls back to plain text when the font has none of the characters', () => {
		assert.equal(renderAsciiArt('ボット', 'Standard', 80), 'ボット');
	});
});

describe('printBanner', () => {
	it("prints the bot's name as art followed by a summary", (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let output = '';
		const stream = { columns: 120, write: (chunk) => (output += chunk) };

		printBanner(client, stream);
		assert.ok(output.includes(renderAsciiArt('TemplateBot', client.config.banner.font, 120)));
		assert.match(output, /TemplateBot is online! \(template v\d+\.\d+\.\d+\)/);
		assert.match(output, /Commands: 5 slash, 4 prefix/);
	});
});
