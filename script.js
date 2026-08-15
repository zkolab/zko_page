const PURCHASE_URL = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';
const DOWNLOAD_URL = 'https://github.com/Lijinzh/Communist-Manifesto-Releases';
const GITEE_RELEASE_URL = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';
const AUTOCLIPBOARD_WINDOWS_VERSION = '0.3.65';
const AUTOCLIPBOARD_WINDOWS_RELEASE_TAG = 'v0.3.65';
const GITEE_WINDOWS_DOWNLOAD_URL = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_WINDOWS_RELEASE_TAG}/AutoClipboardSetup-${AUTOCLIPBOARD_WINDOWS_VERSION}.exe`;
const GITHUB_WINDOWS_DOWNLOAD_URL = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_WINDOWS_RELEASE_TAG}/AutoClipboardSetup-${AUTOCLIPBOARD_WINDOWS_VERSION}.exe`;
const AUTOCLIPBOARD_LINUX_VERSION = '0.3.65';
const AUTOCLIPBOARD_LINUX_RELEASE_TAG = 'v0.3.65';
const AUTOCLIPBOARD_LINUX_FILENAME = `auto-clipboard_${AUTOCLIPBOARD_LINUX_VERSION}_amd64.deb`;
const GITEE_LINUX_DOWNLOAD_URL = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_LINUX_RELEASE_TAG}/${AUTOCLIPBOARD_LINUX_FILENAME}`;
const GITHUB_LINUX_DOWNLOAD_URL = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_LINUX_RELEASE_TAG}/${AUTOCLIPBOARD_LINUX_FILENAME}`;
const AUTOCLIPBOARD_MACOS_VERSION = '0.3.62';
const AUTOCLIPBOARD_MACOS_RELEASE_TAG = 'v0.3.62';
const AUTOCLIPBOARD_MACOS_FILENAME = `AutoClipboard-${AUTOCLIPBOARD_MACOS_VERSION}-macOS-unnotarized-preview.dmg`;
const GITEE_MACOS_DOWNLOAD_URL = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_MACOS_RELEASE_TAG}/${AUTOCLIPBOARD_MACOS_FILENAME}`;
const GITHUB_MACOS_DOWNLOAD_URL = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_MACOS_RELEASE_TAG}/${AUTOCLIPBOARD_MACOS_FILENAME}`;
const AUTOCLIPBOARD_PLATFORM_DOWNLOADS = Object.freeze({
  windows: {
    name: 'Windows',
    version: AUTOCLIPBOARD_WINDOWS_VERSION,
    filename: `AutoClipboardSetup-${AUTOCLIPBOARD_WINDOWS_VERSION}.exe`,
    format: 'EXE 安装包',
    detail: 'Windows 10 / 11 · 约 48.6 MB',
    gitee: GITEE_WINDOWS_DOWNLOAD_URL,
    github: GITHUB_WINDOWS_DOWNLOAD_URL,
  },
  macos: {
    name: 'macOS',
    version: AUTOCLIPBOARD_MACOS_VERSION,
    filename: AUTOCLIPBOARD_MACOS_FILENAME,
    format: 'DMG 未公证预览版',
    detail: 'macOS 预览版 · 约 53.5 MB',
    gitee: GITEE_MACOS_DOWNLOAD_URL,
    github: GITHUB_MACOS_DOWNLOAD_URL,
  },
  linux: {
    name: 'Ubuntu / Linux',
    version: AUTOCLIPBOARD_LINUX_VERSION,
    filename: AUTOCLIPBOARD_LINUX_FILENAME,
    format: 'DEB x86_64',
    detail: 'Ubuntu / Debian x86_64 · 约 78.4 MB',
    gitee: GITEE_LINUX_DOWNLOAD_URL,
    github: GITHUB_LINUX_DOWNLOAD_URL,
  },
});
const INSTALL_COPY = {
  'api-prompt': `请帮我安全地配置当前电脑上的 AI API 使用环境：
1. 先只读检查操作系统、已安装的 Codex / Claude Code / Gemini CLI / OpenCode，以及是否已经安装 CC-Switch；不要覆盖现有配置。
2. 如果没有 CC-Switch，请只从 https://ccswitch.io 或 https://github.com/farion1231/cc-switch 的官方发布渠道指导我安装适合当前系统的版本。
3. 询问我准备使用的模型供应商，然后依据该供应商的官方文档，指导我填写 Base URL、模型名称和 API Key，并测试连接。
4. 不要让我把真实 API Key 发到聊天里、截图里或提交到 Git；让我在本机界面或安全凭据存储中亲自填写。
5. 涉及覆盖配置、修改环境变量、安装软件或写入系统设置前，先说明目标和影响并向我确认。`,
  'agent-prompt': `请帮我安装并使用 ZKO 字库一键配置：
1. Codex 优先运行 codex plugin marketplace add https://gitee.com/shan-yujun/Communist-Manifesto-Releases.git，然后运行 codex plugin add zko-ai-coding-handle@zko-lab；如果 Gitee Git 不可用，Marketplace 改用 Lijinzh/Communist-Manifesto-Releases。
2. 如果当前 Agent 不支持 Codex 插件，优先运行 npx skills add https://gitee.com/shan-yujun/Communist-Manifesto-Releases.git --skill ai-coding-handle --agent '*' -g -y --copy；Gitee 不可用时再把来源换成 Lijinzh/Communist-Manifesto-Releases。
3. 安装完成后调用 $ai-coding-handle，帮我安装或检查 AutoClipboard、识别字库 D4/V3、配置当前 Agent Hook 和按键。
任何系统设置、驱动安装或固件写入前先向我确认。`,
  'codex-gitee': `codex plugin marketplace add https://gitee.com/shan-yujun/Communist-Manifesto-Releases.git
codex plugin add zko-ai-coding-handle@zko-lab`,
  'codex-github': `codex plugin marketplace add Lijinzh/Communist-Manifesto-Releases
codex plugin add zko-ai-coding-handle@zko-lab`,
  'all-agents': `npx skills add https://gitee.com/shan-yujun/Communist-Manifesto-Releases.git --skill ai-coding-handle --agent '*' -g -y --copy`,
};

const queryAll = (selector) => document.querySelectorAll?.(selector) ?? [];

function detectDownloadPlatform(navigatorObject = globalThis.navigator ?? {}) {
  const platform = [
    navigatorObject.userAgentData?.platform,
    navigatorObject.platform,
    navigatorObject.userAgent,
  ].filter(Boolean).join(' ').toLowerCase();

  if (/iphone|ipad|ipod|android/.test(platform)) return 'other';
  if (/macintosh|macintel|macppc|mac68k|mac os/.test(platform)) return 'macos';
  if (/windows|win32|win64|wow64/.test(platform)) return 'windows';
  if (!/android/.test(platform) && /linux|x11/.test(platform)) return 'linux';
  return 'other';
}

function configureDirectDownload(link, url, filename) {
  link.href = url;
  link.download = filename;
  link.removeAttribute?.('target');
}

function renderPlatformRecommendation() {
  const detectedPlatform = detectDownloadPlatform();
  const recommendedPlatform = detectedPlatform === 'other' ? 'windows' : detectedPlatform;
  const download = AUTOCLIPBOARD_PLATFORM_DOWNLOADS[recommendedPlatform];

  for (const panel of queryAll('[data-platform-recommendation]')) {
    panel.setAttribute?.('data-detected-platform', detectedPlatform);
  }
  for (const element of queryAll('[data-platform-recommendation-eyebrow]')) {
    element.textContent = detectedPlatform === 'other' ? '未识别当前系统 · 显示常用版本' : `已识别 ${download.name}`;
  }
  for (const element of queryAll('[data-platform-recommendation-title]')) {
    element.textContent = `推荐下载 ${download.name} 版`;
  }
  for (const element of queryAll('[data-platform-recommendation-detail]')) {
    element.textContent = `AutoClipboard v${download.version} · ${download.format} · ${download.detail}`;
  }
  for (const link of queryAll('[data-platform-recommendation-primary]')) {
    configureDirectDownload(link, download.gitee, download.filename);
    link.textContent = `${download.name} 推荐下载（Gitee）`;
  }
  for (const link of queryAll('[data-platform-recommendation-fallback]')) {
    configureDirectDownload(link, download.github, download.filename);
    link.textContent = 'GitHub 备用下载';
  }
}

const ACCOUNT_PROFILE_KEY = 'zko.account.profile.v1';
const ACCOUNT_PROFILE_TTL_MS = 50 * 60 * 1000;

function safeAccountProfile(value) {
  if (!value || typeof value !== 'object') return null;
  const updatedAt = Number(value.updatedAt || Date.now());
  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > ACCOUNT_PROFILE_TTL_MS) return null;
  const avatarUrl = String(value.avatarUrl || '');
  return {
    signedIn: value.signedIn !== false,
    username: String(value.username || '').slice(0, 32),
    avatarUrl: /^https:\/\//.test(avatarUrl) ? avatarUrl : '',
    updatedAt,
  };
}

function decodeAccountProfile(value) {
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return safeAccountProfile(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

function storedAccountProfile() {
  try { return safeAccountProfile(JSON.parse(localStorage.getItem(ACCOUNT_PROFILE_KEY) || 'null')); } catch { return null; }
}

function persistAccountProfile(profile) {
  try {
    if (profile) localStorage.setItem(ACCOUNT_PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(ACCOUNT_PROFILE_KEY);
  } catch { /* Storage can be blocked without affecting the public site. */ }
}

function renderHeaderAccount(value = {}) {
  const signedIn = value.signedIn === true || Boolean(value.username || value.avatarUrl);
  const name = signedIn ? (value.username ? `@${value.username}` : '请设置用户名') : '登录 / 注册';
  const initial = String(value.username || 'Z').trim().slice(0, 1).toUpperCase() || 'Z';
  for (const account of queryAll('[data-header-account]')) {
    account.toggleAttribute?.('data-signed-in', signedIn);
    const nameElement = account.querySelector?.('[data-header-account-name]');
    const eyebrow = account.querySelector?.('[data-header-account-eyebrow]');
    const image = account.querySelector?.('[data-header-account-image]');
    const initialElement = account.querySelector?.('[data-header-account-initial]');
    if (nameElement) nameElement.textContent = name;
    if (eyebrow) eyebrow.textContent = signedIn && value.username ? `@${value.username}` : 'ZKO ACCOUNT';
    if (initialElement) {
      initialElement.textContent = initial;
      initialElement.hidden = Boolean(value.avatarUrl || image?.getAttribute?.('src'));
    }
    if (image) {
      const defaultAvatarUrl = image.dataset?.defaultAvatar || image.getAttribute?.('src') || 'assets/favicon-pixel.png?v=20260811-pixel';
      image.dataset.defaultAvatar = defaultAvatarUrl;
      image.hidden = false;
      image.src = value.avatarUrl || defaultAvatarUrl;
    }
  }
}

globalThis.ZKO_ACCOUNT_HEADER = {
  update(value) {
    const profile = value?.signedIn === false ? null : safeAccountProfile({ ...value, updatedAt: Date.now() });
    if (value?.signedIn === false) persistAccountProfile(null);
    else if (profile) persistAccountProfile(profile);
    renderHeaderAccount(profile || { signedIn: false });
  },
};

let initialAccountProfile = storedAccountProfile();
try {
  const current = new URL(location.href);
  const handedOff = current.searchParams.get('_zko_profile');
  const signedOut = current.searchParams.get('_zko_signed_out') === '1';
  if (signedOut) {
    initialAccountProfile = null;
    persistAccountProfile(null);
    current.searchParams.delete('_zko_signed_out');
  }
  if (handedOff) {
    initialAccountProfile = decodeAccountProfile(handedOff) || initialAccountProfile;
    current.searchParams.delete('_zko_profile');
    history.replaceState?.(null, '', current.href);
    if (initialAccountProfile) persistAccountProfile(initialAccountProfile);
  }
} catch { /* URL cleanup is best effort. */ }
renderHeaderAccount(initialAccountProfile || { signedIn: false });

const accountConfig = globalThis.ZKO_ACCOUNT_CONFIG;
if (
  accountConfig?.hostedBridgeUrl
  && typeof location !== 'undefined'
  && ['zkolab.com', 'www.zkolab.com'].includes(location.hostname)
  && document.body?.append
) {
  try {
    const bridgeUrl = new URL(accountConfig.hostedBridgeUrl);
    const bridge = document.createElement('iframe');
    bridge.src = bridgeUrl.href;
    bridge.title = 'ZKO account status';
    bridge.hidden = true;
    bridge.setAttribute('aria-hidden', 'true');
    document.body.append(bridge);
    addEventListener('message', (event) => {
      if (event.origin !== bridgeUrl.origin || event.data?.type !== 'zko:account-profile') return;
      if (event.data.signedIn) globalThis.ZKO_ACCOUNT_HEADER.update(event.data.profile);
      else if (!storedAccountProfile()) globalThis.ZKO_ACCOUNT_HEADER.update({ signedIn: false });
    });
  } catch { /* Account status bridge must never block public content. */ }
}

for (const link of queryAll('[data-purchase-link]')) {
  link.href = PURCHASE_URL;
}

for (const link of queryAll('[data-download-link]')) {
  link.href = DOWNLOAD_URL;
}

for (const link of queryAll('[data-gitee-release-link]')) {
  link.href = GITEE_RELEASE_URL;
}

for (const link of queryAll('[data-windows-download-link]')) {
  configureDirectDownload(link, GITEE_WINDOWS_DOWNLOAD_URL, AUTOCLIPBOARD_PLATFORM_DOWNLOADS.windows.filename);
}

for (const link of queryAll('[data-windows-download-fallback]')) {
  configureDirectDownload(link, GITHUB_WINDOWS_DOWNLOAD_URL, AUTOCLIPBOARD_PLATFORM_DOWNLOADS.windows.filename);
}

for (const link of queryAll('[data-platform-download]')) {
  const platform = link.dataset?.platformDownload;
  const source = link.dataset?.downloadSource;
  const download = AUTOCLIPBOARD_PLATFORM_DOWNLOADS[platform];
  if (download?.[source]) configureDirectDownload(link, download[source], download.filename);
}

renderPlatformRecommendation();

async function copyInstallText(text) {
  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(text);
    return true;
  }

  if (!document.createElement || !document.body?.append || !document.execCommand) return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

for (const button of queryAll('[data-copy-install]')) {
  button.addEventListener?.('click', async () => {
    const key = button.dataset?.copyInstall;
    const text = INSTALL_COPY[key];
    if (!text) return;

    let copied = false;
    try {
      copied = await copyInstallText(text);
    } catch {
      copied = false;
    }

    const original = button.dataset?.copyLabel || button.textContent;
    button.dataset.copyLabel = original;
    button.textContent = copied ? '已复制，粘贴给 Agent' : '复制失败，请手动选择命令';
    for (const status of queryAll('[data-copy-status]')) {
      status.textContent = copied
        ? (button.dataset?.copySuccess || '安装内容已复制。打开 Codex 或其他 Agent 后直接粘贴即可。')
        : '浏览器未允许访问剪贴板，请在下方安装页面手动复制命令。';
    }
    if (typeof setTimeout === 'function') {
      setTimeout(() => { button.textContent = original; }, 3200);
    }
  });
}

const menuButton = document.querySelector?.('[data-menu-toggle]');
const globalNav = document.querySelector?.('[data-global-nav]');

if (
  menuButton
  && globalNav
  && typeof menuButton.addEventListener === 'function'
  && typeof document.addEventListener === 'function'
) {
  const setMenuOpen = (isOpen) => {
    menuButton.setAttribute?.('aria-expanded', String(isOpen));

    if (isOpen) {
      globalNav.setAttribute?.('data-open', '');
    } else {
      globalNav.removeAttribute?.('data-open');
    }
  };

  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute?.('aria-expanded') !== 'true');
  });

  for (const link of globalNav.querySelectorAll?.('a') ?? []) {
    link.addEventListener?.('click', () => setMenuOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menuButton.getAttribute?.('aria-expanded') !== 'true') return;
    setMenuOpen(false);
    menuButton.focus?.();
  });

  document.documentElement?.classList?.add?.('menu-enhanced');
}

const header = document.querySelector?.('[data-header]');

if (header && typeof addEventListener === 'function') {
  let scrollFrame = 0;
  const updateHeader = () => {
    scrollFrame = 0;
    const isScrolled = (globalThis.scrollY ?? 0) > 12;
    if (isScrolled) {
      header.setAttribute?.('data-scrolled', '');
    } else {
      header.removeAttribute?.('data-scrolled');
    }
  };

  addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(updateHeader)
      : 1;
    if (typeof requestAnimationFrame !== 'function') updateHeader();
  }, { passive: true });
  updateHeader();
}

const colorOptions = [...queryAll('[data-color-option]')];
const selectedColor = document.querySelector?.('[data-selected-color]');

for (const option of colorOptions) {
  option.addEventListener?.('click', () => {
    for (const item of colorOptions) {
      const isSelected = item === option;
      item.setAttribute?.('aria-pressed', String(isSelected));
      item.classList?.toggle?.('is-selected', isSelected);
    }

    if (selectedColor) selectedColor.textContent = option.dataset?.colorOption ?? '';
  });
}

const revealElements = queryAll('[data-reveal]');
const prefersReducedMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

if (
  revealElements.length > 0
  && !prefersReducedMotion
  && typeof IntersectionObserver === 'function'
) {
  let revealObserver;

  try {
    revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList?.add?.('is-visible');
        observer.unobserve?.(entry.target);
      }
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1,
    });

    document.documentElement?.classList?.add?.('js');
    for (const element of revealElements) revealObserver.observe?.(element);
  } catch {
    document.documentElement?.classList?.remove?.('js');
    revealObserver?.disconnect?.();
  }
}
