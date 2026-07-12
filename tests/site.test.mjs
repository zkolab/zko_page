import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const purchaseUrl = 'https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B';

function fileUrl(path) {
  return new URL(`../${path}`, import.meta.url);
}

function read(path) {
  return readFileSync(fileUrl(path), 'utf8');
}

function requireFile(path) {
  assert.ok(existsSync(fileUrl(path)), `${path} should exist`);
}

function attributeValue(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

test('required site files exist', () => {
  for (const path of ['index.html', 'styles.css', 'script.js', 'README.md']) {
    requireFile(path);
  }
});

test('index.html exposes the required sections and purchase link without prices', () => {
  requireFile('index.html');
  const html = read('index.html');

  for (const id of ['pain-points', 'workflow', 'features', 'software', 'specs', 'buy']) {
    assert.match(html, new RegExp(`\\bid\\s*=\\s*["']${id}["']`, 'i'), `missing #${id}`);
  }

  assert.ok(html.includes(purchaseUrl), 'index.html should contain the exact purchase URL');
  assert.doesNotMatch(html, /[¥￥]|售价|价格\s*[:：]/, 'index.html should not display pricing');
});

test('index.html has at least six accessible, dimensioned images', () => {
  requireFile('index.html');
  const imageTags = read('index.html').match(/<img\b[^>]*>/gi) ?? [];

  assert.ok(imageTags.length >= 6, `expected at least 6 images, found ${imageTags.length}`);

  for (const [index, tag] of imageTags.entries()) {
    const alt = attributeValue(tag, 'alt');
    const width = attributeValue(tag, 'width');
    const height = attributeValue(tag, 'height');

    assert.ok(alt?.trim(), `image ${index + 1} should have nonempty alt text`);
    assert.match(width ?? '', /^\d+$/, `image ${index + 1} should have a numeric width`);
    assert.match(height ?? '', /^\d+$/, `image ${index + 1} should have a numeric height`);
  }
});

test('styles.css includes responsive, reduced-motion, and keyboard-focus rules', () => {
  requireFile('styles.css');
  const css = read('styles.css');

  assert.match(css, /@media[^{}]*\(\s*max-width\s*:[^)]+\)/i);
  assert.match(css, /@media[^{}]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  assert.match(css, /:focus-visible\b/i);
});

test('script.js defines and applies the exact purchase URL', () => {
  requireFile('script.js');
  const script = read('script.js');
  const escapedPurchaseUrl = purchaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  assert.match(
    script,
    new RegExp(`\\bconst\\s+PURCHASE_URL\\s*=\\s*["']${escapedPurchaseUrl}["']`),
  );
  assert.match(script, /data-purchase-link/);
});
