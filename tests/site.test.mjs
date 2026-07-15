import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const purchaseUrl = 'https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B';
const releaseUrl = 'https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/tag/v0.3.48';
const officialDriverUrl = 'https://www.wch.cn/downloads/CH343SER_EXE.html';
const expectedImageDimensions = new Map([
  ['assets/images/hero.webp', [1122, 1402]],
  ['assets/images/workflow.webp', [1122, 1402]],
  ['assets/images/macros.webp', [1122, 1402]],
  ['assets/images/status.webp', [1122, 1402]],
  ['assets/images/autoclipboard-main.webp', [1311, 1062]],
  ['assets/images/autoclipboard-settings.webp', [2082, 1527]],
]);
const expectedImageSha256 = new Map([
  ['assets/images/hero.webp', '67611ffcdc432ac834acfdaa4787ff93eb675efb7869e32cc6b53b84b04c8eef'],
  ['assets/images/workflow.webp', 'e3ae1fb7f035f9c197101a7c2df2d8a030eeb6784869ad559149ca86d08130d4'],
  ['assets/images/macros.webp', '1730346e2f9af0ad2032828fc6adada2a36d8b17657c0becbf59a3ca67fc6731'],
  ['assets/images/status.webp', '259dc5d1ea4fda183c34262b3c7f6331445d33019c6fea84bc606ddbdd40319b'],
  ['assets/images/autoclipboard-main.webp', 'd913aae5a7568935d00e079f7b3cae99718be4506760447a796b0509f57f7965'],
  ['assets/images/autoclipboard-settings.webp', 'd21cd8e23b3978ca31aca47db89c5ad0fa685006568a5077a516f76591202f6f'],
]);

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

function assertExactImageSources(sources) {
  const expectedSources = [...expectedImageDimensions.keys()].sort();
  const uniqueSources = [...new Set(sources)].sort();

  assert.equal(sources.length, expectedSources.length, 'expected exactly six image references');
  assert.deepEqual(uniqueSources, expectedSources, 'image src values should match the reviewed set');
}

function assertExpectedImageIntegrity(src, buffer) {
  const expectedHash = expectedImageSha256.get(src);
  assert.ok(expectedHash, `${src} should have a reviewed SHA-256 digest`);
  const actualHash = createHash('sha256').update(buffer).digest('hex');
  assert.equal(actualHash, expectedHash, `${src} SHA-256 should match the reviewed image`);
}

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseWebPDimensions(buffer) {
  assert.ok(Buffer.isBuffer(buffer), 'WebP data should be a Buffer');
  assert.ok(buffer.length >= 12, 'WebP data is too short for a RIFF header');
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', 'missing RIFF signature');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP', 'missing WEBP signature');
  assert.equal(buffer.readUInt32LE(4) + 8, buffer.length, 'RIFF size does not match file length');

  for (let chunkOffset = 12; chunkOffset + 8 <= buffer.length;) {
    const chunkType = buffer.toString('ascii', chunkOffset, chunkOffset + 4);
    const chunkSize = buffer.readUInt32LE(chunkOffset + 4);
    const payloadOffset = chunkOffset + 8;
    const payloadEnd = payloadOffset + chunkSize;
    assert.ok(payloadEnd <= buffer.length, `${chunkType} chunk exceeds file length`);

    if (chunkType === 'VP8 ') {
      assert.ok(chunkSize >= 10, 'VP8 frame header is incomplete');
      assert.deepEqual(
        [...buffer.subarray(payloadOffset + 3, payloadOffset + 6)],
        [0x9d, 0x01, 0x2a],
        'VP8 frame sync code is invalid',
      );
      return {
        width: buffer.readUInt16LE(payloadOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(payloadOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === 'VP8L') {
      assert.ok(chunkSize >= 5, 'VP8L frame header is incomplete');
      assert.equal(buffer[payloadOffset], 0x2f, 'VP8L signature is invalid');
      const dimensionBits = buffer.readUInt32LE(payloadOffset + 1);
      return {
        width: (dimensionBits & 0x3fff) + 1,
        height: ((dimensionBits >>> 14) & 0x3fff) + 1,
      };
    }

    if (chunkType === 'VP8X') {
      assert.ok(chunkSize >= 10, 'VP8X header is incomplete');
      return {
        width: readUint24LE(buffer, payloadOffset + 4) + 1,
        height: readUint24LE(buffer, payloadOffset + 7) + 1,
      };
    }

    chunkOffset = payloadEnd + (chunkSize % 2);
  }

  assert.fail('WebP contains no VP8, VP8L, or VP8X canvas header');
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

test('index.html guides users to the reviewed driver downloads', () => {
  const html = stripHtmlComments(read('index.html'));
  const anchors = html.match(/<a\b[^>]*>[^<]*<\/a>/gi) ?? [];

  for (const [url, label] of [
    [releaseUrl, 'GitHub Release 下载'],
    [officialDriverUrl, '沁恒官方驱动页'],
  ]) {
    const anchor = anchors.find((tag) => attributeValue(tag, 'href') === url);
    assert.ok(anchor, `missing reviewed download link: ${url}`);
    assert.match(anchor, new RegExp(`>${label}<\\/a>`, 'i'));
    assert.equal(attributeValue(anchor, 'target'), '_blank');
    assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noopener(?:\s|$)/);
    assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noreferrer(?:\s|$)/);
  }
});

test('index.html includes the reviewed accessibility and navigation polish', () => {
  const html = stripHtmlComments(read('index.html'));
  const openingTags = html.match(/<[\w-]+\b[^>]*>/gi) ?? [];
  const purchaseAnchors = (html.match(/<a\b[^>]*>/gi) ?? []).filter((tag) =>
    hasAttribute(tag, 'data-purchase-link'),
  );
  const tableTag = openingTags.find((tag) => /^<table\b/i.test(tag));

  assert.match(
    html,
    /检查软件更新，并通过 Type-C 完成固件更新/,
    'software copy should accurately separate software and firmware updates',
  );
  assert.ok(
    tableTag && (hasAttribute(tableTag, 'aria-labelledby') || /<caption\b/i.test(html)),
    'the specs table should have an accessible name',
  );
  assert.ok(
    openingTags.some((tag) => attributeValue(tag, 'id') === 'top'),
    'the document should expose a real #top target',
  );
  assert.match(html, /<a\b[^>]*class="brand"[^>]*href="#top"/i);
  assert.match(html, /<a\b[^>]*href="#top"[^>]*>返回顶部<\/a>/i);
  assert.match(html, /<a\b[^>]*class="skip-link"[^>]*href="#main-content"/i);
  assert.equal(purchaseAnchors.length, 3, 'the page should expose exactly three purchase CTAs');
  for (const anchor of purchaseAnchors) {
    assert.equal(attributeValue(anchor, 'target'), '_blank');
    assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noopener(?:\s|$)/);
    assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noreferrer(?:\s|$)/);
  }
});

test('styles.css applies reviewed typography without dead declarations', () => {
  const css = read('styles.css').replace(/\/\*[^]*?\*\//g, '');
  const heroSubtitleBlocks = blocksFollowing(
    css,
    /\.hero__content\s*>\s*p\.hero__subtitle\s*\{/gi,
  );
  const softwareDescriptionBlocks = blocksFollowing(
    css,
    /\.section--software\s+\.section__heading\s*>\s*p:not\(\.eyebrow\)\s*\{/gi,
  );

  assert.ok(
    heroSubtitleBlocks.length > 0,
    'hero subtitle selector should match or exceed the competing paragraph selector specificity',
  );
  assert.ok(
    heroSubtitleBlocks.some((body) => /\bfont-size\s*:/i.test(body) && !/!important/i.test(body)),
    'hero subtitle typography should not require !important',
  );
  assert.ok(
    softwareDescriptionBlocks.some((body) => /\bfont-size\s*:/i.test(body)),
    'software description should receive heading-description typography',
  );
  assert.doesNotMatch(
    css,
    /\.card\s*\{[^}]*\btransition\s*:[^;}]*background-color/si,
    'cards should not transition an unchanged background-color',
  );
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

test('index.html has exactly six accessible, dimensioned images', () => {
  requireFile('index.html');
  const imageTags = stripHtmlComments(read('index.html')).match(/<img\b[^>]*>/gi) ?? [];

  assert.equal(imageTags.length, 6, `expected exactly 6 images, found ${imageTags.length}`);

  for (const [index, tag] of imageTags.entries()) {
    const alt = attributeValue(tag, 'alt');
    const width = attributeValue(tag, 'width');
    const height = attributeValue(tag, 'height');

    assert.ok(alt?.trim(), `image ${index + 1} should have nonempty alt text`);
    assert.match(width ?? '', /^\d+$/, `image ${index + 1} should have a numeric width`);
    assert.match(height ?? '', /^\d+$/, `image ${index + 1} should have a numeric height`);
  }
});

test('image source validation rejects duplicate or missing references', () => {
  assert.equal(
    typeof assertExactImageSources,
    'function',
    'an exact image source validator should exist',
  );
  const expectedSources = [...expectedImageDimensions.keys()];
  const missing = expectedSources.slice(0, -1);
  const duplicateAndMissing = [...missing, expectedSources[0]];

  assert.throws(() => assertExactImageSources(missing));
  assert.throws(() => assertExactImageSources(duplicateAndMissing));
});

test('WebP dimension parsing rejects corrupt or fake image data', () => {
  assert.equal(
    typeof parseWebPDimensions,
    'function',
    'a WebP dimension parser should exist',
  );
  const validImage = readFileSync(fileUrl('assets/images/hero.webp'));
  const corruptMagic = Buffer.from(validImage);
  corruptMagic.write('FAIL', 8, 'ascii');
  const tinyFake = Buffer.from('RIFF\u0004\u0000\u0000\u0000WEBP', 'binary');

  assert.throws(() => parseWebPDimensions(corruptMagic));
  assert.throws(() => parseWebPDimensions(tinyFake));
});

test('WebP dimension parsing supports lossy, lossless, and extended headers', () => {
  function container(chunkType, payload) {
    const buffer = Buffer.alloc(20 + payload.length + (payload.length % 2));
    buffer.write('RIFF', 0, 'ascii');
    buffer.writeUInt32LE(buffer.length - 8, 4);
    buffer.write('WEBP', 8, 'ascii');
    buffer.write(chunkType, 12, 'ascii');
    buffer.writeUInt32LE(payload.length, 16);
    payload.copy(buffer, 20);
    return buffer;
  }

  const lossy = Buffer.alloc(10);
  lossy.set([0x9d, 0x01, 0x2a], 3);
  lossy.writeUInt16LE(1122, 6);
  lossy.writeUInt16LE(1402, 8);

  const lossless = Buffer.alloc(5);
  lossless[0] = 0x2f;
  lossless.writeUInt32LE(((1527 - 1) << 14 | (2082 - 1)) >>> 0, 1);

  const extended = Buffer.alloc(10);
  const extendedWidth = 1311 - 1;
  const extendedHeight = 1062 - 1;
  extended.set([
    extendedWidth & 0xff,
    (extendedWidth >>> 8) & 0xff,
    (extendedWidth >>> 16) & 0xff,
  ], 4);
  extended.set([
    extendedHeight & 0xff,
    (extendedHeight >>> 8) & 0xff,
    (extendedHeight >>> 16) & 0xff,
  ], 7);

  assert.deepEqual(parseWebPDimensions(container('VP8 ', lossy)), { width: 1122, height: 1402 });
  assert.deepEqual(parseWebPDimensions(container('VP8L', lossless)), { width: 2082, height: 1527 });
  assert.deepEqual(parseWebPDimensions(container('VP8X', extended)), { width: 1311, height: 1062 });
});

test('image integrity rejects a dimension-correct header-only replacement', () => {
  const headerOnly = Buffer.alloc(30);
  headerOnly.write('RIFF', 0, 'ascii');
  headerOnly.writeUInt32LE(headerOnly.length - 8, 4);
  headerOnly.write('WEBP', 8, 'ascii');
  headerOnly.write('VP8X', 12, 'ascii');
  headerOnly.writeUInt32LE(10, 16);
  const width = 1122 - 1;
  const height = 1402 - 1;
  headerOnly.set([width & 0xff, (width >>> 8) & 0xff, (width >>> 16) & 0xff], 24);
  headerOnly.set([height & 0xff, (height >>> 8) & 0xff, (height >>> 16) & 0xff], 27);

  assert.equal(headerOnly.length, 30);
  assert.deepEqual(parseWebPDimensions(headerOnly), { width: 1122, height: 1402 });
  assert.equal(
    typeof assertExpectedImageIntegrity,
    'function',
    'an exact image integrity validator should exist',
  );
  assert.throws(
    () => assertExpectedImageIntegrity('assets/images/hero.webp', headerOnly),
    /SHA-256/,
  );
});

test('local images exist and use a modern optimized format', () => {
  const imageTags = stripHtmlComments(read('index.html')).match(/<img\b[^>]*>/gi) ?? [];
  const localSources = imageTags
    .map((tag) => attributeValue(tag, 'src'))
    .filter((src) => src && !/^(?:[a-z]+:)?\/\//i.test(src) && !/^data:/i.test(src));

  assertExactImageSources(localSources);
  for (const [index, src] of localSources.entries()) {
    assert.ok(existsSync(fileUrl(src)), `${src} should exist on disk`);
    assert.match(src, /\.webp(?:[?#].*)?$/i, `${src} should use WebP`);
    const imageData = readFileSync(fileUrl(src));
    assertExpectedImageIntegrity(src, imageData);
    const actualDimensions = parseWebPDimensions(imageData);
    const expectedDimensions = expectedImageDimensions.get(src);
    assert.deepEqual(
      [actualDimensions.width, actualDimensions.height],
      expectedDimensions,
      `${src} should retain its reviewed canvas dimensions`,
    );
    assert.deepEqual(
      [Number(attributeValue(imageTags[index], 'width')), Number(attributeValue(imageTags[index], 'height'))],
      expectedDimensions,
      `${src} HTML dimensions should match its WebP canvas`,
    );
  }

  for (const src of expectedImageDimensions.keys()) {
    const oldPngPath = src.replace(/\.webp$/, '.png');
    assert.equal(existsSync(fileUrl(oldPngPath)), false, `${oldPngPath} should not be deployed`);
  }
});

test('referenced images stay within the page byte budget', () => {
  const imageTags = stripHtmlComments(read('index.html')).match(/<img\b[^>]*>/gi) ?? [];
  const localSources = imageTags
    .map((tag) => attributeValue(tag, 'src'))
    .filter((src) => src && !/^(?:[a-z]+:)?\/\//i.test(src) && !/^data:/i.test(src));
  const totalBytes = localSources.reduce((sum, src) => sum + statSync(fileUrl(src)).size, 0);

  assert.ok(
    totalBytes <= 4 * 1024 * 1024,
    `referenced images total ${totalBytes} bytes; expected at most 4 MiB`,
  );
});

test('the eager hero image stays within its byte budget', () => {
  const imageTags = stripHtmlComments(read('index.html')).match(/<img\b[^>]*>/gi) ?? [];
  const eagerImages = imageTags.filter((tag) => attributeValue(tag, 'loading') === 'eager');

  assert.equal(eagerImages.length, 1, 'expected exactly one eager hero image');
  const heroSrc = attributeValue(eagerImages[0], 'src');
  assert.ok(heroSrc, 'the eager hero image should have a src');
  const heroBytes = statSync(fileUrl(heroSrc)).size;
  assert.ok(
    heroBytes <= 800 * 1024,
    `eager hero is ${heroBytes} bytes; expected at most 800 KiB`,
  );
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

function createVmElement() {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();

  return {
    attributes,
    listeners,
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); },
    },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    addEventListener(type, callback) { listeners.set(type, callback); },
    querySelectorAll() { return []; },
  };
}

function runScriptInVm(context) {
  context.globalThis = context;
  context.window = context;
  context.self = context;
  runInNewContext(read('script.js'), context, { timeout: 1_000 });
}

test('mobile menu toggles, closes, and restores focus after Escape', () => {
  const menuButton = createVmElement();
  const siteNav = createVmElement();
  const navLink = createVmElement();
  const documentListeners = new Map();
  let focusCount = 0;

  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.focus = () => { focusCount += 1; };
  siteNav.querySelectorAll = (selector) => selector === 'a' ? [navLink] : [];

  const document = {
    documentElement: createVmElement(),
    querySelector(selector) {
      if (selector === '[data-menu-button]') return menuButton;
      if (selector === '[data-site-nav]') return siteNav;
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener(type, callback) { documentListeners.set(type, callback); },
  };

  runScriptInVm({ document, matchMedia: () => ({ matches: true }) });

  assert.ok(
    document.documentElement.classList.contains('menu-enhanced'),
    'successful menu initialization should enable the collapsed-menu CSS',
  );

  menuButton.listeners.get('click')();
  assert.equal(menuButton.getAttribute('aria-expanded'), 'true');
  assert.ok(siteNav.attributes.has('data-open'));

  navLink.listeners.get('click')();
  assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
  assert.ok(!siteNav.attributes.has('data-open'));

  menuButton.listeners.get('click')();
  documentListeners.get('keydown')({ key: 'Escape' });
  assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
  assert.ok(!siteNav.attributes.has('data-open'));
  assert.equal(focusCount, 1, 'Escape should restore focus when closing an open menu');

  documentListeners.get('keydown')({ key: 'Escape' });
  assert.equal(focusCount, 1, 'Escape should not move focus when the menu is already closed');
});

test('mobile menu progressively enhances when hooks are missing', () => {
  for (const availableHook of ['neither', 'button-only', 'nav-only']) {
    const root = createVmElement();
    const menuButton = availableHook === 'button-only' ? createVmElement() : null;
    const siteNav = availableHook === 'nav-only' ? createVmElement() : null;
    const document = {
      documentElement: root,
      querySelector(selector) {
        if (selector === '[data-menu-button]') return menuButton;
        if (selector === '[data-site-nav]') return siteNav;
        return null;
      },
      querySelectorAll() { return []; },
      addEventListener() {},
    };

    assert.doesNotThrow(() => {
      runScriptInVm({ document, matchMedia: () => ({ matches: true }) });
    });
    assert.equal(
      root.classList.contains('menu-enhanced'),
      false,
      `${availableHook} should keep the no-JavaScript navigation CSS active`,
    );
  }
});

test('mobile menu enhancement stays disabled when listener hooks are missing', () => {
  for (const missingListener of ['menu button', 'document']) {
    const root = createVmElement();
    const menuButton = createVmElement();
    const siteNav = createVmElement();
    const document = {
      documentElement: root,
      querySelector(selector) {
        if (selector === '[data-menu-button]') return menuButton;
        if (selector === '[data-site-nav]') return siteNav;
        return null;
      },
      querySelectorAll() { return []; },
      addEventListener() {},
    };

    if (missingListener === 'menu button') delete menuButton.addEventListener;
    if (missingListener === 'document') delete document.addEventListener;

    assert.doesNotThrow(() => {
      runScriptInVm({ document, matchMedia: () => ({ matches: true }) });
    });
    assert.equal(
      root.classList.contains('menu-enhanced'),
      false,
      `missing ${missingListener} listener API should keep the no-JavaScript navigation CSS active`,
    );
  }
});

test('mobile CSS keeps navigation usable until menu enhancement initializes', () => {
  const css = read('styles.css').replace(/\/\*[^]*?\*\//g, '');
  const baseMenuButtonBlocks = blocksFollowing(
    css,
    /(?:^|\})\s*\.menu-button\s*\{/gi,
  );
  const mobileBlocks = blocksFollowing(
    css,
    /@media\b[^{}]*\(\s*max-width\s*:\s*900px\s*\)[^{}]*\{/gi,
  );

  assert.equal(baseMenuButtonBlocks.length, 1, 'expected one base .menu-button rule');
  assert.match(
    baseMenuButtonBlocks[0],
    /\bdisplay\s*:\s*none\b/i,
    'the no-JavaScript default must hide the inert menu button',
  );
  assert.equal(mobileBlocks.length, 1, 'expected one 900px mobile breakpoint');

  const rules = [...mobileBlocks[0].matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selector, body]) => ({ selector: selector.trim(), body }),
  );
  const hasMenuEnhancedClass = (selector) =>
    /\.menu-enhanced(?=$|[\s>+~.#:\[\],{])/.test(selector);
  const defaultMenuRules = rules.filter(({ selector }) =>
    /\.menu-button\b/.test(selector) && !hasMenuEnhancedClass(selector),
  );
  const defaultNavRules = rules.filter(({ selector }) =>
    (/\.site-nav\b/.test(selector) || /\[data-site-nav\]/.test(selector))
      && !hasMenuEnhancedClass(selector),
  );
  const enhancedMenuRules = rules.filter(({ selector }) =>
    hasMenuEnhancedClass(selector) && /\.menu-button\b/.test(selector),
  );
  const enhancedNavRules = rules.filter(({ selector }) =>
    hasMenuEnhancedClass(selector)
      && (/\.site-nav\b/.test(selector) || /\[data-site-nav\]/.test(selector)),
  );

  assert.ok(
    defaultMenuRules.every(({ body }) => !/\bdisplay\s*:\s*(?:inline-)?flex\b/i.test(body)),
    'the no-JavaScript mobile default must not expose an inert menu button',
  );
  assert.ok(
    defaultNavRules.some(({ body }) =>
      /\bdisplay\s*:\s*flex\b/i.test(body) && /\bposition\s*:\s*static\b/i.test(body),
    ),
    'the no-JavaScript mobile default should keep section navigation in the header flow',
  );
  assert.ok(
    defaultNavRules.every(({ body }) => !/\bdisplay\s*:\s*none\b/i.test(body)),
    'the no-JavaScript mobile default must not hide section navigation',
  );
  assert.ok(
    enhancedMenuRules.some(({ body }) => /\bdisplay\s*:\s*inline-flex\b/i.test(body)),
    'menu enhancement should expose the menu button at mobile widths',
  );
  assert.ok(
    enhancedNavRules.some(({ body }) => /\bdisplay\s*:\s*none\b/i.test(body)),
    'menu enhancement should collapse mobile navigation by default',
  );
  assert.ok(
    enhancedNavRules.some(({ selector, body }) =>
      /\[data-site-nav\]\[data-open\]/.test(selector) && /\bdisplay\s*:\s*flex\b/i.test(body),
    ),
    'an enhanced open menu should reveal section navigation',
  );
});

test('reveal enhancement stays disabled for reduced motion or missing observer support', () => {
  for (const contextOverrides of [
    { matchMedia: () => ({ matches: true }), IntersectionObserver: class {} },
    { matchMedia: () => ({ matches: false }) },
  ]) {
    const root = createVmElement();
    const reveal = createVmElement();
    let observerCount = 0;
    const Observer = contextOverrides.IntersectionObserver;
    if (Observer) {
      contextOverrides.IntersectionObserver = class extends Observer {
        constructor(...args) {
          super(...args);
          observerCount += 1;
        }
      };
    }
    const document = {
      documentElement: root,
      querySelector() { return null; },
      querySelectorAll(selector) { return selector === '[data-reveal]' ? [reveal] : []; },
    };

    runScriptInVm({ document, ...contextOverrides });

    assert.equal(root.classList.contains('js'), false);
    assert.equal(observerCount, 0);
  }
});

test('reveal enhancement observes and reveals intersecting elements', () => {
  const root = createVmElement();
  const reveals = [createVmElement(), createVmElement()];
  const observed = [];
  const unobserved = [];
  let observerCallback;

  class IntersectionObserver {
    constructor(callback) { observerCallback = callback; }
    observe(element) { observed.push(element); }
    unobserve(element) { unobserved.push(element); }
  }
  const document = {
    documentElement: root,
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === '[data-reveal]' ? reveals : []; },
  };

  runScriptInVm({
    document,
    matchMedia: () => ({ matches: false }),
    IntersectionObserver,
  });

  assert.ok(root.classList.contains('js'));
  assert.deepEqual(observed, reveals);

  observerCallback([
    { isIntersecting: false, target: reveals[0] },
    { isIntersecting: true, target: reveals[1] },
  ], { unobserve(element) { unobserved.push(element); } });

  assert.equal(reveals[0].classList.contains('is-visible'), false);
  assert.ok(reveals[1].classList.contains('is-visible'));
  assert.deepEqual(unobserved, [reveals[1]]);
});

test('reveal enhancement leaves content visible if observer registration fails', () => {
  const root = createVmElement();
  const reveal = createVmElement();
  class IntersectionObserver {
    observe() { throw new Error('observer registration failed'); }
  }
  const document = {
    documentElement: root,
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === '[data-reveal]' ? [reveal] : []; },
  };

  assert.doesNotThrow(() => {
    runScriptInVm({
      document,
      matchMedia: () => ({ matches: false }),
      IntersectionObserver,
    });
  });
  assert.equal(root.classList.contains('js'), false);
});
