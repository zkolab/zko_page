# ZKO Domestic Release, Color Preorder, and Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add equal-priority Gitee and GitHub release entrances, replace software screenshots, expand preorder colors, and add a Tencent Docs feedback section without claiming unsupported direct submission.

**Architecture:** Keep the site build-free and static. Extend the existing three-page HTML/CSS/JavaScript system and Node contract tests; copy only the two approved `figures` screenshots into `assets/images`, while external release and feedback actions remain safe links.

**Tech Stack:** Semantic HTML5, responsive CSS, vanilla JavaScript, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Define release and feedback contracts

**Files:**
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add Gitee and Tencent Docs constants**

```js
const giteeReleaseUrl = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';
const feedbackUrl = 'https://docs.qq.com/sheet/DQUFjTktqTmF0d1FG?tab=BB08J2';
```

- [ ] **Step 2: Add failing cross-page release tests**

Require every public page to expose at least one safe Gitee link and one safe GitHub link. Require the homepage to contain `id="release-downloads"` and two links inside that section with equal `release-button` classes.

```js
test('all pages expose equal-priority Gitee and GitHub release links', () => {
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    assert.match(html, new RegExp(escapeRegExp(giteeReleaseUrl)));
    assert.match(html, new RegExp(escapeRegExp(downloadUrl)));
  }
  const home = stripHtmlComments(read('index.html'));
  assert.match(home, /id=["']release-downloads["']/);
  assert.equal((home.match(/class=["'][^"']*release-button[^"']*["']/g) ?? []).length, 2);
});
```

- [ ] **Step 3: Add failing color and feedback tests**

```js
test('shop distinguishes default gray from preorder-only colors and links feedback', () => {
  const html = stripHtmlComments(read('shop.html'));
  assert.match(html, /灰色为默认交付颜色/);
  assert.match(html, /其他自选颜色/);
  assert.match(html, /仅支持提前预订/);
  assert.match(html, new RegExp(escapeRegExp(feedbackUrl)));
  assert.match(html, /实际编辑与保存能力由腾讯文档权限控制/);
  assert.doesNotMatch(html, /提交成功|已保存到腾讯文档/);
});
```

- [ ] **Step 4: Add failing screenshot dimension tests**

Update expected production assets to assert:

```js
const replacementImages = new Map([
  ['assets/images/software-main.webp', [1180, 620]],
  ['assets/images/software-settings.webp', [1442, 852]],
]);
```

Require page image tags referencing these paths to declare the exact new dimensions.

- [ ] **Step 5: Run tests and verify RED**

Run:

```powershell
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/site.test.mjs
```

Expected: FAIL because Gitee links, custom color, feedback section, and replacement dimensions are absent.

### Task 2: Replace the approved software screenshots

**Files:**
- Replace: `assets/images/software-main.webp`
- Replace: `assets/images/software-settings.webp`
- Modify: `index.html`
- Modify: `shop.html`

- [ ] **Step 1: Copy the approved files into production assets**

Use PowerShell `Copy-Item -LiteralPath`:

```powershell
Copy-Item -LiteralPath 'figures\main-window-numbered.webp' -Destination 'assets\images\software-main.webp' -Force
Copy-Item -LiteralPath 'figures\device-settings-numbered.webp' -Destination 'assets\images\software-settings.webp' -Force
```

- [ ] **Step 2: Update page dimensions and alt text**

Set `software-main.webp` image tags to `width="1180" height="620"` and describe the numbered AutoClipboard main window. Set `software-settings.webp` tags to `width="1442" height="852"` and describe the numbered device settings window.

- [ ] **Step 3: Run the screenshot tests**

Run the full Node test command. Expected: screenshot asset and dimension checks pass; release and color tests may still fail.

- [ ] **Step 4: Commit the screenshot replacement**

```powershell
git add -- assets/images/software-main.webp assets/images/software-settings.webp index.html shop.html tests/site.test.mjs
git commit -m "feat: update numbered software screenshots"
```

### Task 3: Add equal-priority release entrances

**Files:**
- Modify: `index.html`
- Modify: `shop.html`
- Modify: `guide.html`
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add URL synchronization in JavaScript**

```js
const GITEE_RELEASE_URL = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';

for (const link of queryAll('[data-gitee-release-link]')) {
  link.href = GITEE_RELEASE_URL;
}
```

Extend the VM URL test to verify the constant and every `data-gitee-release-link` destination.

- [ ] **Step 2: Build the homepage release block**

Inside the hero content, add:

```html
<div class="hero-release" id="release-downloads">
  <span>正式发布与下载</span>
  <div class="hero-release__actions">
    <a class="release-button" data-gitee-release-link href="https://gitee.com/shan-yujun/Communist-Manifesto-Releases" target="_blank" rel="noopener noreferrer">Gitee 发布仓库</a>
    <a class="release-button" data-download-link href="https://github.com/Lijinzh/Communist-Manifesto-Releases" target="_blank" rel="noopener noreferrer">GitHub 发布仓库</a>
  </div>
</div>
```

Keep “了解产品” and “立即购买” as secondary text links below it. Change the homepage header “下载” link to `#release-downloads`.

- [ ] **Step 3: Add both repositories to all download sections**

Add safe Gitee links beside GitHub links in the homepage software section and footer, shop footer, guide hero/download panel/footer, and shared navigation where the existing external download link is shown.

- [ ] **Step 4: Style equal-priority buttons responsively**

Define `.hero-release`, `.hero-release__actions`, and `.release-button` so both buttons use identical sizing, color, border, and typography. Stack them at the mobile breakpoint without changing priority.

- [ ] **Step 5: Run tests and verify GREEN for release contracts**

Run the full Node test command. Expected: all Gitee/GitHub link and JavaScript URL tests pass.

- [ ] **Step 6: Commit release entrances**

```powershell
git add -- index.html shop.html guide.html styles.css script.js tests/site.test.mjs
git commit -m "feat: add Gitee release entrances"
```

### Task 4: Expand preorder colors and add Tencent feedback guidance

**Files:**
- Modify: `shop.html`
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add the custom color selector**

Add a sixth button:

```html
<button class="color-swatch color-swatch--custom" type="button" data-color-option="其他自选颜色" aria-pressed="false">
  <span class="swatch swatch--custom" aria-hidden="true"></span>
  其他自选颜色 <small>仅预订</small>
</button>
```

Add “仅预订” labels to red, white, black, and purple. Keep gray selected and labeled “默认”. The existing selector script continues to update the selected label for all six choices.

- [ ] **Step 2: Rewrite color policy copy**

State exactly that gray is the default delivery color; every listed non-gray color and any other requested color only supports advance preorder and requires production feasibility confirmation through Xianyu.

- [ ] **Step 3: Add the feedback section**

After the color configurator, create a `section.feedback-section` with examples for color, microphone, mounting, and usage scenarios. Add a safe external button to the exact Tencent Docs URL and the notice:

```html
<p class="feedback-section__notice">建议将在腾讯文档中查看；实际编辑与保存能力由腾讯文档权限控制。</p>
```

Do not add a fake submit handler or success message.

- [ ] **Step 4: Style the feedback and custom-color UI**

Add responsive `.feedback-section`, `.feedback-prompt-grid`, `.color-swatch--custom`, and `.swatch--custom` rules. Use a restrained multicolor conic gradient only on the custom swatch.

- [ ] **Step 5: Run all tests**

Expected: 0 failures, including six color choices, default gray, preorder-only language, Tencent Docs link safety, and existing color-selector behavior.

- [ ] **Step 6: Commit color and feedback updates**

```powershell
git add -- shop.html styles.css script.js tests/site.test.mjs
git commit -m "feat: add custom color feedback guidance"
```

### Task 5: Browser verification and publication

**Files:**
- Verify all modified public files and production assets.

- [ ] **Step 1: Run final automated verification**

Run the full Node test command and `git diff --check`. Expected: tests pass with zero failures and diff check exits 0.

- [ ] **Step 2: Start a local static server**

Serve the repository on an unused localhost port and inspect `index.html`, `shop.html`, and `guide.html` at 1440×900 and 390×844.

- [ ] **Step 3: Verify interactions and layout**

Confirm equal Gitee/GitHub buttons, mobile menu, all six color choices, feedback link, replacement screenshots, no broken images, no horizontal overflow, and no browser console errors.

- [ ] **Step 4: Push `main`**

```powershell
git push origin main
```

Expected: remote `main` advances to the implementation commits.

- [ ] **Step 5: Monitor GitHub Pages**

Use the GitHub Actions or Pages API to confirm the deployment for the pushed SHA completes successfully.

- [ ] **Step 6: Verify deployed content**

Confirm the deployed commit contains both release URLs, the Tencent Docs URL, the six-color policy, and the two replacement images. If direct `github.io` access is reset by the current network, use the authenticated Pages API plus remote blob contents as deployment evidence.
