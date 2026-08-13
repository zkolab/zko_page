import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('shared pixel theme picker exposes all backgrounds and persistence', () => {
  const script = read('pixel-preview.js');
  const css = read('pixel-preview.css');
  const assets = readdirSync(new URL('../assets/themes/', import.meta.url)).filter((name) => name.endsWith('.webp'));

  assert.equal(assets.length, 17);
  for (const asset of assets) assert.match(script, new RegExp(asset.replaceAll('.', '\\.')));
  assert.match(script, /zko\.pixel\.theme\.v1/);
  assert.match(script, /buildZkoThemePicker/);
  assert.match(script, /localStorage\.setItem/);
  assert.match(css, /\.zko-theme-panel/);
  assert.match(css, /@media \(max-width:\s*700px\)/);
  assert.match(css, /--theme-scene/);
});

test('public pixel pages use the current shared style and theme-deck script versions', () => {
  for (const page of ['index.html', 'account.html', 'guide.html', 'docs.html', 'skill.html', 'shop.html']) {
    const html = read(page);
    assert.match(html, /pixel-preview\.css\?v=20260813-docs-center-v1/);
    assert.match(html, /pixel-preview\.js\?v=20260812-theme-deck-v1/);
  }
});
