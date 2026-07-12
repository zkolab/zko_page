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
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

function hasAttribute(tag, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s*=|(?=\\s|/?>))`, 'i').test(tag);
}

function visibleText(html) {
  return html
    .replace(/<!--[^]*?-->/g, '')
    .replace(/<(?:script|style)\b[^>]*>[^]*?<\/(?:script|style)\s*>/gi, '')
    .replace(/<[^>]+>/g, ' ');
}

function blocksFollowing(source, headerPattern) {
  const blocks = [];

  for (const match of source.matchAll(headerPattern)) {
    const openBrace = match.index + match[0].lastIndexOf('{');
    let depth = 0;

    for (let index = openBrace; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1;
      if (source[index] !== '}') continue;

      depth -= 1;
      if (depth === 0) {
        blocks.push(source.slice(openBrace + 1, index));
        break;
      }
    }
  }

  return blocks;
}

function ruleBodies(block) {
  return blocksFollowing(block, /[^{}]+\{/g);
}

test('required site files exist', () => {
  const requiredPaths = ['index.html', 'styles.css', 'script.js', 'README.md'];
  const missingPaths = requiredPaths.filter((path) => !existsSync(fileUrl(path)));

  assert.deepEqual(missingPaths, [], `missing required files: ${missingPaths.join(', ')}`);
});

test('index.html exposes the required sections and purchase-link fallbacks', () => {
  requireFile('index.html');
  const html = read('index.html');

  for (const id of ['pain-points', 'workflow', 'features', 'software', 'specs', 'buy']) {
    assert.match(html, new RegExp(`\\bid\\s*=\\s*["']${id}["']`, 'i'), `missing #${id}`);
  }

  const purchaseAnchors = (html.match(/<a\b[^>]*>/gi) ?? []).filter((tag) =>
    hasAttribute(tag, 'data-purchase-link'),
  );

  assert.ok(purchaseAnchors.length > 0, 'expected an anchor with data-purchase-link');
  for (const [index, anchor] of purchaseAnchors.entries()) {
    assert.equal(
      attributeValue(anchor, 'href'),
      purchaseUrl,
      `purchase anchor ${index + 1} should have the exact fallback href`,
    );
  }
});

test('index.html does not display pricing', () => {
  requireFile('index.html');
  const html = read('index.html');
  const text = visibleText(html);

  assert.doesNotMatch(html, /[¥￥]|售价|价格\s*[:：]/, 'index.html should not contain price markers');
  assert.doesNotMatch(
    text,
    /(?:\d+(?:\.\d+)?\s*元(?!器件|数据|素)|价格\s*(?:为|是)?\s*\d+(?:\.\d+)?)/,
    'index.html should not display a numeric price',
  );
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
  const css = read('styles.css').replace(/\/\*[^]*?\*\//g, '');
  const responsiveBlocks = blocksFollowing(
    css,
    /@media\b[^{}]*\(\s*max-width\s*:[^)]+\)[^{}]*\{/gi,
  );
  const reducedMotionBlocks = blocksFollowing(
    css,
    /@media\b[^{}]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[^{}]*\{/gi,
  );
  const focusVisibleBlocks = blocksFollowing(css, /[^{}]*:focus-visible[^{}]*\{/gi);

  assert.ok(
    responsiveBlocks.some((block) =>
      ruleBodies(block).some((body) => /\b[-\w]+\s*:\s*[^;{}]+/.test(body)),
    ),
    'a max-width media query should contain a CSS rule',
  );
  assert.ok(
    reducedMotionBlocks.some((block) =>
      ruleBodies(block).some((body) =>
        /\b(?:animation(?:-[-\w]+)?|transition(?:-[-\w]+)?|scroll-behavior)\s*:\s*[^;{}]+/.test(
          body,
        ),
      ),
    ),
    'reduced-motion media query should override motion behavior',
  );
  assert.ok(
    focusVisibleBlocks.some((block) =>
      [...block.matchAll(/\b(?:outline|box-shadow)\s*:\s*([^;{}]+)/gi)].some((match) => {
        const value = match[1].trim();
        return !/^(?:none|0(?:[a-z%]+)?|initial|inherit|unset)$/i.test(value)
          && !/\btransparent\b/i.test(value);
      }),
    ),
    ':focus-visible should define a visible outline or box-shadow',
  );
});

test('script.js defines and applies the exact purchase URL', () => {
  requireFile('script.js');
  const script = read('script.js');
  const escapedPurchaseUrl = purchaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  assert.match(
    script,
    new RegExp(`\\bconst\\s+PURCHASE_URL\\s*=\\s*["']${escapedPurchaseUrl}["']`),
  );
  assert.match(
    script,
    /\.querySelector(?:All)?\s*\(\s*(["'`])\[data-purchase-link\]\1\s*\)/,
    'script.js should select elements by [data-purchase-link]',
  );
  assert.match(
    script,
    /(?:(?:\.\s*href|\[\s*["']href["']\s*\])\s*=\s*PURCHASE_URL\b|\.setAttribute\s*\(\s*["']href["']\s*,\s*PURCHASE_URL\b)/,
    'script.js should assign PURCHASE_URL to href',
  );
});
