const PURCHASE_URL = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';
const DOWNLOAD_URL = 'https://github.com/Lijinzh/Communist-Manifesto-Releases';
const GITEE_RELEASE_URL = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';
const AUTOCLIPBOARD_WINDOWS_VERSION = '0.3.64';
const AUTOCLIPBOARD_WINDOWS_RELEASE_TAG = 'v0.3.62';
const GITEE_WINDOWS_DOWNLOAD_URL = `https://gitee.com/shan-yujun/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_WINDOWS_RELEASE_TAG}/AutoClipboardSetup-${AUTOCLIPBOARD_WINDOWS_VERSION}.exe`;
const GITHUB_WINDOWS_DOWNLOAD_URL = `https://github.com/Lijinzh/Communist-Manifesto-Releases/releases/download/${AUTOCLIPBOARD_WINDOWS_RELEASE_TAG}/AutoClipboardSetup-${AUTOCLIPBOARD_WINDOWS_VERSION}.exe`;
const INSTALL_COPY = {
  'agent-prompt': `请帮我安装并使用 ZKO 苍虬一键配置：
1. Codex 优先运行 codex plugin marketplace add https://gitee.com/shan-yujun/Communist-Manifesto-Releases.git，然后运行 codex plugin add zko-ai-coding-handle@zko-lab；如果 Gitee Git 不可用，Marketplace 改用 Lijinzh/Communist-Manifesto-Releases。
2. 如果当前 Agent 不支持 Codex 插件，运行 npx skills add Lijinzh/Communist-Manifesto-Releases --skill ai-coding-handle --agent '*' -g -y --copy。
3. 安装完成后调用 $ai-coding-handle，帮我安装或检查 AutoClipboard、识别苍虬 D4/V3、配置当前 Agent Hook 和按键。
任何系统设置、驱动安装或固件写入前先向我确认。`,
  'codex-gitee': `codex plugin marketplace add https://gitee.com/shan-yujun/Communist-Manifesto-Releases.git
codex plugin add zko-ai-coding-handle@zko-lab`,
  'codex-github': `codex plugin marketplace add Lijinzh/Communist-Manifesto-Releases
codex plugin add zko-ai-coding-handle@zko-lab`,
  'all-agents': `npx skills add Lijinzh/Communist-Manifesto-Releases --skill ai-coding-handle --agent '*' -g -y --copy`,
};

const queryAll = (selector) => document.querySelectorAll?.(selector) ?? [];

const ACCOUNT_PROFILE_KEY = 'zko.account.profile.v1';
const ACCOUNT_PROFILE_TTL_MS = 50 * 60 * 1000;

function safeAccountProfile(value) {
  if (!value || typeof value !== 'object') return null;
  const updatedAt = Number(value.updatedAt || Date.now());
  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > ACCOUNT_PROFILE_TTL_MS) return null;
  const avatarUrl = String(value.avatarUrl || '');
  return {
    signedIn: value.signedIn !== false,
    displayName: String(value.displayName || '').slice(0, 40),
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
  const signedIn = value.signedIn === true || Boolean(value.displayName || value.username || value.avatarUrl);
  const name = signedIn ? (value.displayName || (value.username ? `@${value.username}` : 'ZKO 用户')) : '登录 / 注册';
  const initial = String(value.displayName || value.username || 'Z').trim().slice(0, 1).toUpperCase() || 'Z';
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
      initialElement.hidden = Boolean(value.avatarUrl);
    }
    if (image) {
      image.hidden = !value.avatarUrl;
      if (value.avatarUrl) image.src = value.avatarUrl;
      else image.removeAttribute?.('src');
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
  link.href = GITEE_WINDOWS_DOWNLOAD_URL;
}

for (const link of queryAll('[data-windows-download-fallback]')) {
  link.href = GITHUB_WINDOWS_DOWNLOAD_URL;
}

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
        ? '安装内容已复制。打开 Codex 或其他 Agent 后直接粘贴即可。'
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
