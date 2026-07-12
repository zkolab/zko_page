# 苍虬 AI 编程手柄宣传网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向 AI 编程和语音编程用户、可直接部署到 GitHub Pages、并引导访客前往闲鱼购买的响应式单页产品网站。

**Architecture:** 使用无构建步骤的静态前端，`index.html` 承载语义化内容，`styles.css` 负责沉浸式科技视觉与响应式布局，`script.js` 只处理购买链接、移动导航和渐进式滚动动效。资源保存在 `assets/images/`，Node 内置测试从静态文件层面验证关键内容、链接、可访问性和部署约束。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js 内置 `node:test`、GitHub Pages

---

## 文件结构

- `index.html`：完整产品叙事、语义化区块、购买入口和图片替代文本。
- `styles.css`：颜色变量、排版、布局、卡片、动效、响应式与减少动态效果降级。
- `script.js`：集中购买链接、移动菜单、IntersectionObserver 渐进增强。
- `assets/images/hero.png`：首屏产品主视觉，由 `13.png` 复制并保留原始画质。
- `assets/images/macros.png`：4 个宏键说明图，来源为 `12.png`。
- `assets/images/status.png`：Agent 状态与小屏说明图，来源为 `14.png`。
- `assets/images/workflow.png`：功能与路线图宣传图，来源为 `15.png`。
- `assets/images/autoclipboard-main.png`：AutoClipboard 主界面截图，来源为 `4.png`。
- `assets/images/autoclipboard-settings.png`：设备设置与 IMU 截图，来源为 `5.png`。
- `tests/site.test.mjs`：静态站点自动验证。
- `README.md`：项目说明、本地预览和 GitHub Pages 部署步骤。

### Task 1: 建立静态站点测试契约

**Files:**
- Create: `tests/site.test.mjs`

- [ ] **Step 1: 编写初始失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const purchaseUrl = 'https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B';

test('required site files exist', () => {
  for (const file of ['index.html', 'styles.css', 'script.js', 'README.md']) {
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `${file} should exist`);
  }
});

test('page contains required story sections and purchase link', () => {
  const html = read('index.html');
  for (const id of ['pain-points', 'workflow', 'features', 'software', 'specs', 'buy']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, new RegExp(purchaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /¥|￥|售价|价格\s*[:：]/);
});

test('images have alt text and dimensions', () => {
  const html = read('index.html');
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(images.length >= 6);
  for (const image of images) {
    assert.match(image, /\balt="[^"]+"/);
    assert.match(image, /\bwidth="\d+"/);
    assert.match(image, /\bheight="\d+"/);
  }
});

test('responsive and reduced-motion styles exist', () => {
  const css = read('styles.css');
  assert.match(css, /@media\s*\([^)]*max-width/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
});

test('purchase URL is centralized in JavaScript', () => {
  const script = read('script.js');
  assert.match(script, /const\s+PURCHASE_URL\s*=\s*['"]https:\/\/m\.tb\.cn\/h\.802lN7o\?tk=phNwgK0gm5B['"]/);
  assert.match(script, /data-purchase-link/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/site.test.mjs`

Expected: FAIL，提示 `index.html`、`styles.css`、`script.js` 和 `README.md` 尚不存在。

- [ ] **Step 3: 提交测试契约**

```bash
git add tests/site.test.mjs
git commit -m "test: define landing page contract"
```

### Task 2: 整理产品图片资源

**Files:**
- Create: `assets/images/hero.png`
- Create: `assets/images/macros.png`
- Create: `assets/images/status.png`
- Create: `assets/images/workflow.png`
- Create: `assets/images/autoclipboard-main.png`
- Create: `assets/images/autoclipboard-settings.png`

- [ ] **Step 1: 创建资源目录并复制素材**

```powershell
New-Item -ItemType Directory -Force assets/images | Out-Null
Copy-Item 13.png assets/images/hero.png
Copy-Item 12.png assets/images/macros.png
Copy-Item 14.png assets/images/status.png
Copy-Item 15.png assets/images/workflow.png
Copy-Item 4.png assets/images/autoclipboard-main.png
Copy-Item 5.png assets/images/autoclipboard-settings.png
```

- [ ] **Step 2: 验证六张图片存在且尺寸正确**

Run:

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem assets/images/*.png | ForEach-Object {
  $image = [System.Drawing.Image]::FromFile($_.FullName)
  [PSCustomObject]@{ Name = $_.Name; Width = $image.Width; Height = $image.Height }
  $image.Dispose()
}
```

Expected: 输出 6 张图片；宣传图保持 `1122×1402`，软件截图保持原尺寸。

- [ ] **Step 3: 提交资源**

```bash
git add assets/images
git commit -m "assets: organize product imagery"
```

### Task 3: 实现语义化页面内容

**Files:**
- Create: `index.html`

- [ ] **Step 1: 创建 HTML 骨架和首屏**

使用 `<!doctype html>`、`lang="zh-CN"`、viewport、描述信息和 Open Graph 基础信息。导航包含 `#features`、`#workflow`、`#specs`，购买按钮同时保留真实 `href` 和 `data-purchase-link`：

```html
<a class="button button--primary" data-purchase-link
   href="https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B"
   target="_blank" rel="noopener noreferrer">前往闲鱼购买</a>
```

首屏必须包含主标题“写代码，不用再低头找快捷键”、副标题“语音编程的确认键 + AI Agent 的状态窗”和 `assets/images/hero.png`。

- [ ] **Step 2: 添加痛点和四步工作流区块**

创建 `id="pain-points"` 与 `id="workflow"`。工作流顺序固定为“说出需求 → 实体键确认 → Agent 工作 → 灯环与小屏反馈”，并用有序列表表达，保证关闭 CSS 后仍可理解。

- [ ] **Step 3: 添加功能、软件、参数和购买区块**

创建 `id="features"`、`id="software"`、`id="specs"`、`id="buy"`。功能区覆盖宏键、状态灯、小屏、AutoClipboard 和 IMU；软件区使用两张截图；参数区明确 Windows 主平台、Linux 实验支持、macOS 计划适配；页尾重复购买按钮。

- [ ] **Step 4: 添加测试版和准确性说明**

在路线图中把远程鼠标、快捷调起应用、自定义鼠标宏和更多 Profile 模板标注为“计划/测试”。添加“大疆麦克风仅作展示，不包含在包装内”和“Agent 状态同步依赖 AutoClipboard 与 Hook 配置”。

- [ ] **Step 5: 运行内容测试**

Run: `node --test tests/site.test.mjs`

Expected: 文件存在、内容区块、购买链接和图片测试通过；CSS 与 JavaScript 相关测试仍失败。

- [ ] **Step 6: 提交页面内容**

```bash
git add index.html
git commit -m "feat: add product landing page content"
```

### Task 4: 实现沉浸式响应式视觉

**Files:**
- Create: `styles.css`

- [ ] **Step 1: 定义设计变量和基础排版**

在 `:root` 中定义深色背景、青蓝强调色、绿色状态色、文本色、边框色、圆角和最大内容宽度。为 `body` 设置系统中文字体栈、深色径向渐变和可读行高。

- [ ] **Step 2: 实现首屏与主要组件**

使用 CSS Grid 构建首屏双栏；实现发光按钮、玻璃感卡片、步骤时间线、功能卡片、参数表和图片框。首屏产品图保持原比例，不能裁掉产品主体。

- [ ] **Step 3: 实现响应式布局**

至少添加 `@media (max-width: 900px)` 和 `@media (max-width: 640px)`：首屏改单列，卡片网格收窄，导航适配移动端，按钮在窄屏可全宽显示，并保证无横向滚动。

- [ ] **Step 4: 实现无障碍与动效降级**

为链接和按钮添加清晰的 `:focus-visible`；所有滚动进入效果默认可见，仅在 JavaScript 增强后隐藏；在 `@media (prefers-reduced-motion: reduce)` 中关闭平滑滚动、过渡和关键帧动画。

- [ ] **Step 5: 运行样式测试**

Run: `node --test tests/site.test.mjs`

Expected: 响应式、减少动态效果和焦点样式测试通过；JavaScript 与 README 测试仍失败。

- [ ] **Step 6: 提交视觉实现**

```bash
git add styles.css
git commit -m "feat: add immersive responsive styling"
```

### Task 5: 添加渐进式交互

**Files:**
- Create: `script.js`

- [ ] **Step 1: 集中管理购买链接**

```js
const PURCHASE_URL = 'https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B';

document.querySelectorAll('[data-purchase-link]').forEach((link) => {
  link.href = PURCHASE_URL;
});
```

- [ ] **Step 2: 实现移动导航**

查找 `[data-menu-button]` 和 `[data-site-nav]`，点击时同步 `aria-expanded` 与导航的 `data-open`；点击导航链接或按 Escape 后关闭菜单。元素不存在时直接跳过，不抛出错误。

- [ ] **Step 3: 实现滚动进入渐进增强**

当浏览器支持 `IntersectionObserver` 且用户未启用减少动态效果时，为 `document.documentElement` 添加 `js` 类，观察 `[data-reveal]`，进入视口后添加 `is-visible` 并取消观察。其他情况下内容保持默认可见。

- [ ] **Step 4: 运行全部自动测试**

Run: `node --test tests/site.test.mjs`

Expected: 除 README 文件检查外，其余测试全部通过。

- [ ] **Step 5: 提交交互**

```bash
git add script.js
git commit -m "feat: add progressive landing page interactions"
```

### Task 6: 编写使用与 GitHub Pages 部署说明

**Files:**
- Create: `README.md`

- [ ] **Step 1: 编写本地预览说明**

说明可以直接打开 `index.html`，也可运行：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

- [ ] **Step 2: 编写 GitHub Pages 部署步骤**

README 明确记录：在 GitHub 创建空仓库、添加远端、推送当前分支、进入 `Settings → Pages`、选择 `Deploy from a branch`、分支选择 `main` 与 `/ (root)`、保存并等待生成 `https://<用户名>.github.io/<仓库名>/`。

- [ ] **Step 3: 记录内容维护位置**

说明购买链接在 `script.js` 的 `PURCHASE_URL` 和 `index.html` 的回退 `href` 中；文案在 `index.html`；图片在 `assets/images/`。

- [ ] **Step 4: 运行全部自动测试**

Run: `node --test tests/site.test.mjs`

Expected: 5 个测试全部 PASS，退出码为 0。

- [ ] **Step 5: 提交文档**

```bash
git add README.md
git commit -m "docs: add preview and GitHub Pages guide"
```

### Task 7: 浏览器视觉与交互验收

**Files:**
- Modify: `index.html`（仅在验收发现问题时）
- Modify: `styles.css`（仅在验收发现问题时）
- Modify: `script.js`（仅在验收发现问题时）

- [ ] **Step 1: 启动本地静态服务器**

Run: `python -m http.server 8000`

Expected: 服务监听 `http://localhost:8000`。

- [ ] **Step 2: 验收桌面布局**

在约 `1440×900` 视口检查首屏、导航、各功能区、软件截图、参数和页尾；确认没有文字遮挡、图片变形或横向滚动。

- [ ] **Step 3: 验收移动布局**

在约 `390×844` 视口检查菜单、按钮、卡片、工作流和图片；确认触控目标清晰、主标题不溢出、购买入口容易找到。

- [ ] **Step 4: 验收交互和外链**

验证移动菜单打开/关闭、Escape 关闭、锚点导航、滚动进入效果和所有购买按钮。购买按钮最终 URL 必须为 `https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B`。

- [ ] **Step 5: 修复发现的问题并重新运行测试**

Run: `node --test tests/site.test.mjs`

Expected: 所有测试 PASS，浏览器桌面与移动检查无阻塞问题。

- [ ] **Step 6: 提交验收修复**

```bash
git add index.html styles.css script.js
git commit -m "fix: polish responsive landing page"
```

若验收未产生文件变更，则跳过该提交。

### Task 8: 最终交付检查

**Files:**
- Verify: all tracked site files

- [ ] **Step 1: 检查 Git 工作区**

Run: `git status --short`

Expected: 只显示原始素材文件未跟踪，或在决定保留它们后工作区干净；不得出现意外修改。

- [ ] **Step 2: 检查站点入口和资源引用**

Run: `node --test tests/site.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 3: 记录最终提交**

Run: `git log --oneline --decorate -8`

Expected: 包含设计、测试、资源、内容、样式、交互和部署文档提交。

- [ ] **Step 4: 向用户交付**

提供本地文件链接、验证结果、当前 Git 状态、GitHub Pages 部署步骤，以及更换购买链接和宣传图的位置。
