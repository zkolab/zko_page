const PURCHASE_URL = 'https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B';

const purchaseLinks = document.querySelectorAll?.('[data-purchase-link]') ?? [];

for (const link of purchaseLinks) {
  link.href = PURCHASE_URL;
}

const menuButton = document.querySelector?.('[data-menu-button]');
const siteNav = document.querySelector?.('[data-site-nav]');

if (menuButton && siteNav) {
  const setMenuOpen = (isOpen) => {
    menuButton.setAttribute?.('aria-expanded', String(isOpen));

    if (isOpen) {
      siteNav.setAttribute?.('data-open', '');
    } else {
      siteNav.removeAttribute?.('data-open');
    }
  };

  menuButton.addEventListener?.('click', () => {
    const isOpen = menuButton.getAttribute?.('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  const navLinks = siteNav.querySelectorAll?.('a') ?? [];
  for (const link of navLinks) {
    link.addEventListener?.('click', () => setMenuOpen(false));
  }

  document.addEventListener?.('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

const revealElements = document.querySelectorAll?.('[data-reveal]') ?? [];
const prefersReducedMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

if (
  revealElements.length > 0
  && !prefersReducedMotion
  && typeof IntersectionObserver === 'function'
) {
  document.documentElement?.classList?.add?.('js');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      entry.target.classList?.add?.('is-visible');
      observer.unobserve?.(entry.target);
    }
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1,
  });

  for (const element of revealElements) {
    revealObserver.observe?.(element);
  }
}
