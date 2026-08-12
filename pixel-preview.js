(() => {
const pixelModes = {
  agent: {
    label: 'AGENT CONTROL',
    status: 'WAITING FOR COMMAND',
    meter: '72%',
    accent: '#73cfc0',
  },
  voice: {
    label: 'VOICE INPUT',
    status: 'LISTENING...',
    meter: '48%',
    accent: '#ffc878',
  },
  macro: {
    label: 'MACRO DECK',
    status: '04 KEYS MAPPED',
    meter: '100%',
    accent: '#ed7a3a',
  },
};

const modeLabel = document.querySelector('[data-mode-label]');
const modeStatus = document.querySelector('[data-mode-status]');
const modeMeter = document.querySelector('[data-mode-meter]');

for (const button of document.querySelectorAll('[data-pixel-mode]')) {
  button.addEventListener('click', () => {
    const mode = pixelModes[button.dataset.pixelMode];
    if (!mode) return;
    for (const item of document.querySelectorAll('[data-pixel-mode]')) {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    }
    if (modeLabel) modeLabel.textContent = mode.label;
    if (modeStatus) modeStatus.textContent = mode.status;
    if (modeMeter) {
      modeMeter.style.width = mode.meter;
      modeMeter.style.backgroundColor = mode.accent;
    }
  });
}

const menuButton = document.querySelector('[data-pixel-menu]');
const menu = document.querySelector('[data-pixel-nav]');
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  for (const link of menu.querySelectorAll('a')) {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  }
}

const revealTargets = [...document.querySelectorAll('[data-pixel-reveal]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add('is-visible'));
}

const pixelHero = document.querySelector('.pixel-hero');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (pixelHero) {
  let heroFrame = 0;

  const isWideHero = () => window.innerWidth >= 1600;

  const updateHeroArt = () => {
    heroFrame = 0;
    if (!isWideHero() || reducedMotion.matches) {
      pixelHero.style.removeProperty('--hero-art-scale');
      pixelHero.style.removeProperty('--hero-art-shift');
      return;
    }

    const rect = pixelHero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height * 0.72)));
    pixelHero.style.setProperty('--hero-art-scale', (1.12 - progress * 0.1).toFixed(4));
    pixelHero.style.setProperty('--hero-art-shift', '0px');
  };

  const queueHeroArtUpdate = () => {
    if (heroFrame) return;
    heroFrame = window.requestAnimationFrame(updateHeroArt);
  };

  updateHeroArt();
  window.addEventListener('scroll', queueHeroArtUpdate, { passive: true });
  window.addEventListener('resize', queueHeroArtUpdate);
  reducedMotion.addEventListener?.('change', queueHeroArtUpdate);
}
})();
