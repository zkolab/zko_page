const PURCHASE_URL = 'https://www.goofish.com/item?spm=a21ybx.personal.feeds.2.5a4e6ac2FqZlZf&id=1065574393669&categoryId=50023914';
const DOWNLOAD_URL = 'https://github.com/Lijinzh/Communist-Manifesto-Releases';
const GITEE_RELEASE_URL = 'https://gitee.com/shan-yujun/Communist-Manifesto-Releases';

const queryAll = (selector) => document.querySelectorAll?.(selector) ?? [];

for (const link of queryAll('[data-purchase-link]')) {
  link.href = PURCHASE_URL;
}

for (const link of queryAll('[data-download-link]')) {
  link.href = DOWNLOAD_URL;
}

for (const link of queryAll('[data-gitee-release-link]')) {
  link.href = GITEE_RELEASE_URL;
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
