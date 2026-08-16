import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path);
const readText = (path) => readFileSync(path, 'utf8');

test('GPT Image 2 command generates only the 5:3 decorative background', () => {
  const command = readText('output/imagegen/zko-packaging-background-command.ps1');
  const prompt = readText('output/imagegen/zko-packaging-background-prompt.txt');
  assert.match(command, /gpt-image-2/);
  assert.match(command, /2400x1440/);
  assert.match(command, /--quality high/);
  assert.match(prompt, /no text/i);
  assert.match(prompt, /no logo/i);
  assert.match(prompt, /no QR code/i);
});

test('editable sticker contains exact approved content and dimensions', () => {
  const svg = readText('assets/packaging/zko-packaging-sticker.svg');
  assert.match(svg, /viewBox="0 0 2400 1440"/);
  assert.match(svg, /字库 AI 编程手柄/);
  assert.match(svg, /把 AI 工作流握在手里/);
  assert.match(svg, /扫码访问官网/);
  assert.match(svg, /https:\/\/zkolab\.com\//);
  assert.match(svg, /ZKO Logo/);
});

test('homepage address uses a legible enlarged type size', () => {
  const svg = readText('assets/packaging/zko-packaging-sticker.svg');
  assert.match(
    svg,
    /font-size="64" font-weight="600">\s*<tspan[^>]*>zkolab\.com<\/tspan>\s*<\/text>/,
  );
});

test('vector logo also has a transparent 1095 by 360 PNG export', () => {
  const png = read('ZKO_logo_vector.png');
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 1095);
  assert.equal(png.readUInt32BE(20), 360);
  assert.ok([4, 6].includes(png[25]), 'logo PNG should preserve an alpha channel');
});

test('delivery PNG is 2400 by 1440 pixels', () => {
  const png = read('assets/packaging/zko-packaging-sticker.png');
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 2400);
  assert.equal(png.readUInt32BE(20), 1440);
});
