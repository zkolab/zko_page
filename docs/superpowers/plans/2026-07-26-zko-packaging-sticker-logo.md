# ZKO Packaging Sticker and Website Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a print-ready 75 × 45 mm ZKO packaging sticker as editable SVG and 2400 × 1440 PNG, provide an exact GPT Image 2 background-generation command, and replace the three public website header wordmarks with the supplied vector Logo.

**Architecture:** GPT Image 2 is limited to an optional decorative background because exact Chinese text, the supplied vector Logo, and a scannable QR code must remain deterministic. A small Node build script combines the original SVG Logo, verified homepage QR SVG, approved copy, and black/cyan background into a self-contained sticker SVG, then renders it to PNG with the bundled `sharp` runtime. Existing static HTML pages reference the original vector Logo directly.

**Tech Stack:** Static HTML/CSS, Node.js test runner, Node.js build script, `sharp`, SVG, PNG, QR Server API for deterministic QR SVG acquisition, bundled GPT Image CLI (`gpt-image-2`).

---

## File Structure

- Create `tests/sticker.test.mjs`: validates the prompt/command, exact sticker copy, SVG dimensions, PNG dimensions, and QR source URL metadata.
- Create `tools/build-packaging-sticker.cjs`: composes the approved sticker from deterministic inputs and renders SVG to PNG.
- Create `assets/packaging/zko-homepage-qr.svg`: real QR code encoding the public homepage URL.
- Create `assets/packaging/zko-packaging-sticker.svg`: editable 5:3 print artwork.
- Create `assets/packaging/zko-packaging-sticker.png`: 2400 × 1440 delivery image.
- Create `output/imagegen/zko-packaging-background-prompt.txt`: structured GPT Image 2 prompt for the decorative background only.
- Create `output/imagegen/zko-packaging-background-command.ps1`: directly runnable PowerShell CLI command.
- Modify `index.html`, `shop.html`, `guide.html`: replace header wordmark text with the original vector Logo image.
- Modify `styles.css`: size the new header Logo across desktop and mobile layouts.
- Modify `tests/site.test.mjs`: assert all public pages use the supplied SVG Logo and no longer use `.brand__mark`.

### Task 1: Add Failing Sticker and Website Logo Tests

**Files:**
- Create: `tests/sticker.test.mjs`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Write the failing sticker artifact tests**

Create `tests/sticker.test.mjs` with tests that:

```js
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
```

- [ ] **Step 2: Extend the website test for the SVG Logo**

Add a test to `tests/site.test.mjs`:

```js
test('all public page headers use the supplied vector ZKO logo', () => {
  for (const file of ['index.html', 'shop.html', 'guide.html']) {
    const html = read(file);
    assert.match(html, /class="brand__logo"/);
    assert.match(html, /src="ZKO_logo_vector\.svg"/);
    assert.doesNotMatch(html, /class="brand__mark"/);
  }
});
```

- [ ] **Step 3: Run the tests and verify they fail for missing artifacts and old wordmarks**

Run:

```powershell
node --test tests/sticker.test.mjs tests/site.test.mjs
```

Expected: FAIL because the packaging artifacts do not exist and the HTML still contains `.brand__mark`.

- [ ] **Step 4: Commit the failing tests**

```powershell
git add tests/sticker.test.mjs tests/site.test.mjs
git commit -m "test: define packaging sticker and logo requirements"
```

### Task 2: Create the Image 2 Command, QR Asset, and Sticker Builder

**Files:**
- Create: `output/imagegen/zko-packaging-background-prompt.txt`
- Create: `output/imagegen/zko-packaging-background-command.ps1`
- Create: `assets/packaging/zko-homepage-qr.svg`
- Create: `tools/build-packaging-sticker.cjs`

- [ ] **Step 1: Write the structured GPT Image 2 background prompt**

Create `output/imagegen/zko-packaging-background-prompt.txt` containing:

```text
Use case: ads-marketing
Asset type: decorative background plate for a 75 × 45 mm horizontal packaging sticker
Primary request: create a restrained premium black and deep-gray technology background for the ZKO AI coding handle packaging label
Scene/backdrop: smooth matte black-to-charcoal gradient with subtle cyan edge glow and one faint technical circular arc near the lower-right edge
Style/medium: premium consumer-electronics packaging graphic, clean studio-polished finish
Composition/framing: exact 5:3 horizontal composition; keep the left 64% calm and readable for a large logo and Chinese copy; keep the right 36% calm for a QR code; avoid a conspicuous empty gutter between the two zones
Lighting/mood: controlled cyan glow, sophisticated, precise, understated
Color palette: near-black, graphite gray, restrained cyan accents
Materials/textures: subtle matte microtexture only; no visible product rendering
Constraints: no text; no letters; no logo; no QR code; no barcode; no watermark; no mockup box; no device; no people; no extra objects; no pseudo-writing; keep strong contrast behind future white typography
Avoid: neon overload, cyberpunk clutter, busy circuit boards, lens flare, orange accents, hard center divider
```

- [ ] **Step 2: Write the exact PowerShell GPT Image 2 command**

Create `output/imagegen/zko-packaging-background-command.ps1`:

```powershell
$ImageGen = Join-Path $env:CODEX_HOME 'skills/.system/imagegen/scripts/image_gen.py'
python $ImageGen generate `
  --model gpt-image-2 `
  --prompt-file 'output/imagegen/zko-packaging-background-prompt.txt' `
  --size 2400x1440 `
  --quality high `
  --out 'output/imagegen/zko-packaging-background.png'
```

The supplied vector Logo is intentionally not passed to GPT Image 2. It is overlaid afterward from `ZKO_logo_vector.svg` so its paths remain exact.

- [ ] **Step 3: Acquire the real homepage QR SVG using the direct connection first**

Run:

```powershell
$QrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=900x900&format=svg&margin=0&data=https%3A%2F%2Fshenqiqishi.github.io%2Fzko_page%2F'
try {
  Invoke-WebRequest -Uri $QrUrl -OutFile 'assets/packaging/zko-homepage-qr.svg' -TimeoutSec 30
} catch {
  Invoke-WebRequest -Uri $QrUrl -OutFile 'assets/packaging/zko-homepage-qr.svg' -Proxy 'http://127.0.0.1:7897' -TimeoutSec 30
}
```

Expected: `assets/packaging/zko-homepage-qr.svg` exists and contains SVG path/rect data.

- [ ] **Step 4: Implement the deterministic sticker builder**

Create `tools/build-packaging-sticker.cjs` that:

```js
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const logoSource = fs.readFileSync(path.join(root, 'ZKO_logo_vector.svg'), 'utf8');
const qrSource = fs.readFileSync(path.join(root, 'assets/packaging/zko-homepage-qr.svg'), 'utf8');
const logoPath = logoSource.match(/<path\s+d="([^"]+)"[^>]*fill-rule="evenodd"\s*\/>/s)?.[1];
if (!logoPath) throw new Error('Unable to extract ZKO logo path');

const qrData = Buffer.from(qrSource).toString('base64');
const homepage = 'https://shenqiqishi.github.io/zko_page/';
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2400" height="1440" viewBox="0 0 2400 1440" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">ZKO Logo packaging sticker</title>
  <desc id="desc">苍虬 AI 编程手柄包装贴纸，主页 ${homepage}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#05090B"/><stop offset="0.64" stop-color="#101C20"/><stop offset="1" stop-color="#071015"/></linearGradient>
    <radialGradient id="glow" cx="1" cy="0"><stop stop-color="#1DE2EF" stop-opacity=".28"/><stop offset=".52" stop-color="#1DE2EF" stop-opacity="0"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="28"/></filter>
  </defs>
  <rect width="2400" height="1440" rx="72" fill="url(#bg)"/>
  <rect width="2400" height="1440" rx="72" fill="url(#glow)"/>
  <circle cx="2180" cy="1420" r="570" fill="none" stroke="#2FE4ED" stroke-opacity=".16" stroke-width="8"/>
  <circle cx="2180" cy="1420" r="480" fill="none" stroke="#2FE4ED" stroke-opacity=".08" stroke-width="4"/>
  <g transform="translate(150 242) scale(1.12)" fill="#F7FBFC"><path d="${logoPath}" fill-rule="evenodd"/></g>
  <text x="150" y="930" fill="#FFFFFF" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="126" font-weight="700">苍虬 AI 编程手柄</text>
  <text x="154" y="1055" fill="#8FEAF0" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="64" font-weight="600" letter-spacing="8">把 AI 工作流握在手里</text>
  <rect x="1672" y="250" width="560" height="560" rx="18" fill="#FFFFFF"/>
  <image x="1714" y="292" width="476" height="476" href="data:image/svg+xml;base64,${qrData}"/>
  <text x="1952" y="920" text-anchor="middle" fill="#FFFFFF" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="58" font-weight="700" letter-spacing="8">扫码访问官网</text>
  <text x="1952" y="995" text-anchor="middle" fill="#79DCE3" font-family="Arial, sans-serif" font-size="28">shenqiqishi.github.io/zko_page</text>
</svg>`;

const svgPath = path.join(root, 'assets/packaging/zko-packaging-sticker.svg');
const pngPath = path.join(root, 'assets/packaging/zko-packaging-sticker.png');
fs.writeFileSync(svgPath, svg);
sharp(Buffer.from(svg)).png().toFile(pngPath).then(() => console.log(`${svgPath}\n${pngPath}`));
```

- [ ] **Step 5: Run the builder with the bundled runtime**

Run:

```powershell
$env:NODE_PATH = 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools/build-packaging-sticker.cjs
```

Expected: the builder prints the SVG and PNG paths and both files exist.

- [ ] **Step 6: Run sticker tests**

Run:

```powershell
node --test tests/sticker.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit packaging assets and generator**

```powershell
git add output/imagegen/zko-packaging-background-prompt.txt output/imagegen/zko-packaging-background-command.ps1 assets/packaging/zko-homepage-qr.svg assets/packaging/zko-packaging-sticker.svg assets/packaging/zko-packaging-sticker.png tools/build-packaging-sticker.cjs
git commit -m "feat: add ZKO packaging sticker assets"
```

### Task 3: Replace Website Header Wordmarks with the Vector Logo

**Files:**
- Modify: `index.html`
- Modify: `shop.html`
- Modify: `guide.html`
- Modify: `styles.css`

- [ ] **Step 1: Replace the three text wordmarks**

In each public page, replace:

```html
<span class="brand__mark">ZKO</span>
```

with:

```html
<img class="brand__logo" src="ZKO_logo_vector.svg" alt="" width="1095" height="360">
```

The surrounding `.brand` link already has `aria-label="苍虬首页"`, so the image remains decorative to avoid duplicate screen-reader text.

- [ ] **Step 2: Add responsive Logo styling**

Replace the obsolete `.brand__mark` rules in `styles.css` with:

```css
.brand__logo {
  display: block;
  width: 88px;
  height: auto;
  flex: 0 0 auto;
}
```

Within the existing mobile media query, add:

```css
.brand__logo {
  width: 72px;
}
```

- [ ] **Step 3: Run website and sticker tests**

Run:

```powershell
node --test tests/site.test.mjs tests/sticker.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit the website Logo update**

```powershell
git add index.html shop.html guide.html styles.css ZKO_logo_vector.svg
git commit -m "feat: use vector ZKO logo in site headers"
```

### Task 4: Visual and QR Verification

**Files:**
- Verify: `assets/packaging/zko-packaging-sticker.png`
- Verify: `assets/packaging/zko-packaging-sticker.svg`
- Verify: `index.html`
- Verify: `shop.html`
- Verify: `guide.html`

- [ ] **Step 1: Inspect the final PNG at original resolution**

Open `assets/packaging/zko-packaging-sticker.png` and confirm:

- Logo, product name, and tagline use the approved enlarged hierarchy.
- There is no excessive middle gutter.
- QR white border is uninterrupted.
- No content touches the 2 mm equivalent safe margin.

- [ ] **Step 2: Decode the QR from the final PNG**

Install a temporary decoder with the direct connection first, falling back to `127.0.0.1:7897` only if needed, then decode the QR crop and assert the result equals:

```text
https://shenqiqishi.github.io/zko_page/
```

- [ ] **Step 3: Preview the local website and inspect desktop/mobile headers**

Start a local static server, open all three public pages, and verify the vector Logo is crisp, does not distort, and does not collide with navigation at desktop and mobile widths.

- [ ] **Step 4: Run final automated verification**

Run:

```powershell
git diff --check
node --test tests/site.test.mjs tests/sticker.test.mjs
git status --short
```

Expected: no whitespace errors; all tests pass; only known user-owned untracked files remain outside the implementation commits.
