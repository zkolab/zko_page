# ZKO Private Buyer Guide Implementation Plan

> **最终审查修订（2026-07-26）：**不得在公开的 `robots.txt` 中写出隐藏目录名，因为这会直接暴露完整路径。以下计划中所有创建、测试、提交或核对 `robots.txt` 隐藏规则的步骤均由“页面保留 `noindex, nofollow, noarchive`，公开页面不链接隐藏目录，`robots.txt` 不得包含隐藏目录名”取代。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an unlinked four-page buyer guide inside the existing GitHub Pages site, with CC-Switch and official API setup first, practical AI and Skills workflows, and OpenLess / Typeless hand-controller integration.

**Architecture:** Keep the project static and build-free. Add one isolated hidden directory with four semantic HTML pages plus a shared CSS and JavaScript file; extend the existing Node contract tests to enforce hidden-path isolation, official links, required beginner content, responsive styling, copy controls, and secret-safety rules. Do not expose the hidden path from public-root files.

**Tech Stack:** Semantic HTML5, standalone responsive CSS, vanilla JavaScript, Node.js built-in test runner, GitHub Pages.

---

## File map

- Create `buyer-kit-7q4m9x2k6p8n3r5v/index.html`: buyer-only overview and reading order.
- Create `buyer-kit-7q4m9x2k6p8n3r5v/ai-guide.html`: CC-Switch, official provider keys, tool selection, and first tasks.
- Create `buyer-kit-7q4m9x2k6p8n3r5v/coding-workflow.html`: Superpowers and domain Skill workflows.
- Create `buyer-kit-7q4m9x2k6p8n3r5v/openless-typeless.html`: official OpenLess / Typeless setup and hand-controller workflow.
- Create `buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.css`: isolated guide layout, cards, labels, responsive behavior, focus, and reduced motion.
- Create `buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.js`: copy buttons and current-section navigation enhancement with readable no-JavaScript fallback.
- Create `robots.txt`: disallow the hidden directory.
- Modify `tests/site.test.mjs`: add buyer-guide contract, security, isolation, and interaction tests.

### Task 1: Define the buyer-guide contract

**Files:**
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Add buyer guide constants and page helpers**

Add below the current public page constants:

```js
const buyerKitDir = 'buyer-kit-7q4m9x2k6p8n3r5v';
const buyerPageFiles = [
  `${buyerKitDir}/index.html`,
  `${buyerKitDir}/ai-guide.html`,
  `${buyerKitDir}/coding-workflow.html`,
  `${buyerKitDir}/openless-typeless.html`,
];
const buyerAssetFiles = [
  `${buyerKitDir}/buyer-guide.css`,
  `${buyerKitDir}/buyer-guide.js`,
];
```

- [ ] **Step 2: Add a failing hidden-site isolation test**

```js
test('buyer guide files exist without being linked from public pages', () => {
  for (const path of [...buyerPageFiles, ...buyerAssetFiles, 'robots.txt']) requireFile(path);

  for (const page of pageFiles) {
    assert.doesNotMatch(read(page), new RegExp(escapeRegExp(buyerKitDir)));
  }

  const robots = read('robots.txt');
  assert.match(robots, /User-agent:\s*\*/i);
  assert.match(robots, new RegExp(`Disallow:\\s*/${escapeRegExp(buyerKitDir)}/`));
});
```

- [ ] **Step 3: Add failing structure, privacy, and internal-link tests**

```js
test('buyer pages are private-by-obscurity documents with shared navigation', () => {
  const titles = [];
  for (const page of buyerPageFiles) {
    const html = stripHtmlComments(read(page));
    titles.push(html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim());
    assert.match(html, /<meta\s+name="robots"\s+content="noindex, nofollow, noarchive"/i);
    assert.match(html, /<main\b[^>]*id="main-content"/i);
    assert.match(html, /class="buyer-header"/i);
    assert.match(html, /class="buyer-footer"/i);
    assert.match(html, /href="buyer-guide\.css"/i);
    assert.match(html, /src="buyer-guide\.js"/i);
    assert.match(html, /资料核对日期：2026-07-26/);
  }
  assert.equal(new Set(titles).size, buyerPageFiles.length);

  const overview = read(`${buyerKitDir}/index.html`);
  for (const href of ['ai-guide.html', 'coding-workflow.html', 'openless-typeless.html']) {
    assert.match(overview, new RegExp(`href=["']${escapeRegExp(href)}["']`));
  }
});
```

- [ ] **Step 4: Add failing content and official-link tests**

```js
test('AI guide starts with CC-Switch and official provider setup', () => {
  const html = stripHtmlComments(read(`${buyerKitDir}/ai-guide.html`));
  const ccIndex = html.indexOf('先配置 CC-Switch');
  const toolsIndex = html.indexOf('选择 AI 工具');
  assert.ok(ccIndex >= 0 && toolsIndex > ccIndex);

  for (const phrase of [
    '备份现有配置',
    'YOUR_API_KEY_HERE',
    'Base URL',
    '成功标志',
    '国内直连',
    '可能需要科学上网',
    'DeepSeek',
    'OpenAI',
    'Anthropic Claude',
    'Google Gemini',
    'Kimi',
    '阿里云百炼',
    '火山方舟',
    'Marvis',
    'CodeBuddy',
    'TRAE',
    'Codex',
    'Claude Code',
    'Cursor',
    'Gemini CLI',
    'GitHub Copilot',
    'OpenClaw',
  ]) assert.match(html, new RegExp(escapeRegExp(phrase)));

  for (const url of [
    'https://ccswitch.io',
    'https://github.com/farion1231/cc-switch',
    'https://github.com/farion1231/cc-switch/releases/latest',
    'https://platform.deepseek.com/api_keys',
    'https://api-docs.deepseek.com/',
  ]) assert.match(html, new RegExp(escapeRegExp(url)));
});

test('workflow guide teaches practical Skills usage', () => {
  const html = stripHtmlComments(read(`${buyerKitDir}/coding-workflow.html`));
  for (const phrase of [
    '第一次开发任务',
    'Brainstorming',
    'Writing Plans',
    'Test-Driven Development',
    'Systematic Debugging',
    'Verification Before Completion',
    'Requesting Code Review',
    'Documents',
    'PDF',
    'Spreadsheets',
    'Presentations',
    'ImageGen',
    'Visualize',
    'Browser Control',
    'Skill Installer',
    'Skill Creator',
    '/skills',
    '$skill-installer',
    'AutoClipboard',
  ]) assert.match(html, new RegExp(escapeRegExp(phrase)));

  for (const url of [
    'https://developers.openai.com/codex/skills',
    'https://github.com/openai/skills',
    'https://agentskills.io/specification',
  ]) assert.match(html, new RegExp(escapeRegExp(url)));
});

test('voice guide covers only the approved OpenLess and Typeless products', () => {
  const html = stripHtmlComments(read(`${buyerKitDir}/openless-typeless.html`));
  for (const phrase of [
    'OpenLess',
    'Typeless',
    '第一次语音转文字',
    '麦克风权限',
    '快捷键冲突',
    '苍虬手柄',
    'AutoClipboard',
  ]) assert.match(html, new RegExp(escapeRegExp(phrase)));
  assert.doesNotMatch(html, /Openiless/);
  assert.doesNotMatch(html, /OpenTypeless/);
  for (const url of [
    'https://openless.top/',
    'https://github.com/Open-Less/openless',
    'https://www.typeless.com/zh-cn',
    'https://www.typeless.com/zh-cn/downloads',
  ]) assert.match(html, new RegExp(escapeRegExp(url)));
});
```

- [ ] **Step 5: Add failing external-link, secret, CSS, and JS tests**

```js
test('buyer pages use safe official links and contain no live secrets', () => {
  const combined = buyerPageFiles.map((page) => stripHtmlComments(read(page))).join('\n');
  for (const page of buyerPageFiles) {
    for (const anchor of openingTags(read(page), 'a').filter((tag) => /^https:\/\//.test(attributeValue(tag, 'href') ?? ''))) {
      assert.equal(attributeValue(anchor, 'target'), '_blank');
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noopener(?:\s|$)/);
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noreferrer(?:\s|$)/);
    }
  }
  assert.doesNotMatch(combined, /sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(combined, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(combined, /(?:api[_-]?key|token)\s*[:=]\s*["'][^"']{16,}["']/i);
  assert.match(combined, /YOUR_API_KEY_HERE/);
});

test('buyer guide assets provide responsive focus-safe progressive enhancement', () => {
  const css = read(`${buyerKitDir}/buyer-guide.css`).replace(/\/\*[^]*?\*\//g, '');
  for (const selector of ['.buyer-header', '.buyer-layout', '.route-grid', '.step-list', '.status-tag', '.copy-block', '.buyer-footer']) {
    assert.match(css, new RegExp(escapeRegExp(selector)));
  }
  assert.match(css, /@media\b[^{}]*\(\s*max-width\s*:/i);
  assert.match(css, /@media\b[^{}]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  assert.match(css, /:focus-visible[^{}]*\{[^}]*(?:outline|box-shadow)\s*:/i);

  const script = read(`${buyerKitDir}/buyer-guide.js`);
  assert.match(script, /data-copy-button/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /复制成功/);
});
```

- [ ] **Step 6: Run the tests and verify RED**

Run:

```powershell
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/site.test.mjs
```

Expected: the new buyer-guide tests fail because the hidden directory, pages, assets, and `robots.txt` do not exist.

- [ ] **Step 7: Commit the failing contract**

```powershell
git add tests/site.test.mjs
git commit -m "test: define hidden buyer guide contract"
```

### Task 2: Build shared buyer-guide shell and overview

**Files:**
- Create: `buyer-kit-7q4m9x2k6p8n3r5v/index.html`
- Create: `buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.css`
- Create: `buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.js`

- [ ] **Step 1: Create the shared semantic page shell**

Use this contract on every buyer page:

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>页面标题 · 苍虬购买用户资料</title>
  <link rel="stylesheet" href="buyer-guide.css">
</head>
<body>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="buyer-header">
    <a class="buyer-brand" href="index.html">ZKO 苍虬 · 购买用户资料</a>
    <nav aria-label="资料导航">
      <a href="ai-guide.html">AI 使用</a>
      <a href="coding-workflow.html">编程工作流</a>
      <a href="openless-typeless.html">语音输入</a>
    </nav>
  </header>
  <main id="main-content">
    <section class="buyer-hero" aria-labelledby="page-title">
      <p class="eyebrow">BUYER GUIDE</p>
      <h1 id="page-title">页面标题</h1>
      <p>本页帮助购买用户按步骤完成一个明确结果。</p>
    </section>
  </main>
  <footer class="buyer-footer">资料核对日期：2026-07-26</footer>
  <script src="buyer-guide.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Create the overview content**

Include a hero headed `购买用户 AI 实操资料`, a four-step reading order, API-key safety warning, and three route cards linking to the exact filenames. Each route card must state the outcome:

```text
AI 使用指南：配置 CC-Switch、接入一个官方模型，并完成第一次 AI 任务。
编程工作流心得：使用 Superpowers 和常用 Skills 完成一次可验证的开发任务。
OpenLess / Typeless：完成第一次语音输入，并与苍虬手柄和 AutoClipboard 联动。
```

- [ ] **Step 3: Implement shared CSS**

Define a dark theme with CSS custom properties, readable 16px base type, maximum 1180px content width, two-column desktop layout with sticky table of contents, single-column mobile layout, responsive card grids, visible focus, native details styling, copy blocks, success and warning callouts, and reduced-motion overrides.

Required selectors are those asserted in Task 1. Do not import external fonts or CSS.

- [ ] **Step 4: Implement copy enhancement**

Use buttons shaped as:

```html
<div class="copy-block">
  <code>要复制的内容</code>
  <button type="button" data-copy-button>复制</button>
</div>
```

`buyer-guide.js` must read the nearest `.copy-block code`, call `navigator.clipboard.writeText(text)`, temporarily show `复制成功`, and show `请手动复制` when the Clipboard API is unavailable or rejects. The page remains readable without JavaScript.

- [ ] **Step 5: Run the overview-related tests**

Run the full Node test command. Expected: shared asset and overview assertions pass; AI, workflow, voice, and robots assertions still fail.

- [ ] **Step 6: Commit the shared shell**

```powershell
git add buyer-kit-7q4m9x2k6p8n3r5v/index.html buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.css buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.js
git commit -m "feat: add hidden buyer guide shell"
```

### Task 3: Write the practical AI and CC-Switch guide

**Files:**
- Create: `buyer-kit-7q4m9x2k6p8n3r5v/ai-guide.html`

- [ ] **Step 1: Create CC-Switch-first sections**

Write sections with these exact anchors and outcomes:

```text
#cc-switch       下载、安装、备份、添加供应商、测试、切换、恢复
#api-keys        官方 Key 创建、安全保存、余额与泄露处理
#providers       DeepSeek, OpenAI, Claude, Gemini, Kimi, 百炼, 火山方舟
#tools           国内基础和进阶 AI 工具选择
#first-task      可复制的第一次任务
#troubleshooting 配置切换、401、余额、模型名和网络问题
```

CC-Switch must appear before tool comparison. Use official CC-Switch links and warn that sponsored relay links in a project page are not model-vendor official APIs.

- [ ] **Step 2: Add provider recipes**

For every provider card, include official console/documentation links, network and payment labels, Key creation steps, CC-Switch fields, success signal, and failure checks. Use `YOUR_API_KEY_HERE` in examples.

DeepSeek's recipe must use official fields verified on 2026-07-26:

```text
Base URL: https://api.deepseek.com
API Key: YOUR_API_KEY_HERE
Model: 以 DeepSeek 官方控制台当前可选模型为准
```

Avoid embedding a model ID as permanent advice; link current official pricing/model docs.

- [ ] **Step 3: Add concise tool choices**

Create cards for Marvis, CodeBuddy, TRAE, 通义灵码, DeepSeek, Codex, Claude Code, Cursor, Gemini CLI, GitHub Copilot, and OpenClaw. Each card contains `适合做什么`, `准备条件`, official links, `第一次任务`, and `成功标志`.

- [ ] **Step 4: Add copyable first tasks and troubleshooting**

Include at least these copy blocks:

```text
请先阅读当前文件夹中的 README.md 和项目文件，不要修改任何内容。用简单中文告诉我：这个项目做什么、怎么运行、我可以先完成哪一个最小任务。
```

```text
请在修改前先列出计划。每完成一步就运行对应检查；如果失败，先解释原因，不要连续尝试高风险命令。
```

Troubleshooting must cover invalid Key/401, insufficient balance, incorrect Base URL, unavailable model name, configuration not activated, and network failure.

- [ ] **Step 5: Run tests and commit**

Run the full Node test command. Expected: AI guide assertions pass; remaining failures only concern workflow, voice, or robots.

```powershell
git add buyer-kit-7q4m9x2k6p8n3r5v/ai-guide.html
git commit -m "docs: add practical AI setup guide"
```

### Task 4: Write the Skills-driven coding workflow

**Files:**
- Create: `buyer-kit-7q4m9x2k6p8n3r5v/coding-workflow.html`

- [ ] **Step 1: Build the end-to-end beginner workflow**

Use anchors `#first-project`, `#superpowers`, `#domain-skills`, `#handle-workflow`, and `#workflow-troubleshooting`. The first project is a small static webpage change and follows this exact sequence:

```text
打开项目 → 让 AI 阅读说明 → Brainstorming → Writing Plans → TDD/执行 → Systematic Debugging → Verification → Code Review → Git 保存
```

For each step include `复制这句话`, `你需要回答什么`, `成功标志`, and `下一步`.

- [ ] **Step 2: Add concise Skill cards**

Group cards into development quality, office documents, design/content, browser/automation, and Skill management. Every card answers only when to use it, how to invoke it, what input the user provides, and what to do next.

Use the official Codex facts:

```text
/skills：查看或选择可用 Skills。
$skill-name：明确调用某个 Skill。
$skill-installer：安装精选 Skill 或从仓库安装 Skill。
```

Link the official Codex Skills page, OpenAI skills repository, and Agent Skills specification.

- [ ] **Step 3: Add the hand-controller workflow**

Explain the exact five-step flow: dictate task, press macro to confirm/send, watch AutoClipboard Agent state on the device, respond to permission/blocked states, then paste or send the next instruction. Preserve the distinction between independent BLE macros and AutoClipboard-dependent Agent status.

- [ ] **Step 4: Run tests and commit**

Run the full Node test command. Expected: workflow guide assertions pass; remaining failures only concern voice or robots.

```powershell
git add buyer-kit-7q4m9x2k6p8n3r5v/coding-workflow.html
git commit -m "docs: add Skills coding workflow"
```

### Task 5: Write the OpenLess / Typeless guide

**Files:**
- Create: `buyer-kit-7q4m9x2k6p8n3r5v/openless-typeless.html`

- [ ] **Step 1: Create an approved-product comparison**

Use only OpenLess and Typeless. Link the official OpenLess site/repository and Typeless site/download page. The comparison covers cost model, platform support, network/account needs, open-source status, and the kind of user each product suits. State that changing product features must be checked against official sources.

- [ ] **Step 2: Add two five-minute setup paths**

Each path covers download, install, microphone/accessibility permission, global shortcut, first dictation, success signal, and common permission/network issues. Do not claim unsupported accuracy percentages or privacy guarantees.

- [ ] **Step 3: Add hand-controller and AutoClipboard integration**

Explain how to map one hand-controller button to the voice shortcut and another to Enter, test in a plain-text editor, then use the same flow in an AI tool. State that the actual shortcut must match the user's OpenLess or Typeless settings.

- [ ] **Step 4: Run tests and commit**

Run the full Node test command. Expected: voice guide assertions pass; only robots or final integration issues may remain.

```powershell
git add buyer-kit-7q4m9x2k6p8n3r5v/openless-typeless.html
git commit -m "docs: add voice input buyer guide"
```

### Task 6: Add crawl rules and complete automated verification

**Files:**
- Create: `robots.txt`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Add the crawl rule**

```text
User-agent: *
Disallow: /buyer-kit-7q4m9x2k6p8n3r5v/
```

- [ ] **Step 2: Run the complete test suite**

```powershell
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/site.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 3: Run formatting and secret checks**

```powershell
git diff --check
rg -n "sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|Openiless|TBD|TODO" buyer-kit-7q4m9x2k6p8n3r5v tests/site.test.mjs robots.txt
```

Expected: `git diff --check` exits successfully; `rg` returns no matches except intentional negative-test regexes in `tests/site.test.mjs`.

- [ ] **Step 4: Verify public isolation**

```powershell
rg -n "buyer-kit-7q4m9x2k6p8n3r5v" index.html shop.html guide.html script.js styles.css README.md
```

Expected: no matches.

- [ ] **Step 5: Commit crawl and final automated fixes**

```powershell
git add robots.txt tests/site.test.mjs buyer-kit-7q4m9x2k6p8n3r5v
git commit -m "feat: complete hidden buyer documentation"
```

### Task 7: Browser and link QA

**Files:**
- Inspect: `buyer-kit-7q4m9x2k6p8n3r5v/*.html`
- Inspect: `buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.css`
- Inspect: `buyer-kit-7q4m9x2k6p8n3r5v/buyer-guide.js`

- [ ] **Step 1: Start a local server**

```powershell
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8000
```

- [ ] **Step 2: Inspect the overview and all three guides at 1440×900**

Check card layout, table of contents, official-link groups, details panels, copy feedback, previous/next navigation, and the absence of broken assets or console errors.

- [ ] **Step 3: Inspect all four pages at 390×844**

Check single-column layout, readable code blocks, button wrapping, sticky elements, no horizontal overflow, visible focus, and usable details summaries.

- [ ] **Step 4: Verify representative official links**

Open CC-Switch, DeepSeek API Docs, Codex Skills, OpenLess, and Typeless official targets. Confirm the domain and page title; do not sign in, create accounts, create API keys, or submit forms.

- [ ] **Step 5: Re-run automated tests after any visual fixes**

Run the complete Node test command and require zero failures.

- [ ] **Step 6: Commit browser-QA fixes if any**

```powershell
git add buyer-kit-7q4m9x2k6p8n3r5v tests/site.test.mjs robots.txt
git commit -m "fix: polish hidden buyer guide"
```

Skip this commit only when browser QA required no file changes.

### Task 8: Final requirements audit

**Files:**
- Read: `docs/superpowers/specs/2026-07-26-zko-private-buyer-guide-design.md`
- Read: all buyer-guide files

- [ ] **Step 1: Compare implementation against every spec section**

Confirm access design, four-page architecture, CC-Switch-first ordering, all provider/tool/Skill groups, official links, API security, OpenLess / Typeless scope, controller workflow, maintenance date, and non-goals.

- [ ] **Step 2: Run final evidence commands**

```powershell
& 'C:\Users\Magic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/site.test.mjs
git diff --check
git status --short
git log -8 --oneline
```

Expected: tests pass with zero failures; no whitespace errors; only pre-existing unrelated untracked files remain; commits show the plan and buyer-guide implementation history.
