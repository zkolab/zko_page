import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const purchaseUrl = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';
const downloadUrl = 'https://github.com/Lijinzh/Communist-Manifesto-Releases';
const giteeReleaseUrl = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';
const feedbackUrl = 'https://docs.qq.com/sheet/DQUFjTktqTmF0d1FG?tab=BB08J2';
const djiMicUrl = 'https://www.dji.com/cn/mic';
const djiMic2Url = 'https://www.dji.com/cn/mic-2';
const officialDriverUrl = 'https://www.wch.cn/downloads/CH343SER_EXE.html';
const pageFiles = ['index.html', 'shop.html', 'guide.html'];
const requiredProductImages = [
  'assets/images/product-hero.webp',
  'assets/images/product-macros.webp',
  'assets/images/product-status.webp',
  'assets/images/product-workflow.webp',
  'assets/images/product-ports.webp',
  'assets/images/software-main.webp',
  'assets/images/software-settings.webp',
  'assets/images/guide-hardware.jpg',
];
const replacementImages = new Map([
  ['assets/images/software-main.webp', { width: '1180', height: '620', bytes: 58_292 }],
  ['assets/images/software-settings.webp', { width: '1442', height: '852', bytes: 110_614 }],
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function attributeValue(tag, name) {
  const match = tag.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match
    ? (match[1] ?? match[2] ?? match[3])
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
    : undefined;
}

function hasAttribute(tag, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s*=|(?=\\s|/?>))`, 'i').test(tag);
}

function stripHtmlComments(html) {
  return html.replace(/<!--[^]*?-->/g, '');
}

function openingTags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? [];
}

test('required public files exist', () => {
  for (const path of [...pageFiles, 'styles.css', 'script.js', 'README.md']) requireFile(path);
});

test('all pages expose the shared navigation and reviewed destinations', () => {
  const sharedLinks = [
    ['产品', 'index.html'],
    ['商城', 'shop.html'],
    ['使用说明', 'guide.html'],
  ];

  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    const anchors = openingTags(html, 'a');

    for (const [label, href] of sharedLinks) {
      assert.match(
        html,
        new RegExp(`<a\\b[^>]*href=["']${escapeRegExp(href)}["'][^>]*>${label}<\\/a>`, 'i'),
        `${page} should link ${label} to ${href}`,
      );
    }

    const purchaseAnchors = anchors.filter((tag) => hasAttribute(tag, 'data-purchase-link'));
    assert.ok(purchaseAnchors.length >= 1, `${page} should expose a purchase CTA`);
    for (const anchor of purchaseAnchors) {
      assert.equal(attributeValue(anchor, 'href'), purchaseUrl);
    }
  }
});

test('all pages expose equal-priority Gitee and GitHub release links', () => {
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    assert.match(html, new RegExp(escapeRegExp(giteeReleaseUrl)), `${page} should link Gitee`);
    assert.match(html, new RegExp(escapeRegExp(downloadUrl)), `${page} should link GitHub`);
  }

  const home = stripHtmlComments(read('index.html'));
  assert.match(home, /id=["']release-downloads["']/);
  const releaseButtons = openingTags(home, 'a').filter((tag) =>
    /(?:^|\s)release-button(?:\s|$)/.test(attributeValue(tag, 'class') ?? ''),
  );
  assert.equal(releaseButtons.length, 2, 'homepage should expose two equal release buttons');
  assert.deepEqual(
    new Set(releaseButtons.map((tag) => attributeValue(tag, 'href'))),
    new Set([giteeReleaseUrl, downloadUrl]),
  );
});

test('external links use safe new-window attributes', () => {
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    const externalAnchors = openingTags(html, 'a').filter((tag) =>
      /^https:\/\//.test(attributeValue(tag, 'href') ?? ''),
    );
    assert.ok(externalAnchors.length > 0, `${page} should expose external links`);

    for (const anchor of externalAnchors) {
      assert.equal(attributeValue(anchor, 'target'), '_blank');
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noopener(?:\s|$)/);
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noreferrer(?:\s|$)/);
    }
  }
});

test('pages have unique titles, main landmarks, and skip links', () => {
  const titles = [];
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    assert.ok(title, `${page} should have a title`);
    titles.push(title);
    assert.match(html, /<main\b[^>]*id="main-content"/i);
    assert.match(html, /<a\b[^>]*class="skip-link"[^>]*href="#main-content"/i);
    assert.match(html, /<footer\b[^>]*class="site-footer"/i);
  }
  assert.equal(new Set(titles).size, pageFiles.length, 'page titles should be unique');
});

test('homepage presents flagship product storytelling', () => {
  const html = stripHtmlComments(read('index.html'));
  for (const id of ['overview', 'macros', 'status', 'software', 'compatibility', 'support']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `homepage should expose #${id}`);
  }
  assert.match(html, /把 AI 工作流握在手里/);
  assert.match(html, /4 枚实体宏键/);
  assert.match(html, /Agent 状态/);
  assert.match(html, /大疆麦克风仅作为适配与使用场景展示，不包含在包装内/);
  assert.match(html, /product-hero\.webp/);
  assert.match(html, /product-macros\.webp/);
  assert.match(html, /product-status\.webp/);
});

test('shop presents preorder colors and reviewed microphone compatibility', () => {
  const html = stripHtmlComments(read('shop.html'));
  for (const color of ['灰色', '红色', '白色', '黑色', '紫色', '其他自选颜色']) {
    assert.match(html, new RegExp(color), `shop should mention ${color}`);
  }
  assert.match(html, /灰色为默认交付颜色/);
  assert.match(html, /仅支持提前预订/);
  assert.match(html, /价格与库存以闲鱼商品页为准/);
  assert.match(html, new RegExp(escapeRegExp(djiMicUrl)));
  assert.match(html, new RegExp(escapeRegExp(djiMic2Url)));
  assert.match(html, /其他型号可按型号确认或定制适配件/);
  assert.match(html, /麦克风不包含在包装内/);

  const colorButtons = openingTags(html, 'button').filter((tag) => hasAttribute(tag, 'data-color-option'));
  assert.equal(colorButtons.length, 6, 'shop should expose six color choices');
  assert.equal(
    colorButtons.filter((tag) => attributeValue(tag, 'aria-pressed') === 'true').length,
    1,
    'exactly one color should be selected by default',
  );
  assert.ok(
    colorButtons.some((tag) =>
      attributeValue(tag, 'data-color-option') === '灰色'
        && attributeValue(tag, 'aria-pressed') === 'true'),
    'gray should be the default color',
  );
});

test('shop links the Tencent Docs feedback area without claiming direct submission', () => {
  const html = stripHtmlComments(read('shop.html'));
  assert.match(html, /告诉我们你想要的搭配/);
  assert.match(html, new RegExp(escapeRegExp(feedbackUrl)));
  assert.match(html, /实际编辑与保存能力由腾讯文档权限控制/);
  assert.doesNotMatch(html, /提交成功|已保存到腾讯文档/);
});

test('guide covers first use, Bluetooth hosts, controls, and troubleshooting', () => {
  const html = stripHtmlComments(read('guide.html'));
  for (const phrase of [
    '5 分钟完成首次使用',
    'CommunistKB-XXXX',
    'BLE Hosts',
    '3 个主机槽位',
    'PAIR',
    'LINK',
    'WAIT',
    'CH343',
    'Right Alt',
    'Ctrl+V',
  ]) {
    assert.match(html, new RegExp(escapeRegExp(phrase)), `guide should mention ${phrase}`);
  }
  for (const id of ['quick-start', 'hardware', 'bluetooth', 'multi-host', 'controls', 'software', 'troubleshooting']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `guide should expose #${id}`);
  }
  assert.match(html, new RegExp(escapeRegExp(officialDriverUrl)));
});

test('authorized product and guide images are local and web optimized', () => {
  for (const path of requiredProductImages) {
    requireFile(path);
    const bytes = statSync(fileUrl(path)).size;
    assert.ok(bytes > 1_000, `${path} should contain real image data`);
    assert.ok(bytes <= 900 * 1024, `${path} is ${bytes} bytes; expected at most 900 KiB`);
  }
});

test('numbered software screenshots use the approved files and dimensions', () => {
  const pageHtml = pageFiles.map((page) => stripHtmlComments(read(page))).join('\n');

  for (const [src, expected] of replacementImages) {
    assert.equal(statSync(fileUrl(src)).size, expected.bytes, `${src} should match the approved file`);
    const imageTags = openingTags(pageHtml, 'img').filter((tag) => attributeValue(tag, 'src') === src);
    assert.ok(imageTags.length >= 1, `${src} should be used on a public page`);
    for (const tag of imageTags) {
      assert.equal(attributeValue(tag, 'width'), expected.width);
      assert.equal(attributeValue(tag, 'height'), expected.height);
    }
  }
});

test('all page images are local, accessible, dimensioned, and present', () => {
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    const images = openingTags(html, 'img');
    assert.ok(images.length >= 2, `${page} should contain product or guide imagery`);

    for (const image of images) {
      const src = attributeValue(image, 'src');
      const alt = attributeValue(image, 'alt');
      const width = attributeValue(image, 'width');
      const height = attributeValue(image, 'height');
      assert.ok(src && !/^https?:\/\//i.test(src), `${page} image should be local: ${src}`);
      assert.ok(alt?.trim(), `${page} image should have useful alt text`);
      assert.match(width ?? '', /^\d+$/, `${src} should declare numeric width`);
      assert.match(height ?? '', /^\d+$/, `${src} should declare numeric height`);
      requireFile(src);
    }
  }
});

test('pages do not copy DJI-hosted media or brand assets', () => {
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    for (const image of openingTags(html, 'img')) {
      assert.doesNotMatch(attributeValue(image, 'src') ?? '', /dji\.com|djicdn\.com|dji-logo/i);
    }
  }
});

test('styles define flagship layouts, responsive behavior, focus, and reduced motion', () => {
  const css = read('styles.css').replace(/\/\*[^]*?\*\//g, '');
  for (const selector of ['.global-header', '.hero', '.story-panel', '.product-gallery', '.guide-layout', '.site-footer']) {
    assert.match(css, new RegExp(escapeRegExp(selector)));
  }
  assert.match(css, /@media\b[^{}]*\(\s*max-width\s*:/i);
  assert.match(css, /@media\b[^{}]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  assert.match(css, /:focus-visible[^{}]*\{[^}]*\b(?:outline|box-shadow)\s*:/i);
});

test('script defines reviewed URLs and applies the purchase destination', () => {
  const script = read('script.js');
  assert.match(
    script,
    new RegExp(`\\bconst\\s+PURCHASE_URL\\s*=\\s*["']${escapeRegExp(purchaseUrl)}["']`),
  );
  assert.match(
    script,
    new RegExp(`\\bconst\\s+DOWNLOAD_URL\\s*=\\s*["']${escapeRegExp(downloadUrl)}["']`),
  );
  assert.match(
    script,
    new RegExp(`\\bconst\\s+GITEE_RELEASE_URL\\s*=\\s*["']${escapeRegExp(giteeReleaseUrl)}["']`),
  );

  const purchaseLinks = [{ href: 'old://one' }, { href: 'old://two' }];
  const downloadLinks = [{ href: 'old://download' }];
  const giteeLinks = [{ href: 'old://gitee' }];
  const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  const document = {
    documentElement: { classList },
    querySelectorAll(selector) {
      if (selector === '[data-purchase-link]') return purchaseLinks;
      if (selector === '[data-download-link]') return downloadLinks;
      if (selector === '[data-gitee-release-link]') return giteeLinks;
      return [];
    },
    querySelector() { return null; },
    addEventListener() {},
  };
  const context = {
    document,
    matchMedia() { return { matches: true }; },
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); return 1; },
    IntersectionObserver: undefined,
    console,
  };
  context.window = context;
  context.globalThis = context;
  runInNewContext(`${script}\n;globalThis.__urls = { PURCHASE_URL, DOWNLOAD_URL, GITEE_RELEASE_URL };`, context);

  assert.equal(context.__urls.PURCHASE_URL, purchaseUrl);
  assert.equal(context.__urls.DOWNLOAD_URL, downloadUrl);
  assert.equal(context.__urls.GITEE_RELEASE_URL, giteeReleaseUrl);
  assert.deepEqual(purchaseLinks.map((link) => link.href), [purchaseUrl, purchaseUrl]);
  assert.deepEqual(downloadLinks.map((link) => link.href), [downloadUrl]);
  assert.deepEqual(giteeLinks.map((link) => link.href), [giteeReleaseUrl]);
});

test('script color selector updates pressed state and selected label', () => {
  const listeners = new Map();
  const gray = {
    dataset: { colorOption: '灰色' },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(type, callback) { listeners.set(`gray:${type}`, callback); },
  };
  const red = {
    dataset: { colorOption: '红色' },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(type, callback) { listeners.set(`red:${type}`, callback); },
  };
  const selectedColor = { textContent: '灰色' };
  const classList = { add() {}, remove() {}, contains() { return false; } };
  const document = {
    documentElement: { classList },
    querySelectorAll(selector) { return selector === '[data-color-option]' ? [gray, red] : []; },
    querySelector(selector) { return selector === '[data-selected-color]' ? selectedColor : null; },
    addEventListener() {},
  };
  const context = {
    document,
    matchMedia() { return { matches: true }; },
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); return 1; },
    IntersectionObserver: undefined,
    console,
  };
  context.window = context;
  context.globalThis = context;
  runInNewContext(read('script.js'), context);
  listeners.get('red:click')();

  assert.equal(gray['aria-pressed'], 'false');
  assert.equal(red['aria-pressed'], 'true');
  assert.equal(selectedColor.textContent, '红色');
});
