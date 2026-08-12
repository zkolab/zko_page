import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const purchaseUrl = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';
const downloadUrl = 'https://github.com/Lijinzh/Communist-Manifesto-Releases';
const giteeReleaseUrl = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';
const autoClipboardWindowsVersion = '0.3.67';
const autoClipboardWindowsReleaseTag = 'v0.3.67';
const windowsFilename = `AutoClipboardSetup-${autoClipboardWindowsVersion}.exe`;
const giteeWindowsDownloadUrl = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${autoClipboardWindowsReleaseTag}/AutoClipboardSetup-${autoClipboardWindowsVersion}.exe`;
const githubWindowsDownloadUrl = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${autoClipboardWindowsReleaseTag}/AutoClipboardSetup-${autoClipboardWindowsVersion}.exe`;
const autoClipboardLinuxVersion = '0.3.65';
const autoClipboardLinuxReleaseTag = 'v0.3.65';
const linuxFilename = `auto-clipboard_${autoClipboardLinuxVersion}_amd64.deb`;
const giteeLinuxDownloadUrl = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${autoClipboardLinuxReleaseTag}/auto-clipboard_${autoClipboardLinuxVersion}_amd64.deb`;
const githubLinuxDownloadUrl = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${autoClipboardLinuxReleaseTag}/auto-clipboard_${autoClipboardLinuxVersion}_amd64.deb`;
const autoClipboardMacosVersion = '0.3.62';
const autoClipboardMacosReleaseTag = 'v0.3.62';
const macosFilename = `AutoClipboard-${autoClipboardMacosVersion}-macOS-unnotarized-preview.dmg`;
const giteeMacosDownloadUrl = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${autoClipboardMacosReleaseTag}/${macosFilename}`;
const githubMacosDownloadUrl = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${autoClipboardMacosReleaseTag}/${macosFilename}`;
const feedbackUrl = 'https://docs.qq.com/sheet/DQUFjTktqTmF0d1FG?tab=BB08J2';
const djiMicUrl = 'https://www.dji.com/cn/mic';
const djiMic2Url = 'https://www.dji.com/cn/mic-2';
const officialDriverUrl = 'https://www.wch.cn/downloads/CH343SER_EXE.html';
const pageFiles = ['index.html', 'shop.html', 'guide.html', 'skill.html'];
const allPublicPageFiles = [...pageFiles, 'account.html', 'old-page.html'];
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
const requiredProductImages = [
  'assets/images/product-hero.webp',
  'assets/images/product-macros.webp',
  'assets/images/product-status.webp',
  'assets/images/product-workflow.webp',
  'assets/images/product-ports.webp',
  'assets/images/software-main.webp',
  'assets/images/software-settings.webp',
  'assets/images/guide-hardware.jpg',
  'assets/images/macros.webp',
];
const replacementImages = new Map([
  ['assets/images/software-main.webp', { width: '1180', height: '620', bytes: 58_292 }],
  ['assets/images/software-settings.webp', { width: '1442', height: '852', bytes: 106_860 }],
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
  for (const path of [
    ...allPublicPageFiles,
    'styles.css',
    'script.js',
    'account.js',
    'admin.html',
    'admin.js',
    'account-bridge.html',
    'account-bridge.js',
    'account-config.js',
    'pixel-preview.html',
    'pixel-preview.css',
    'pixel-preview.js',
    'README.md',
    'assets/favicon.ico',
    'assets/favicon.svg',
    'assets/favicon-pixel.png',
    'assets/apple-touch-icon.png',
    'assets/autoclipboard-icon.png',
    'assets/images/pixel-hero.webp',
    'assets/vendor/cloudbase-3.7.1.min.js',
    'assets/vendor/cloudbase-3.7.1.min.js.LEGAL.txt',
    'assets/vendor/cloudbase-3.7.1.LICENSE.txt',
    'docs/account-desktop-auth-contract.md',
  ]) requireFile(path);
});

test('all pages expose the shared ZKO favicon', () => {
  for (const page of allPublicPageFiles) {
    const html = read(page);
    assert.match(html, /<link\s+rel="icon"\s+href="assets\/favicon\.ico(?:\?[^" ]+)?">/i);
    assert.match(html, /<link\s+rel="icon"\s+href="assets\/favicon\.svg(?:\?[^" ]+)?"\s+type="image\/svg\+xml">/i);
    assert.match(html, /<link\s+rel="apple-touch-icon"\s+href="assets\/apple-touch-icon\.png(?:\?[^" ]+)?">/i);
  }

  for (const page of buyerPageFiles) {
    const html = read(page);
    assert.match(html, /<link\s+rel="icon"\s+href="\.\.\/assets\/favicon\.ico(?:\?[^" ]+)?">/i);
    assert.match(html, /<link\s+rel="icon"\s+href="\.\.\/assets\/favicon\.svg(?:\?[^" ]+)?"\s+type="image\/svg\+xml">/i);
    assert.match(html, /<link\s+rel="apple-touch-icon"\s+href="\.\.\/assets\/apple-touch-icon\.png(?:\?[^" ]+)?">/i);
  }

  const favicon = read('assets/favicon.svg');
  assert.match(favicon, /shape-rendering="crispEdges"/);
  for (const color of ['#292756', '#fff8e8', '#ed7a3a', '#73cfc0']) assert.match(favicon, new RegExp(color, 'i'));
});

test('all public pages credit ZKO Lab and reserve site rights', () => {
  for (const page of allPublicPageFiles) {
    const html = read(page);
    assert.match(html, /Made by ZKO Lab/i, `${page} should credit ZKO Lab`);
    assert.match(html, /All Rights Reserved/i, `${page} should reserve site rights`);
  }
});

test('pixel homepage keeps a substantial hero crop and reveals more product on scroll', () => {
  const css = read('pixel-preview.css');
  const script = read('pixel-preview.js');
  assert.match(css, /min-height:\s*clamp\(760px,\s*74vw,\s*980px\)/);
  assert.match(css, /@media \(min-width:\s*1600px\)/);
  assert.match(css, /--hero-art-scale/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /object-position:\s*right top/);
  assert.match(script, /const isWideHero = \(\) => window\.innerWidth >= 1600/);
  assert.match(script, /const progress = Math\.min\(1, Math\.max\(0, -rect\.top/);
  assert.match(script, /requestAnimationFrame\(updateHeroArt\)/);
  assert.match(script, /1\.12 - progress \* 0\.1/);
});

test('home download station shows the current AutoClipboard app icon', () => {
  const html = read('index.html');
  assert.match(html, /<img[^>]+class="pixel-download__app-icon"[^>]+src="assets\/autoclipboard-icon\.png\?v=20260812-rgb8"/i);
  assert.ok(statSync(fileUrl('assets/autoclipboard-icon.png')).size > 5_000);
});

test('all pages expose the shared navigation destinations', () => {
  const sharedHrefs = ['index.html', 'shop.html', 'guide.html', 'skill.html', 'account.html'];

  for (const page of allPublicPageFiles) {
    const html = stripHtmlComments(read(page));
    const anchors = openingTags(html, 'a');

    for (const href of sharedHrefs) {
      assert.ok(
        anchors.some((tag) => attributeValue(tag, 'href') === href),
        `${page} should link to ${href}`,
      );
    }

    const purchaseAnchors = anchors.filter((tag) => hasAttribute(tag, 'data-purchase-link'));
    assert.ok(purchaseAnchors.length >= 1, `${page} should expose a purchase CTA`);
    for (const anchor of purchaseAnchors) {
      assert.equal(attributeValue(anchor, 'href'), purchaseUrl);
    }
  }
});

test('all pages expose a Gitee-first direct Windows download with GitHub backup', () => {
  for (const page of pageFiles) {
    const html = stripHtmlComments(read(page));
    const anchors = openingTags(html, 'a');
    assert.match(html, new RegExp(escapeRegExp(giteeReleaseUrl)), `${page} should link Gitee`);
    assert.match(html, new RegExp(escapeRegExp(downloadUrl)), `${page} should link GitHub`);
    const giteeDirectLinks = anchors.filter((tag) => hasAttribute(tag, 'data-windows-download-link'));
    assert.ok(giteeDirectLinks.length >= 1, `${page} should expose a direct Windows download`);
    for (const anchor of giteeDirectLinks) {
      assert.equal(attributeValue(anchor, 'href'), giteeWindowsDownloadUrl);
    }
  }

  const home = stripHtmlComments(read('index.html'));
  assert.match(home, /id=["']release-downloads["']/);
  const releaseButtons = openingTags(home, 'a').filter((tag) =>
    hasAttribute(tag, 'data-platform-recommendation-primary')
      || hasAttribute(tag, 'data-platform-recommendation-fallback'),
  );
  assert.equal(releaseButtons.length, 3, 'homepage should expose a top-level primary download plus release primary and fallback buttons');
  assert.deepEqual(
    new Set(releaseButtons.map((tag) => attributeValue(tag, 'href'))),
    new Set([giteeWindowsDownloadUrl, githubWindowsDownloadUrl]),
  );
  assert.equal(attributeValue(releaseButtons[0], 'href'), giteeWindowsDownloadUrl);
  assert.match(home, /国内用户优先使用 Gitee/);

  const guide = stripHtmlComments(read('guide.html'));
  const githubFallbacks = openingTags(guide, 'a').filter((tag) =>
    hasAttribute(tag, 'data-windows-download-fallback'),
  );
  assert.ok(githubFallbacks.length >= 1, 'guide should expose a GitHub direct-download fallback');
  for (const anchor of githubFallbacks) {
    assert.equal(attributeValue(anchor, 'href'), githubWindowsDownloadUrl);
  }
});

test('homepage exposes automatic recommendations plus every desktop platform', () => {
  const expectedDownloads = new Map([
    ['windows:gitee', { url: giteeWindowsDownloadUrl, filename: windowsFilename }],
    ['windows:github', { url: githubWindowsDownloadUrl, filename: windowsFilename }],
    ['macos:gitee', { url: giteeMacosDownloadUrl, filename: macosFilename }],
    ['macos:github', { url: githubMacosDownloadUrl, filename: macosFilename }],
    ['linux:gitee', { url: giteeLinuxDownloadUrl, filename: linuxFilename }],
    ['linux:github', { url: githubLinuxDownloadUrl, filename: linuxFilename }],
  ]);

  for (const page of ['index.html']) {
    const html = stripHtmlComments(read(page));
    const anchors = openingTags(html, 'a');
    assert.match(html, /data-platform-recommendation/);
    assert.match(html, /data-platform-recommendation-primary/);
    assert.match(html, /data-platform-recommendation-fallback/);
    assert.match(html, /未公证[^<]{0,40}(?:DMG|预览版)|DMG[^<]{0,40}未公证/);

    for (const [key, download] of expectedDownloads) {
      const [platform, source] = key.split(':');
      const matching = anchors.filter((tag) =>
        attributeValue(tag, 'data-platform-download') === platform
        && attributeValue(tag, 'data-download-source') === source,
      );
      assert.ok(matching.length >= 1, `${page} should expose ${platform} ${source}`);
      for (const anchor of matching) {
        assert.equal(attributeValue(anchor, 'href'), download.url);
        assert.equal(attributeValue(anchor, 'download'), download.filename);
        assert.equal(attributeValue(anchor, 'target'), undefined);
      }
    }

    for (const selector of ['data-platform-recommendation-primary', 'data-platform-recommendation-fallback']) {
      const recommendation = anchors.find((tag) => hasAttribute(tag, selector));
      assert.ok(recommendation, `${page} should expose ${selector}`);
      assert.equal(attributeValue(recommendation, 'download'), windowsFilename);
      assert.equal(attributeValue(recommendation, 'target'), undefined);
    }

    const archive = anchors.find((tag) => hasAttribute(tag, 'data-gitee-release-link'));
    assert.ok(archive, `${page} should retain a release archive link`);
    assert.equal(attributeValue(archive, 'target'), '_blank');
    assert.equal(attributeValue(archive, 'download'), undefined);
  }

  const legacyPreview = read('pixel-preview.html');
  assert.match(legacyPreview, /location\.replace\(`index\.html\$\{location\.search\}\$\{location\.hash\}`\)/);
  assert.match(legacyPreview, /rel="canonical" href="https:\/\/zkolab\.com\/"/);
});

test('download recommendation detects Windows, macOS, and Linux without hiding manual choices', () => {
  const script = read('script.js');
  const cases = [
    { platform: 'Win32', expectedKey: 'windows', expectedName: 'Windows', expectedUrl: giteeWindowsDownloadUrl },
    { platform: 'MacIntel', expectedKey: 'macos', expectedName: 'macOS', expectedUrl: giteeMacosDownloadUrl },
    { platform: 'Linux x86_64', expectedKey: 'linux', expectedName: 'Ubuntu / Linux', expectedUrl: giteeLinuxDownloadUrl },
  ];

  for (const testCase of cases) {
    const panel = { setAttribute(name, value) { this[name] = value; } };
    const eyebrow = { textContent: '' };
    const title = { textContent: '' };
    const detail = { textContent: '' };
    const createDownloadLink = () => ({
      href: '',
      textContent: '',
      target: '_blank',
      removeAttribute(name) { delete this[name]; },
    });
    const primary = createDownloadLink();
    const fallback = createDownloadLink();
    const selectors = new Map([
      ['[data-platform-recommendation]', [panel]],
      ['[data-platform-recommendation-eyebrow]', [eyebrow]],
      ['[data-platform-recommendation-title]', [title]],
      ['[data-platform-recommendation-detail]', [detail]],
      ['[data-platform-recommendation-primary]', [primary]],
      ['[data-platform-recommendation-fallback]', [fallback]],
    ]);
    const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    const document = {
      documentElement: { classList },
      querySelectorAll(selector) { return selectors.get(selector) ?? []; },
      querySelector() { return null; },
      addEventListener() {},
    };
    const context = {
      document,
      navigator: { platform: testCase.platform, userAgent: testCase.platform },
      matchMedia() { return { matches: true }; },
      addEventListener() {},
      requestAnimationFrame(callback) { callback(); return 1; },
      IntersectionObserver: undefined,
      console,
    };
    context.window = context;
    context.globalThis = context;
    runInNewContext(`${script}\n;globalThis.__detectedPlatform = detectDownloadPlatform();`, context);

    assert.equal(context.__detectedPlatform, testCase.expectedKey);
    assert.equal(panel['data-detected-platform'], testCase.expectedKey);
    assert.match(eyebrow.textContent, new RegExp(escapeRegExp(testCase.expectedName)));
    assert.match(title.textContent, new RegExp(escapeRegExp(testCase.expectedName)));
    assert.equal(primary.href, testCase.expectedUrl);
    assert.ok(primary.download);
    assert.equal(primary.target, undefined);
    assert.match(primary.textContent, /Gitee/);
    assert.match(fallback.href, /^https:\/\/github\.com\//);
    assert.equal(fallback.download, primary.download);
    assert.equal(fallback.target, undefined);
  }
});

test('external links use safe new-window attributes', () => {
  for (const page of allPublicPageFiles) {
    const html = stripHtmlComments(read(page));
    const externalAnchors = openingTags(html, 'a').filter((tag) =>
      /^https:\/\//.test(attributeValue(tag, 'href') ?? ''),
    );
    assert.ok(externalAnchors.length > 0, `${page} should expose external links`);

    for (const anchor of externalAnchors) {
      const isDirectInstaller = [
        'data-windows-download-link',
        'data-windows-download-fallback',
        'data-platform-download',
        'data-platform-recommendation-primary',
        'data-platform-recommendation-fallback',
      ].some((attribute) => hasAttribute(anchor, attribute));

      if (isDirectInstaller) {
        assert.equal(attributeValue(anchor, 'target'), undefined);
        assert.ok(attributeValue(anchor, 'download'), `${page} direct installers should name the downloaded file`);
        continue;
      }

      assert.equal(attributeValue(anchor, 'target'), '_blank');
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noopener(?:\s|$)/);
      assert.match(attributeValue(anchor, 'rel') ?? '', /(?:^|\s)noreferrer(?:\s|$)/);
    }
  }
});

test('pages have unique titles, main landmarks, and skip links', () => {
  const titles = [];
  for (const page of allPublicPageFiles) {
    const html = stripHtmlComments(read(page));
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    assert.ok(title, `${page} should have a title`);
    titles.push(title);
    assert.match(html, /<main\b[^>]*id="main-content"/i);
    assert.match(html, /<a\b[^>]*class="skip-link"[^>]*href="#main-content"/i);
    assert.match(html, /<footer\b[^>]*class="(?:site-footer|pixel-footer)"/i);
  }
  assert.equal(new Set(titles).size, allPublicPageFiles.length, 'page titles should be unique');
});

test('account, guide, and AI configuration routes use the shared pixel theme', () => {
  const themedPages = [
    ['account.html', '账户'],
    ['guide.html', '使用说明'],
    ['skill.html', 'AI 一键配置'],
  ];

  for (const [page, currentLabel] of themedPages) {
    const html = stripHtmlComments(read(page));
    assert.match(html, /<body\b[^>]*class="[^"]*pixel-site[^"]*pixel-subpage[^"]*"/i);
    assert.match(html, /<link\b[^>]*href="pixel-preview\.css\?v=20260812-theme-deck-v1"[^>]*>/i);
    assert.match(html, /<script\b[^>]*src="pixel-preview\.js\?v=20260812-theme-deck-v1"[^>]*>/i);
    assert.match(html, /<header\b[^>]*class="pixel-header"/i);
    assert.match(html, /<footer\b[^>]*class="pixel-footer"/i);
    assert.match(html, new RegExp(`<a\\b[^>]*aria-current="page"[^>]*>${escapeRegExp(currentLabel)}<\\/a>|<a\\b[^>]*aria-current="page"[^>]*data-header-account`, 'i'));
  }

  const home = stripHtmlComments(read('index.html'));
  assert.match(home, /href="guide\.html"[^>]*>说明<\/a>/i);
  assert.match(home, /href="skill\.html"/i);
  assert.match(home, /href="account\.html"/i);
});

test('account page exposes complete registration, email and username login, profile settings, billing, and desktop authorization', () => {
  const html = stripHtmlComments(read('account.html'));
  const source = `${html}\n${read('account.js')}`;
  for (const phrase of [
    '公开内容无需登录',
    '登录 / 注册',
    '注册账号',
    '设置密码',
    '发送注册验证码',
    '邮箱登录',
    '获取登录验证码',
    '验证并登录',
    '账号登录',
    '个人资料',
    '选择头像',
    '安全与登录',
    '登录 AutoClipboard',
    '当前余额',
    '充值金额',
    '支付宝',
    '微信支付',
    '当前没有桌面端登录请求',
    '允许并返回 AutoClipboard',
    '一次性授权码',
    '高级版权益',
    '生成购买绑定码',
    '前往闲鱼购买',
  ]) {
    assert.match(source, new RegExp(escapeRegExp(phrase)), `account page should mention ${phrase}`);
  }
  assert.match(html, /data-auth-form/);
  assert.match(html, /data-profile-form/);
  assert.match(html, /data-avatar-input/);
  assert.match(html, /data-recharge-form/);
  assert.match(html, /data-authorize-desktop/);
  assert.match(html, /data-create-binding/);
  assert.match(html, /assets\/vendor\/cloudbase-3\.7\.1\.min\.js/);
  assert.ok((html.match(/type=["']password["']/gi) || []).length >= 3, 'login and registration should collect CloudBase-managed passwords');
});

test('admin page manages manual orders, entitlements, and write-only provider secrets', () => {
  const html = stripHtmlComments(read('admin.html'));
  const script = read('admin.js');
  for (const phrase of ['闲鱼订单人工发放', '客户与权益', '腾讯云实时语音识别', 'DeepSeek 文本润色', '页面永不回显']) {
    assert.match(html, new RegExp(escapeRegExp(phrase)));
  }
  for (const action of ['adminOverview', 'adminGrantManualOrder', 'adminAdjustEntitlement', 'adminSetProviderConfig']) {
    assert.match(script, new RegExp(`action:\\s*['"]${action}['"]`));
  }
  assert.ok((html.match(/type="password"/g) || []).length >= 3);
  assert.match(script, /input\[type="password"\]/);
  assert.doesNotMatch(script, /console\.(?:log|debug).*secret/i);
  assert.doesNotMatch(html, /value="(?:sk-|AKID)[^"]+"/i);
});

test('account configuration is public-only and pins the CloudBase integration contract', () => {
  const config = read('account-config.js');
  assert.match(config, /envId:\s*['"]zkolab-dev-d8gzrr41k9b933d9e['"]/);
  assert.match(config, /region:\s*['"]ap-shanghai['"]/);
  assert.match(config, /accountApi:\s*['"]zko-account-api['"]/);
  assert.match(config, /desktopAuthUrl:\s*['"]https:\/\/zkolab-dev-[^'"]+\/desktop-auth['"]/);
  assert.match(config, /hostedAccountUrl:\s*['"]https:\/\/zkolab-dev-[^'"]+\.tcloudbaseapp\.com\/account\.html['"]/);
  assert.match(config, /hostedBridgeUrl:\s*['"]https:\/\/zkolab-dev-[^'"]+\.tcloudbaseapp\.com\/account-bridge\.html['"]/);
  assert.match(config, /websiteUrl:\s*['"]https:\/\/zkolab\.com\/['"]/);
  assert.match(config, /protocol:\s*['"]autoclipboard:['"]/);
  assert.match(config, /hostname:\s*['"]auth['"]/);
  assert.match(config, /pathname:\s*['"]\/callback['"]/);
  assert.doesNotMatch(config, /api[_-]?key|secret|private[_-]?key|refresh[_-]?token/i);
});

test('account script keeps tokens out of desktop callbacks and fails closed around payments', () => {
  const script = read('account.js');
  assert.match(script, /auth\.signInWithOtp\(/);
  assert.match(script, /auth\.signInWithPassword\(/);
  assert.match(script, /auth\.getVerification\(/);
  assert.match(script, /auth\.verify\(/);
  assert.match(script, /auth\.signUp\(\{/);
  assert.match(script, /username:\s*registered\.username/);
  assert.match(script, /password:\s*registered\.password/);
  assert.doesNotMatch(script, /target:\s*['"]NOT_USER['"]/);
  assert.match(script, /resendDelaySeconds\s*=\s*60/);
  assert.match(script, /validitySeconds\s*=\s*600/);
  assert.match(script, /还需要等待 \$\{resendRemaining\} 秒/);
  assert.match(script, /resetPasswordForEmail/);
  assert.match(script, /updateUsername|auth\.updateUser/);
  assert.match(script, /action:\s*['"]updateProfile['"]/);
  assert.match(script, /verifyOtp/);
  assert.match(script, /config\.functions\.accountApi/);
  assert.match(script, /action:\s*['"]authorizeDesktop['"]/);
  assert.match(script, /new URL\(['"]autoclipboard:\/\/auth\/callback['"]\)/);
  assert.match(script, /callback\.searchParams\.set\(['"]code['"]/);
  assert.match(script, /callback\.searchParams\.set\(['"]state['"]/);
  assert.match(script, /codeChallenge/);
  assert.match(script, /deviceInstanceHash/);
  assert.doesNotMatch(script, /searchParams\.set\([^\n]*(?:access|refresh)[_-]?token/i);
});

test('account page explains verification resend delay and validity', () => {
  const html = stripHtmlComments(read('account.html'));
  assert.ok((html.match(/有效期 600 秒/g) || []).length >= 2);
  assert.ok((html.match(/等待 60 秒/g) || []).length >= 2);
  assert.match(html, /data-email-code-timer/);
  assert.match(html, /data-register-code-timer/);
});

test('every public page exposes the upper-right account avatar area', () => {
  for (const page of allPublicPageFiles) {
    const html = stripHtmlComments(read(page));
    assert.match(html, /data-header-account/);
    assert.match(html, /data-header-account-image/);
    assert.match(html, /data-header-account-name/);
  }
  const shared = read('script.js');
  assert.match(shared, /ZKO_ACCOUNT_HEADER/);
  assert.match(shared, /_zko_profile/);
  assert.match(shared, /hostedBridgeUrl/);
});

test('account bridge returns sanitized profile state without tokens', () => {
  const bridge = read('account-bridge.js');
  assert.match(bridge, /zko:account-profile/);
  assert.match(bridge, /zkolab\.com/);
  assert.doesNotMatch(bridge, /access[_-]?token|refresh[_-]?token/i);
});

test('vendored CloudBase SDK is local, pinned, and carries license notices', () => {
  assert.ok(statSync(fileUrl('assets/vendor/cloudbase-3.7.1.min.js')).size > 500_000);
  assert.ok(statSync(fileUrl('assets/vendor/cloudbase-3.7.1.LICENSE.txt')).size > 10_000);
  assert.ok(statSync(fileUrl('assets/vendor/cloudbase-3.7.1.min.js.LEGAL.txt')).size > 500);
  assert.match(read('assets/vendor/cloudbase-3.7.1.LICENSE.txt'), /Apache License/);
});

test('homepage presents flagship product storytelling', () => {
  const html = stripHtmlComments(read('index.html'));
  for (const id of ['overview', 'manifesto-title', 'quests', 'gallery', 'release-downloads']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `homepage should expose #${id}`);
  }
  assert.match(html, /把 AI 工作流握在手里/);
  assert.match(html, /AI, MADE PHYSICAL/);
  assert.match(html, /四枚实体宏键/);
  assert.match(html, /Agent 状态/);
  assert.match(html, /AutoClipboard/);
  assert.match(html, /pixel-hero\.webp/);
  assert.match(html, /product-macros\.webp/);
  assert.match(html, /product-status\.webp/);
  assert.match(html, /old-page\.html/);
});

test('current public surfaces use the ZKO 字库 brand name', () => {
  const currentFiles = [
    ...allPublicPageFiles,
    ...buyerPageFiles,
    'pixel-preview.html',
    'script.js',
    'assets/favicon.svg',
  ];
  const combined = currentFiles.map((file) => read(file)).join('\n');
  assert.match(combined, /ZKO 字库/);
  assert.match(read('index.html'), /字库控制台/);
  assert.match(read('script.js'), /ZKO 字库一键配置/);
  assert.doesNotMatch(combined, /苍虬|苍穹/);
});

test('shared account header uses the pixel favicon when no custom avatar exists', () => {
  const script = read('script.js');
  assert.match(script, /assets\/favicon-pixel\.png\?v=20260811-pixel/);
  assert.match(script, /image\.dataset\.defaultAvatar/);
  assert.match(script, /image\.src = value\.avatarUrl \|\| defaultAvatarUrl/);
});

test('classic homepage remains available as a separate archived page', () => {
  const html = stripHtmlComments(read('old-page.html'));
  assert.match(html, /<title>字库 ZKO · 经典版主页<\/title>/);
  assert.match(html, /href=["']index\.html["'][^>]*>像素主页<\/a>/);
  assert.match(html, /href=["']old-page\.html["'][^>]*aria-current=["']page["']/);
  for (const id of ['overview', 'macros', 'status', 'software', 'compatibility', 'support']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `classic homepage should preserve #${id}`);
  }
  assert.match(html, /product-hero\.webp/);
  assert.match(html, /software-main\.webp/);
});

test('shop presents preorder colors and reviewed microphone compatibility', () => {
  const html = stripHtmlComments(read('shop.html'));
  assert.match(html, /class=["'][^"']*pixel-site[^"']*pixel-shop/);
  assert.match(html, /shop-pixel\.css\?v=20260812-shop-pixel-v1/);
  assert.match(html, /pixel-preview\.js\?v=20260812-theme-deck-v1/);
  assert.match(html, /装备你的/);
  assert.match(html, /玩家配色/);
  assert.match(html, /STORE SYSTEM ONLINE/);
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

test('pixel shop stylesheet defines responsive player-store layouts', () => {
  const css = read('shop-pixel.css');
  for (const selector of [
    '.shop-pixel-hero',
    '.shop-signal-strip',
    '.shop-gallery-grid',
    '.shop-color-console',
    '.shop-feedback-section',
    '.shop-mic-grid',
    '.shop-package-section',
  ]) assert.match(css, new RegExp(escapeRegExp(selector)));
  assert.match(css, /@media \(max-width:\s*1080px\)/);
  assert.match(css, /@media \(max-width:\s*700px\)/);
});

test('shop links the Tencent Docs feedback area without claiming direct submission', () => {
  const html = stripHtmlComments(read('shop.html'));
  assert.match(html, /告诉我们你想要的搭配/);
  assert.match(html, new RegExp(escapeRegExp(feedbackUrl)));
  assert.match(html, /实际编辑与保存能力由腾讯文档权限控制/);
  assert.doesNotMatch(html, /提交成功|已保存到腾讯文档/);
});

test('guide explains supported operating systems and package choices', () => {
  const html = stripHtmlComments(read('guide.html'));
  const platformCards = html.match(/<article class=["']platform-status-card["'][^>]*>[\s\S]*?<\/article>/gi) ?? [];
  assert.equal(platformCards.length, 3, 'guide should expose one status card per platform');

  const windowsCard = platformCards.find((card) => /<h3>Windows<\/h3>/i.test(card));
  const ubuntuCard = platformCards.find((card) => /<h3>Ubuntu<\/h3>/i.test(card));
  const macCard = platformCards.find((card) => /<h3>macOS<\/h3>/i.test(card));
  assert.ok(windowsCard, 'guide should expose a Windows status card');
  assert.ok(ubuntuCard, 'guide should expose an Ubuntu status card');
  assert.ok(macCard, 'guide should expose a macOS status card');
  assert.match(windowsCard, /support-badge--stable[^>]*>成熟测试/);
  assert.match(ubuntuCard, /support-badge--stable[^>]*>成熟测试/);
  assert.match(macCard, /support-badge--testing[^>]*>测试中/);
  assert.doesNotMatch(macCard, /成熟测试/, 'macOS must not be described as mature');
  assert.match(html, /AutoClipboardSetup-&lt;version&gt;\.exe/);
  assert.match(html, /auto-clipboard_&lt;version&gt;_&lt;arch&gt;\.deb/);
  assert.match(html, /AutoClipboard-&lt;version&gt;-macOS\.dmg/);
  assert.match(html, /CH343[\s\S]{0,220}Windows/);
});

test('guide presents a plain-language beginner flow and symptom-first help', () => {
  const html = stripHtmlComments(read('guide.html'));
  const quickStart = html.match(/<ol class=["']step-list["'][^>]*>([\s\S]*?)<\/ol>/i)?.[1] ?? '';
  const steps = quickStart.match(/<li><span>\d<\/span>[\s\S]*?<\/li>/gi) ?? [];
  assert.equal(steps.length, 6, 'quick start should contain exactly six steps');
  const successSignals = [
    '下载完成',
    '应用列表里看到 AutoClipboard',
    '小屏亮起',
    '已连接',
    'LINK',
    '能产生输入',
  ];
  for (const [index, signal] of successSignals.entries()) {
    assert.match(steps[index], new RegExp(escapeRegExp(signal)), `step ${index + 1} should explain what success looks like`);
  }
  assert.doesNotMatch(steps[1], /启动 AutoClipboard/);
  assert.match(steps[5], /能产生输入[\s\S]*再启动 AutoClipboard/);
  for (const phrase of [
    '第一次使用，从这里开始',
    '选择你的系统',
    '6 步完成首次使用',
    'CommunistKB-XXXX',
    'BLE Hosts',
    '3 个主机槽位',
    '只在旧电脑上点击“断开”不会自动切换手柄槽位',
    '找到目标电脑对应的',
    'SAVED',
    'EMPTY',
    '120 秒内',
    'WAIT → LINK',
    '开机时按住中键约 5 秒会清空全部槽位',
    '电脑仍可能保留旧密钥',
    '清空手柄槽位后，macOS 显示 PAIR 仍连接失败',
    '忽略此设备',
    '从另一台电脑切换后，新电脑连接不上',
    'PAIR',
    'LINK',
    'WAIT',
    '在纯文本输入框中测试',
    '基础蓝牙宏不依赖 AutoClipboard',
    '宏键能输入，但 AutoClipboard 显示未连接',
    'Right Alt',
    'Ctrl+V',
    'Agent 状态（编程助手当前处于工作、等待或完成等状态）',
    '惯性测量单元（IMU）',
    'Windows CH343 官方驱动',
  ]) {
    assert.match(html, new RegExp(escapeRegExp(phrase)), `guide should mention ${phrase}`);
  }
  for (const id of ['platforms', 'quick-start', 'hardware', 'bluetooth', 'multi-host', 'controls', 'software', 'troubleshooting']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `guide should expose #${id}`);
  }
  assert.match(html, new RegExp(escapeRegExp(officialDriverUrl)));
});

test('guide maps the approved wheel and macro figures to their matching explanations', () => {
  const html = stripHtmlComments(read('guide.html'));
  const controls = html.match(/<section id=["']controls["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
  const profileCopy = '默认的 Vibe Coding Profile 将四枚按键设置为 Right Alt、Enter、Ctrl+V 和 Ctrl+Alt+0。这四个按键都可以在 AutoClipboard 中重新配置。';

  assert.match(controls, /波轮与小屏操作[\s\S]*data-source-figure=["']21\.png["'][\s\S]*assets\/images\/guide-hardware\.jpg/);
  assert.match(controls, new RegExp(escapeRegExp(profileCopy)));
  assert.match(controls, /data-source-figure=["']12\.png["'][\s\S]*assets\/images\/macros\.webp/);
  assert.doesNotMatch(controls, />[^<]*figures\/(?:21|12)\.png[^<]*</, 'source filenames should not appear in visitor-facing copy');
  assert.ok(
    controls.indexOf('guide-hardware.jpg') < controls.indexOf(profileCopy)
      && controls.indexOf(profileCopy) < controls.indexOf('macros.webp'),
    'each explanation should immediately lead into its matching approved figure',
  );
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
  const pageHtml = [...pageFiles, 'old-page.html'].map((page) => stripHtmlComments(read(page))).join('\n');

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

test('shop presents the current AutoClipboard interface', () => {
  const html = read('shop.html');
  assert.match(html, /AUTOCLIPBOARD_0\.3\.67\.EXE/);
  assert.match(html, /0\.3\.67 设备仪表盘、Profile、宏按键、IMU 与固件维护/);
  assert.doesNotMatch(html, /带编号说明的 AutoClipboard/);
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

test('homepage hero replaces third-party marks with a disclosed ZKO visual composite', () => {
  const html = stripHtmlComments(read('index.html'));
  assert.match(html, /pixel-hero\.webp\?v=20260812-white-zko-mic-mark/);
  assert.match(html, /麦克风仅作搭配示意，不随产品销售/);
  assert.match(html, /白色 ZKO 标志为视觉合成/);
  assert.match(html, /不代表该麦克风由 ZKO 生产/);
  assert.doesNotMatch(html, />\s*(?:DJI|大疆)\s*</i);
});

test('styles define flagship layouts, responsive behavior, focus, and reduced motion', () => {
  const css = read('styles.css').replace(/\/\*[^]*?\*\//g, '');
  const pixelCss = read('pixel-preview.css').replace(/\/\*[^]*?\*\//g, '');
  for (const selector of ['.global-header', '.hero', '.skill-hero', '.story-panel', '.product-gallery', '.guide-layout', '.site-footer']) {
    assert.match(css, new RegExp(escapeRegExp(selector)));
  }
  assert.match(css, /@media\b[^{}]*\(\s*max-width\s*:/i);
  assert.match(css, /@media\b[^{}]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  assert.match(css, /:focus-visible[^{}]*\{[^}]*\b(?:outline|box-shadow)\s*:/i);
  for (const selector of ['.pixel-header', '.pixel-quickstart', '.pixel-hero', '.pixel-manifesto', '.pixel-quest-grid', '.pixel-download', '.pixel-footer']) {
    assert.match(pixelCss, new RegExp(escapeRegExp(selector)));
  }
  assert.match(pixelCss, /@media\b[^{}]*\(\s*max-width\s*:/i);
  assert.match(pixelCss, /@media\b[^{}]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
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
  assert.match(
    script,
    new RegExp(`\\bconst\\s+AUTOCLIPBOARD_WINDOWS_VERSION\\s*=\\s*["']${escapeRegExp(autoClipboardWindowsVersion)}["']`),
  );
  assert.match(
    script,
    new RegExp(`\\bconst\\s+AUTOCLIPBOARD_WINDOWS_RELEASE_TAG\\s*=\\s*["']${escapeRegExp(autoClipboardWindowsReleaseTag)}["']`),
  );

  const purchaseLinks = [{ href: 'old://one' }, { href: 'old://two' }];
  const downloadLinks = [{ href: 'old://download' }];
  const giteeLinks = [{ href: 'old://gitee' }];
  const createDownloadLink = (href) => ({
    href,
    target: '_blank',
    removeAttribute(name) { delete this[name]; },
  });
  const giteeWindowsLinks = [createDownloadLink('old://windows-gitee')];
  const githubWindowsLinks = [createDownloadLink('old://windows-github')];
  const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  const document = {
    documentElement: { classList },
    querySelectorAll(selector) {
      if (selector === '[data-purchase-link]') return purchaseLinks;
      if (selector === '[data-download-link]') return downloadLinks;
      if (selector === '[data-gitee-release-link]') return giteeLinks;
      if (selector === '[data-windows-download-link]') return giteeWindowsLinks;
      if (selector === '[data-windows-download-fallback]') return githubWindowsLinks;
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
  runInNewContext(`${script}\n;globalThis.__urls = { PURCHASE_URL, DOWNLOAD_URL, GITEE_RELEASE_URL, AUTOCLIPBOARD_WINDOWS_VERSION, AUTOCLIPBOARD_WINDOWS_RELEASE_TAG, GITEE_WINDOWS_DOWNLOAD_URL, GITHUB_WINDOWS_DOWNLOAD_URL };`, context);

  assert.equal(context.__urls.PURCHASE_URL, purchaseUrl);
  assert.equal(context.__urls.DOWNLOAD_URL, downloadUrl);
  assert.equal(context.__urls.GITEE_RELEASE_URL, giteeReleaseUrl);
  assert.equal(context.__urls.AUTOCLIPBOARD_WINDOWS_VERSION, autoClipboardWindowsVersion);
  assert.equal(context.__urls.AUTOCLIPBOARD_WINDOWS_RELEASE_TAG, autoClipboardWindowsReleaseTag);
  assert.equal(context.__urls.GITEE_WINDOWS_DOWNLOAD_URL, giteeWindowsDownloadUrl);
  assert.equal(context.__urls.GITHUB_WINDOWS_DOWNLOAD_URL, githubWindowsDownloadUrl);
  assert.deepEqual(purchaseLinks.map((link) => link.href), [purchaseUrl, purchaseUrl]);
  assert.deepEqual(downloadLinks.map((link) => link.href), [downloadUrl]);
  assert.deepEqual(giteeLinks.map((link) => link.href), [giteeReleaseUrl]);
  assert.deepEqual(giteeWindowsLinks.map((link) => link.href), [giteeWindowsDownloadUrl]);
  assert.deepEqual(githubWindowsLinks.map((link) => link.href), [githubWindowsDownloadUrl]);
  assert.deepEqual(giteeWindowsLinks.map((link) => link.download), [windowsFilename]);
  assert.deepEqual(githubWindowsLinks.map((link) => link.download), [windowsFilename]);
  assert.equal(giteeWindowsLinks[0].target, undefined);
  assert.equal(githubWindowsLinks[0].target, undefined);
});

test('homepage links the prominent Agent install flow and Skill page keeps it copyable', async () => {
  const home = stripHtmlComments(read('index.html'));
  const skill = stripHtmlComments(read('skill.html'));
  const skillPromptIndex = home.indexOf('data-copy-install="agent-prompt"');
  const manualDownloadIndex = home.indexOf('data-platform-recommendation-primary');
  const apiPromptIndex = home.indexOf('data-copy-install="api-prompt"');
  assert.match(home, /复制一句话/);
  assert.match(home, /有 Agent/);
  assert.match(home, /通常不需要你先手动下载安装包/);
  assert.match(home, /没有 Agent？手动下载/);
  assert.match(home, /data-platform-recommendation-primary/);
  assert.match(home, /data-copy-install=["']api-prompt["']/);
  assert.match(home, /data-copy-install=["']agent-prompt["']/);
  assert.ok(skillPromptIndex >= 0 && skillPromptIndex < manualDownloadIndex, 'Agent prompt should appear before manual download');
  assert.ok(manualDownloadIndex < apiPromptIndex, 'manual download should appear before optional API setup');
  assert.match(home, /复制给我的 Agent/);
  assert.match(home, /data-copy-status/);
  assert.match(home, /href=["']skill\.html["']/);
  assert.match(read('script.js'), /'api-prompt'/);
  assert.match(read('script.js'), /不要让我把真实 API Key 发到聊天里/);
  assert.match(skill, /zko-ai-coding-handle@zko-lab/);
  assert.match(skill, /--agent '\*' -g -y --copy/);
  assert.match(skill, /Gitee 国内源/);

  let clickHandler;
  let copiedText = '';
  const button = {
    dataset: { copyInstall: 'agent-prompt' },
    textContent: '复制给 Codex',
    addEventListener(type, callback) { if (type === 'click') clickHandler = callback; },
  };
  const status = { textContent: '' };
  const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  const document = {
    documentElement: { classList },
    querySelectorAll(selector) {
      if (selector === '[data-copy-install]') return [button];
      if (selector === '[data-copy-status]') return [status];
      return [];
    },
    querySelector() { return null; },
    addEventListener() {},
  };
  const context = {
    document,
    navigator: { clipboard: { async writeText(text) { copiedText = text; } } },
    matchMedia() { return { matches: true }; },
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); return 1; },
    IntersectionObserver: undefined,
    console,
  };
  context.window = context;
  context.globalThis = context;
  runInNewContext(read('script.js'), context);
  await clickHandler();

  assert.match(copiedText, /codex plugin marketplace add https:\/\/gitee\.com/);
  assert.match(copiedText, /npx skills add https:\/\/gitee\.com\/shan-yujun\/Communist-Manifesto-Releases\.git/);
  assert.match(copiedText, /Lijinzh\/Communist-Manifesto-Releases/);
  assert.equal(button.textContent, '已复制，粘贴给 Agent');
  assert.match(status.textContent, /安装内容已复制/);
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

test('buyer guide files exist without being linked from public pages', () => {
  for (const path of [...buyerPageFiles, ...buyerAssetFiles]) requireFile(path);

  for (const page of pageFiles) {
    assert.doesNotMatch(read(page), new RegExp(escapeRegExp(buyerKitDir)));
  }

  if (existsSync(fileUrl('robots.txt'))) {
    assert.doesNotMatch(read('robots.txt'), new RegExp(escapeRegExp(buyerKitDir)));
  }
});

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

  const toolCards = [...html.matchAll(/<article class="tool-card"[^>]*>([^]*?)<\/article>/gi)];
  assert.equal(toolCards.length, 11);
  for (const [, card] of toolCards) {
    assert.match(card, /<strong>上手：<\/strong>/);
    assert.match(card, /<strong>第一次任务：<\/strong>/);
    assert.match(card, /<strong>成功标志：<\/strong>/);
    assert.match(card, /href="https:\/\//);
  }
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
    'Receiving Code Review',
    'Finishing a Development Branch',
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

  const firstProject = html.match(/<section class="buyer-section" id="first-project"[^>]*>([^]*?)<\/section>/i)?.[1] ?? '';
  const workflowSteps = [...firstProject.matchAll(/<li><span>\d<\/span><div>([^]*?)<\/div><\/li>/gi)];
  assert.equal(workflowSteps.length, 8);
  for (const [, step] of workflowSteps) {
    assert.match(step, /class="copy-block"/);
    assert.match(step, /<strong>你需要确认：<\/strong>/);
    assert.match(step, /<strong>成功标志：<\/strong>/);
    assert.match(step, /<strong>下一步：<\/strong>/);
  }
});

test('buyer guide articles provide an explicit return-to-top link', () => {
  for (const page of buyerPageFiles.slice(1)) {
    assert.match(read(page), /<a[^>]+href="#main-content"[^>]*>返回顶部<\/a>/i);
  }
});

test('voice guide covers only the approved OpenLess and Typeless products', () => {
  const html = stripHtmlComments(read(`${buyerKitDir}/openless-typeless.html`));
  for (const phrase of [
    'OpenLess',
    'Typeless',
    'macOS / Windows / Linux',
    '第一次语音转文字',
    '麦克风权限',
    '快捷键冲突',
    '字库手柄',
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

test('buyer pages use safe official links and contain no live secrets', () => {
  const combined = buyerPageFiles.map((page) => stripHtmlComments(read(page))).join('\n');
  for (const page of buyerPageFiles) {
    const externalAnchors = openingTags(read(page), 'a').filter((tag) =>
      /^https:\/\//.test(attributeValue(tag, 'href') ?? ''),
    );
    assert.ok(externalAnchors.length > 0, `${page} should expose official external links`);
    for (const anchor of externalAnchors) {
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
