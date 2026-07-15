# Driver Download Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `CH343SER.EXE` in the current AutoClipboard Release and add GitHub Release plus official WCH driver links to the product landing page.

**Architecture:** Keep binary distribution in the existing `v0.3.48` GitHub Release and keep the Pages repository source-only. Add a small related-files panel to the existing software section, reusing the site's button and panel styles while adding only layout-specific CSS.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner, GitHub Releases, GitHub Pages.

---

### Task 1: Add failing link coverage

**Files:**
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Write the failing test**

Add constants for the reviewed URLs and a test that locates anchors by exact `href`, checks their labels, and requires `target="_blank"` plus both safe `rel` tokens.

```js
const releaseUrl = 'https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/tag/v0.3.48';
const officialDriverUrl = 'https://www.wch.cn/downloads/CH343SER_EXE.html';

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/site.test.mjs`

Expected: FAIL in `index.html guides users to the reviewed driver downloads` because the links are not present.

### Task 2: Add the related-files panel

**Files:**
- Modify: `index.html:149`
- Modify: `styles.css:616`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Add the minimal HTML**

Insert after the software section heading and before `.software-gallery`:

```html
<aside class="related-files" aria-labelledby="related-files-title" data-reveal>
  <div>
    <p class="eyebrow">相关文件</p>
    <h3 id="related-files-title">驱动与发布文件</h3>
    <p>GitHub Release 的附件中提供 CH343SER.EXE 镜像；如需查看驱动说明或获取沁恒发布的最新版本，请前往官方页面。</p>
  </div>
  <div class="related-files__actions">
    <a class="button" href="https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/tag/v0.3.48" target="_blank" rel="noopener noreferrer">GitHub Release 下载</a>
    <a class="text-link" href="https://www.wch.cn/downloads/CH343SER_EXE.html" target="_blank" rel="noopener noreferrer">沁恒官方驱动页</a>
  </div>
</aside>
```

- [ ] **Step 2: Add focused panel styles**

Extend the shared panel selector with `.related-files`, then add:

```css
.related-files {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  border-radius: var(--radius-md);
}

.related-files h3,
.related-files p {
  margin-bottom: 0;
}

.related-files__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 1.25rem;
}
```

At the existing `max-width: 900px` breakpoint, add:

```css
.related-files {
  align-items: flex-start;
  flex-direction: column;
}
```

At the existing small-screen breakpoint, add:

```css
.related-files__actions {
  width: 100%;
  align-items: stretch;
  flex-direction: column;
}
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `node --test tests/site.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 4: Commit the page change**

```bash
git add index.html styles.css tests/site.test.mjs docs/superpowers/plans/2026-07-16-driver-download-links.md
git diff --cached --check
git commit -m "feat: add driver download guidance"
```

### Task 3: Publish the Release attachment

**Files:**
- Upload: `CH343SER.EXE`

- [ ] **Step 1: Open the existing Release editor**

Open `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/tag/v0.3.48`, choose Edit, and preserve the existing tag, title, notes, and other assets.

- [ ] **Step 2: Upload the binary and save**

Upload `D:\document\kki\handle\zko\CH343SER.EXE`, wait for the upload to complete, then update the Release.

- [ ] **Step 3: Verify the published asset**

Query `https://api.github.com/repos/Lijinzh/Communist-Manifesto-Releases/releases/tags/v0.3.48` and confirm an asset named `CH343SER.EXE` exists with a non-zero size and a browser download URL.

### Task 4: Push and verify GitHub Pages

**Files:**
- Push committed changes from the Pages repository.

- [ ] **Step 1: Push the current main branch**

Run: `git push origin main`

Expected: the remote `main` branch advances to the page-change commit.

- [ ] **Step 2: Verify repository state**

Run: `git status --short --branch`

Expected: `main` is aligned with `origin/main`; the user's pre-existing untracked images, text file, and `CH343SER.EXE` remain untracked.

- [ ] **Step 3: Verify the deployed page**

Request `https://shenqiqishi.github.io/zko_page/` until it returns success and its HTML contains both exact reviewed URLs.

- [ ] **Step 4: Verify both destinations**

Confirm the GitHub Release page is reachable and the WCH official driver page responds successfully or redirects to a successful page.
