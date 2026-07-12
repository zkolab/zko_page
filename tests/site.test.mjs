import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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

function stripHtmlComments(html) {
  return html.replace(/<!--[^]*?-->/g, '');
}

function visibleText(html) {
  return stripHtmlComments(html)
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

function isDisablingDuration(value) {
  const durations = value.replace(/\s*!important\s*$/i, '').split(',');

  return durations.every((duration) => {
    const match = duration.trim().match(/^(\d*\.?\d+)(ms|s)$/i);
    if (!match) return false;

    const amount = Number(match[1]);
    return match[2].toLowerCase() === 'ms' ? amount <= 0.01 : amount === 0;
  });
}

function disablesMotion(body) {
  return [...body.matchAll(
    /\b(animation(?:-name|-duration)?|transition(?:-duration)?|scroll-behavior)\s*:\s*([^;{}]+)/gi,
  )].some(([, property, rawValue]) => {
    const value = rawValue.trim();
    const normalizedProperty = property.toLowerCase();

    if (normalizedProperty === 'scroll-behavior') return /^auto\b/i.test(value);
    if (normalizedProperty === 'animation' || normalizedProperty === 'animation-name') {
      return /^none\b/i.test(value);
    }
    if (normalizedProperty.endsWith('-duration')) return isDisablingDuration(value);
    if (normalizedProperty === 'transition') {
      return /^none\b/i.test(value) || /(?:^|\s)0(?:\.0+)?m?s\b/i.test(value);
    }
    return false;
  });
}

test('required site files exist', () => {
  const requiredPaths = ['index.html', 'styles.css', 'script.js', 'README.md'];
  const missingPaths = requiredPaths.filter((path) => !existsSync(fileUrl(path)));

  assert.deepEqual(missingPaths, [], `missing required files: ${missingPaths.join(', ')}`);
});

test('index.html exposes the required sections and purchase-link fallbacks', () => {
  requireFile('index.html');
  const html = stripHtmlComments(read('index.html'));
  const openingTags = html.match(/<[\w-]+\b[^>]*>/gi) ?? [];

  for (const id of ['pain-points', 'workflow', 'features', 'software', 'specs', 'buy']) {
    assert.ok(
      openingTags.some((tag) => attributeValue(tag, 'id') === id),
      `missing #${id}`,
    );
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
  const rawHtml = read('index.html');
  const html = stripHtmlComments(rawHtml);
  const text = visibleText(html);

  assert.doesNotMatch(
    rawHtml,
    /[¥￥]|售价|价格\s*[:：]/,
    'index.html should not contain explicit price markers',
  );
  assert.doesNotMatch(
    text,
    /(?:\d+(?:\.\d+)?\s*元(?!器件|数据|素)|价格\s*(?:为|是)?\s*\d+(?:\.\d+)?)/,
    'index.html should not display a numeric price',
  );
});

test('index.html has at least six accessible, dimensioned images', () => {
  requireFile('index.html');
  const imageTags = stripHtmlComments(read('index.html')).match(/<img\b[^>]*>/gi) ?? [];

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
      ruleBodies(block).some((body) => disablesMotion(body)),
    ),
    'reduced-motion media query should disable animation, transition, or smooth scrolling',
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
  const purchaseLinks = [{ href: 'wrong://first' }, { href: 'wrong://second' }];
  const classList = {
    add() {},
    remove() {},
    toggle() {},
    contains() { return false; },
  };
  const mediaQuery = {
    matches: true,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  };
  const document = {
    readyState: 'complete',
    documentElement: { classList, dataset: {}, style: { setProperty() {} } },
    body: { classList, dataset: {}, style: { setProperty() {} } },
    querySelectorAll(selector) {
      return selector === '[data-purchase-link]' ? purchaseLinks : [];
    },
    querySelector() { return null; },
    getElementById() { return null; },
    createElement() { return { classList, dataset: {}, style: {}, setAttribute() {} }; },
    addEventListener(type, callback) {
      if (type === 'DOMContentLoaded') callback();
    },
  };
  const context = {
    document,
    matchMedia() { return mediaQuery; },
    addEventListener(type, callback) {
      if (type === 'load') callback();
    },
    removeEventListener() {},
    setTimeout() { return 1; },
    clearTimeout() {},
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'node:test' },
    location: { href: 'https://example.test/' },
    console,
    URL,
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;

  assert.match(
    script,
    new RegExp(`\\bconst\\s+PURCHASE_URL\\s*=\\s*["']${escapedPurchaseUrl}["']`),
    'script.js should explicitly declare const PURCHASE_URL with the exact URL',
  );
  runInNewContext(
    `${script}\n;globalThis.__purchaseUrlForTest = PURCHASE_URL;`,
    context,
    { timeout: 1_000 },
  );

  assert.equal(context.__purchaseUrlForTest, purchaseUrl, 'PURCHASE_URL should equal the exact URL');
  assert.deepEqual(
    purchaseLinks.map((link) => link.href),
    [purchaseUrl, purchaseUrl],
    'script.js should apply PURCHASE_URL to every purchase link',
  );
});
