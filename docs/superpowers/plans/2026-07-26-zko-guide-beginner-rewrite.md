# ZKO Beginner-Friendly Guide Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the public guide around a six-step beginner flow, accurate Windows/Ubuntu/macOS support maturity, plain-language operation guidance, and symptom-first troubleshooting.

**Architecture:** Keep the site static and build-free. Extend the existing guide contract tests, replace only the guide page content structure, and add a small set of reusable guide card styles to the existing stylesheet; shared navigation, link synchronization, imagery, and JavaScript remain unchanged.

**Tech Stack:** Semantic HTML5, responsive CSS, vanilla JavaScript already present in the site, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Define the corrected guide contract

**Files:**
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add a failing platform maturity test**

Add a test that reads `guide.html` and requires the three platform statuses and file patterns:

```js
test('guide explains supported operating systems and package choices', () => {
  const html = stripHtmlComments(read('guide.html'));
  assert.match(html, /Windows[\s\S]{0,180}成熟测试/);
  assert.match(html, /Ubuntu[\s\S]{0,180}成熟测试/);
  assert.match(html, /macOS[\s\S]{0,180}测试中/);
  assert.match(html, /AutoClipboardSetup-&lt;version&gt;\.exe/);
  assert.match(html, /auto-clipboard_&lt;version&gt;_&lt;arch&gt;\.deb/);
  assert.match(html, /AutoClipboard-&lt;version&gt;-macOS\.dmg/);
  assert.match(html, /CH343[\s\S]{0,220}Windows/);
});
```

- [ ] **Step 2: Replace the old guide-content test with a beginner-flow contract**

Require these exact ideas:

```js
for (const phrase of [
  '第一次使用，从这里开始',
  '选择你的系统',
  '6 步完成首次使用',
  'CommunistKB-XXXX',
  'PAIR',
  'LINK',
  '在纯文本输入框中测试',
  '基础蓝牙宏不依赖 AutoClipboard',
  '宏键能输入，但 AutoClipboard 显示未连接',
]) {
  assert.match(html, new RegExp(phrase));
}
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```powershell
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/site.test.mjs
```

Expected: the new tests fail because the current guide says Windows is the main platform, lacks support maturity cards, uses five steps, and does not contain the three package patterns.

### Task 2: Rewrite the guide for first-time users

**Files:**
- Modify: `guide.html`

- [ ] **Step 1: Rewrite the hero and table of contents**

Use the heading `第一次使用，从这里开始`, explain that downloading, pairing, and testing one macro are the immediate goals, and retain equal Gitee/GitHub release buttons. Update the table of contents to:

```html
<a href="#platforms">选择系统</a>
<a href="#quick-start">6 步首次使用</a>
<a href="#hardware">认识手柄</a>
<a href="#bluetooth">蓝牙连接</a>
<a href="#multi-host">三台电脑</a>
<a href="#controls">常用操作</a>
<a href="#software">AutoClipboard</a>
<a href="#troubleshooting">遇到问题</a>
```

- [ ] **Step 2: Add platform support cards**

Create `section#platforms` containing three `platform-status-card` articles:

```html
<article class="platform-status-card">
  <span class="support-badge support-badge--stable">成熟测试</span>
  <h3>Windows</h3>
  <p>下载 <code>AutoClipboardSetup-&lt;version&gt;.exe</code>。</p>
</article>
<article class="platform-status-card">
  <span class="support-badge support-badge--stable">成熟测试</span>
  <h3>Ubuntu</h3>
  <p>下载 <code>auto-clipboard_&lt;version&gt;_&lt;arch&gt;.deb</code>。</p>
</article>
<article class="platform-status-card">
  <span class="support-badge support-badge--testing">测试中</span>
  <h3>macOS</h3>
  <p>下载 <code>AutoClipboard-&lt;version&gt;-macOS.dmg</code>。</p>
</article>
```

Add plain-language installation notes: Windows uses the EXE; Ubuntu installs the DEB and tries graphical Bluetooth settings first; macOS opens the DMG and copies the app to Applications, with a testing-status warning. State that CH343 is only needed when Windows cannot create the Type-C COM port.

- [ ] **Step 3: Replace the quick start with six concrete steps**

The six steps must cover downloading, installing, charging/waking, pairing `CommunistKB-XXXX`, observing `PAIR` to `LINK`, and testing a macro in a plain-text field before using the full software.

- [ ] **Step 4: Simplify the existing operation sections**

Keep the existing local images and accurate hardware facts, while replacing unexplained terminology with first-use explanations. Use “使用场景配置（Profile）” at first mention. Explicitly state:

```text
基础蓝牙宏不依赖 AutoClipboard；Agent 状态、Profile 快开、IMU 预览和深度设置需要 AutoClipboard 保持运行。
```

- [ ] **Step 5: Reorganize troubleshooting by symptom**

Include short, low-risk checks for device discovery, macro input, AutoClipboard connection, Agent status, Windows COM port, unnamed Ubuntu HID address, and macOS test-version problems. Link advanced Ubuntu and firmware work to the release repositories instead of embedding destructive or expert-only commands.

- [ ] **Step 6: Run the guide contract tests**

Run the full Node test command. Expected: platform and beginner-flow tests pass; existing external-link, image, navigation, and script tests remain green.

### Task 3: Style the new guide sections responsively

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add platform and plain-language component styles**

Add:

```css
.platform-status-grid,
.platform-guide-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.platform-status-card,
.platform-guide-card {
  padding: 1.4rem;
  background: var(--mist);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.support-badge {
  display: inline-flex;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 850;
}

.support-badge--stable {
  color: #006778;
  background: #dff9fc;
}

.support-badge--testing {
  color: #7b4d00;
  background: #fff0cc;
}

.plain-language-note {
  padding: 1rem 1.15rem;
  background: #f0fbfd;
  border-left: 4px solid var(--cyan-deep);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
```

- [ ] **Step 2: Add responsive rules**

At `max-width: 800px`, switch both grids to one column. Ensure long package names wrap by applying `overflow-wrap: anywhere` to platform card code elements.

- [ ] **Step 3: Run the complete test suite and diff check**

Run the Node tests and `git diff --check`. Expected: 0 failures and no whitespace errors.

### Task 4: Browser verification and publication

**Files:**
- Verify: `guide.html`, `styles.css`, `tests/site.test.mjs`

- [ ] **Step 1: Start a local static server**

Serve the repository and inspect `guide.html` at 1440×900 and 390×844.

- [ ] **Step 2: Verify the real page**

Confirm all three platform cards, support badges, six steps, table of contents, mobile menu, troubleshooting, images, and release links. Require no horizontal overflow, broken visible images, or browser console errors.

- [ ] **Step 3: Commit the implementation**

```powershell
git add -- guide.html styles.css tests/site.test.mjs
git commit -m "docs: rewrite guide for first-time users"
```

- [ ] **Step 4: Push main**

```powershell
git push origin main
```

- [ ] **Step 5: Monitor GitHub Pages and verify deployment**

Confirm `pages build and deployment` succeeds for the pushed SHA. Fetch the live guide with cache-busting and verify the three platform maturity labels, package patterns, six-step heading, and symptom-first troubleshooting are present.
