# ZKO Flagship Commerce and Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-page site with a polished three-page brand site containing a flagship homepage, a single-product commerce page, and a README-based usage guide.

**Architecture:** Keep the project build-free and static. `index.html`, `shop.html`, and `guide.html` share `styles.css` and `script.js`; all production images are local under `assets/images/`, while purchase and download actions link to the authorized external destinations.

**Tech Stack:** Semantic HTML5, modern responsive CSS, vanilla JavaScript, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Define the three-page contract with failing tests

**Files:**
- Modify: `tests/site.test.mjs`
- Create later: `shop.html`
- Create later: `guide.html`

- [ ] **Step 1: Replace single-page constants with reviewed site contracts**

```js
const purchaseUrl = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';
const downloadUrl = 'https://github.com/Lijinzh/Communist-Manifesto-Releases';
const pages = ['index.html', 'shop.html', 'guide.html'];
const sharedNavigation = [
  ['产品', 'index.html'],
  ['商城', 'shop.html'],
  ['使用说明', 'guide.html'],
  ['下载', downloadUrl],
];
```

- [ ] **Step 2: Add failing tests for files, navigation, and link safety**

```js
test('all three public pages exist and expose the shared navigation', () => {
  for (const page of pages) {
    requireFile(page);
    const html = stripHtmlComments(read(page));
    for (const [label, href] of sharedNavigation) {
      assert.match(html, new RegExp(`<a\\b[^>]*href=["']${escapeRegExp(href)}["'][^>]*>${label}<\\/a>`, 'i'));
    }
    assert.match(html, new RegExp(escapeRegExp(purchaseUrl)));
  }
});

test('external links open safely', () => {
  for (const page of pages) {
    const html = stripHtmlComments(read(page));
    const externalAnchors = (html.match(/<a\\b[^>]*>/gi) ?? []).filter((tag) => /^https:\/\//.test(attributeValue(tag, 'href') ?? ''));
    for (const anchor of externalAnchors) {
      assert.equal(attributeValue(anchor, 'target'), '_blank');
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\\s)noopener(?:\\s|$)/);
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\\s)noreferrer(?:\\s|$)/);
    }
  }
});
```

- [ ] **Step 3: Run the test and verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `shop.html` and `guide.html` do not exist and the purchase URL is still the previous link.

### Task 2: Localize and optimize authorized assets

**Files:**
- Create: `assets/images/product-hero.webp`
- Create: `assets/images/product-macros.webp`
- Create: `assets/images/product-status.webp`
- Create: `assets/images/product-workflow.webp`
- Create: `assets/images/product-ports.webp`
- Create: `assets/images/software-main.webp`
- Create: `assets/images/software-settings.webp`
- Create: `assets/images/guide-hardware.jpg`
- Create or refresh: README-owned assets under `assets/images/`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add failing asset tests**

```js
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

test('authorized product and guide images are local and web optimized', () => {
  for (const path of requiredProductImages) {
    requireFile(path);
    assert.ok(statSync(fileUrl(path)).size <= 900 * 1024, `${path} exceeds 900 KiB`);
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL listing the missing optimized image files.

- [ ] **Step 3: Convert the local PNG sources**

Use Pillow with `ImageOps.exif_transpose`, `thumbnail`, and WebP quality 84 to map:

```text
13.png -> product-hero.webp
12.png -> product-macros.webp
14.png -> product-status.webp
15.png -> product-workflow.webp
20.png -> product-ports.webp
4.png  -> software-main.webp
5.png  -> software-settings.webp
```

Preserve aspect ratios and cap the longest edge at 1800 pixels.

- [ ] **Step 4: Download README-owned images using direct network first**

Download from `https://raw.githubusercontent.com/Lijinzh/Communist-Manifesto-Releases/main/docs/assets/user-guide/`, falling back to proxy `127.0.0.1:7897` only if direct access fails. Store `usb-type-c-interface.jpg` as `guide-hardware.jpg`; refresh the existing guide images with the repository versions.

- [ ] **Step 5: Run the test and verify GREEN**

Run: `node --test tests/site.test.mjs`

Expected: the asset test passes; remaining page tests may still fail until Tasks 3-5.

### Task 3: Build the shared navigation, footer, and flagship homepage

**Files:**
- Replace: `index.html`
- Replace: `styles.css`
- Replace: `script.js`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add failing homepage structure tests**

```js
test('homepage exposes flagship product storytelling', () => {
  const html = stripHtmlComments(read('index.html'));
  for (const id of ['overview', 'macros', 'status', 'software', 'compatibility', 'support']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /把 AI 工作流握在手里/);
  assert.match(html, /大疆麦克风仅作为适配与使用场景展示，不包含在包装内/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because the new flagship sections and copy are absent.

- [ ] **Step 3: Replace `index.html`**

Create a semantic page with:

```html
<header class="global-header" data-header>
  <a class="brand" href="index.html" aria-label="苍虬首页"><span>ZKO</span><small>苍虬 · AI 编程手柄</small></a>
  <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="global-nav">菜单</button>
  <nav class="global-nav" id="global-nav" data-global-nav aria-label="主要导航">
    <a href="index.html" aria-current="page">产品</a>
    <a href="shop.html">商城</a>
    <a href="guide.html">使用说明</a>
    <a href="https://github.com/Lijinzh/Communist-Manifesto-Releases" target="_blank" rel="noopener noreferrer">下载</a>
  </nav>
  <a class="button button--buy" data-purchase-link href="PURCHASE_URL" target="_blank" rel="noopener noreferrer">立即购买</a>
</header>
```

Follow it with alternating light/dark full-width sections using `product-hero.webp`, `product-macros.webp`, `product-status.webp`, `product-workflow.webp`, and software screenshots. End with the shared multi-column footer.

- [ ] **Step 4: Replace `styles.css` with shared design tokens and layouts**

Define black/white/gray surfaces, cyan and orange accents, 72px desktop header, full-bleed chapters, responsive grids, sticky product navigation, visible focus styles, and reduced-motion rules.

- [ ] **Step 5: Replace `script.js` with shared enhancement logic**

```js
const PURCHASE_URL = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';

for (const link of document.querySelectorAll('[data-purchase-link]')) link.href = PURCHASE_URL;
```

Add progressive mobile-menu behavior, scroll header state, reveal observation, and safe failure fallbacks.

- [ ] **Step 6: Run the test and verify the homepage tests pass**

Run: `node --test tests/site.test.mjs`

Expected: homepage, shared navigation, and external-link tests pass.

### Task 4: Build the single-product shop and color selector

**Files:**
- Create: `shop.html`
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add failing shop tests**

```js
test('shop presents preorder colors and reviewed microphone compatibility', () => {
  const html = stripHtmlComments(read('shop.html'));
  for (const color of ['灰色', '红色', '白色', '黑色', '紫色']) assert.match(html, new RegExp(color));
  assert.match(html, /默认灰色/);
  assert.match(html, /价格与库存以闲鱼商品页为准/);
  assert.match(html, /https:\/\/www\.dji\.com\/cn\/mic(?:["'])/);
  assert.match(html, /https:\/\/www\.dji\.com\/cn\/mic-2(?:["'])/);
  assert.match(html, /其他型号可按型号确认或定制适配件/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `shop.html` does not exist.

- [ ] **Step 3: Create `shop.html`**

Build a DJI-inspired single-product page with a sticky product subnav, hero, gallery, product highlights, accessible color swatches, microphone compatibility cards, package contents, preorder notice, and repeated purchase CTAs.

```html
<button class="color-swatch is-selected" type="button" data-color-option="灰色" aria-pressed="true"><span class="swatch swatch--gray"></span>灰色</button>
```

- [ ] **Step 4: Add color-selector behavior**

```js
const colorOptions = [...document.querySelectorAll('[data-color-option]')];
const selectedColor = document.querySelector('[data-selected-color]');
for (const option of colorOptions) {
  option.addEventListener('click', () => {
    for (const item of colorOptions) item.setAttribute('aria-pressed', String(item === option));
    selectedColor.textContent = option.dataset.colorOption;
  });
}
```

- [ ] **Step 5: Run the test and verify GREEN**

Run: `node --test tests/site.test.mjs`

Expected: shop structure and color-selector tests pass.

### Task 5: Build the README-based usage guide

**Files:**
- Create: `guide.html`
- Modify: `styles.css`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add failing guide tests**

```js
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
  ]) assert.match(html, new RegExp(escapeRegExp(phrase)));
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `guide.html` does not exist.

- [ ] **Step 3: Create `guide.html`**

Create a reading-focused layout with a desktop sticky table of contents and mobile inline contents. Include the exact README-backed pairing, multi-host, wheel/button, AutoClipboard, driver, and troubleshooting instructions, plus links to the repository and full documentation.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/site.test.mjs`

Expected: guide content tests pass.

### Task 6: Harden responsive behavior, image integrity, and accessibility

**Files:**
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add failing cross-page quality tests**

Test that each local `<img>` has non-empty alt text, width and height attributes, local paths, and existing files; reject `dji.com` image sources and remote media assets. Test responsive media queries, visible `:focus-visible`, `prefers-reduced-motion`, unique page titles, and menu enhancement fallback.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL on any missing dimensions, styles, or accessibility hooks.

- [ ] **Step 3: Complete responsive and accessibility implementation**

Add required attributes and CSS. Keep content visible without JavaScript; enable collapsed navigation and reveal transitions only after successful script initialization.

- [ ] **Step 4: Run the full test suite and verify GREEN**

Run: `node --test tests/site.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 5: Commit implementation**

```bash
git add index.html shop.html guide.html styles.css script.js tests/site.test.mjs assets/images docs/superpowers/plans/2026-07-25-zko-flagship-commerce-guide.md
git diff --cached --check
git commit -m "feat: launch flagship shop and guide"
```

### Task 7: Visual verification, push, and Pages deployment

**Files:**
- Push the committed three-page site.

- [ ] **Step 1: Start a local static server**

Serve the repository on localhost and inspect `index.html`, `shop.html`, and `guide.html` at desktop and 390px mobile widths.

- [ ] **Step 2: Verify interactions**

Confirm desktop and mobile navigation, Escape focus restoration, color selection, purchase buttons, download buttons, table of contents, and reduced-motion fallback.

- [ ] **Step 3: Push `main`**

Run: `git push origin main`

Expected: remote `main` advances to the implementation commit.

- [ ] **Step 4: Monitor GitHub Pages**

Wait for the `pages build and deployment` workflow for the pushed SHA to complete successfully.

- [ ] **Step 5: Verify production**

Fetch:

```text
https://shenqiqishi.github.io/zko_page/
https://shenqiqishi.github.io/zko_page/shop.html
https://shenqiqishi.github.io/zko_page/guide.html
```

Confirm successful responses, the exact purchase and repository links, local images, color preorder copy, Bluetooth instructions, and cross-page navigation.
