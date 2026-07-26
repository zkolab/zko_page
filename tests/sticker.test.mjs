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
  assert.match(svg, /苍虬 AI 编程手柄/);
  assert.match(svg, /把 AI 工作流握在手里/);
  assert.match(svg, /扫码访问官网/);
  assert.match(svg, /https:\/\/shenqiqishi\.github\.io\/zko_page\//);
  assert.match(svg, /ZKO Logo/);
});

test('delivery PNG is 2400 by 1440 pixels', () => {
  const png = read('assets/packaging/zko-packaging-sticker.png');
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 2400);
  assert.equal(png.readUInt32BE(20), 1440);
});
