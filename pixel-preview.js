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

const zkoThemes = [
  ['classic', '经典像素', '', '#ed7a3a', '#73cfc0', '#292756', '#b8ff39'],
  ['shanbei-loess', '陕北黄土', 'shanbei-loess-court.webp', '#d9772c', '#8eab54', '#503229', '#f1c35a'],
  ['roland-garros', '巴黎红土', 'roland-garros-clay-court.webp', '#e66c36', '#4da680', '#163f32', '#f1b657'],
  ['wimbledon', '伦敦草地', 'wimbledon-grass-court.webp', '#7ea73f', '#64b58d', '#15392c', '#c7e56a'],
  ['us-open', '纽约夜场', 'us-open-night-court.webp', '#5575ff', '#4fd8ff', '#070e3b', '#ff5ebd'],
  ['australian-open', '澳洲蓝场', 'australian-open-day-court.webp', '#1589dc', '#55cedc', '#063d78', '#ffcc5c'],
  ['shanghai-qizhong', '上海旗忠', 'shanghai-qizhong-court.webp', '#1687b0', '#41cdbb', '#063c55', '#ffd05f'],
  ['beijing-diamond', '北京钻石', 'beijing-national-tennis-center.webp', '#d64a36', '#9b7bc6', '#4d1d3f', '#ffb34f'],
  ['madrid-caja-magica', '马德里魔力盒', 'madrid-caja-magica-court.webp', '#df6732', '#a9937f', '#28242a', '#ffc04f'],
  ['rio-jockey-club', '里约热带', 'rio-jockey-club-court.webp', '#d86032', '#50aa6d', '#173f2a', '#b9ef67'],
  ['indian-wells', '沙漠花园', 'indian-wells-desert-court.webp', '#d98634', '#4a9ba5', '#294d54', '#ffd05d'],
  ['dunhuang', '敦煌月牙泉', 'dunhuang-desert-court.webp', '#c96831', '#aa7c55', '#5a2733', '#ffd16f'],
  ['himalaya', '喜马拉雅', 'himalaya-foothills-court.webp', '#397ca7', '#79bac7', '#23455e', '#c8f1ff'],
  ['larung-gar', '喇荣山谷', 'larung-gar-valley-court.webp', '#b94d3d', '#b98c65', '#571f25', '#f1b06a'],
  ['hyrule-inspired', '旷野遗迹', 'hyrule-inspired-court.webp', '#268b69', '#39b8b3', '#154b54', '#8cffc9'],
  ['ashina-inspired', '枫叶山城', 'ashina-inspired-court.webp', '#b94136', '#77707a', '#201d28', '#eaa34f'],
  ['neon-hero-alliance', '霓虹英雄联盟', 'neon-hero-alliance.webp', '#16e0b5', '#ff4bd1', '#09143d', '#f7c948'],
  ['cosmic-observatory', '星际观测站', 'cosmic-observatory.webp', '#9a72ff', '#57d7ff', '#17113d', '#ffb454'],
].map(([id, label, asset, accent, secondary, deep, highlight]) => ({ id, label, asset, accent, secondary, deep, highlight }));

const zkoThemeStorageKey = 'zko.pixel.theme.v1';
const zkoThemeById = new Map(zkoThemes.map((theme) => [theme.id, theme]));
const zkoThemeRoot = document.documentElement;
const zkoThemeMeta = document.querySelector('meta[name="theme-color"]');
const zkoThemeHero = document.querySelector('.pixel-hero__art');
if (zkoThemeHero) {
  zkoThemeHero.dataset.defaultSrc = zkoThemeHero.getAttribute('src') || '';
  zkoThemeHero.dataset.defaultAlt = zkoThemeHero.getAttribute('alt') || '';
}

const readZkoTheme = () => {
  try { return localStorage.getItem(zkoThemeStorageKey) || 'classic'; } catch { return 'classic'; }
};

const writeZkoTheme = (themeId) => {
  try { localStorage.setItem(zkoThemeStorageKey, themeId); } catch { /* Theme switching remains available without storage. */ }
};

const buildZkoThemePicker = () => {
  if (!document.body?.classList.contains('pixel-site')) return null;
  const picker = document.createElement('div');
  picker.className = 'zko-theme-picker';
  picker.innerHTML = `
    <button class="zko-theme-trigger" type="button" aria-expanded="false" aria-controls="zko-theme-panel"><span aria-hidden="true">▦</span><strong>主题</strong></button>
    <section class="zko-theme-panel" id="zko-theme-panel" hidden aria-label="网站像素主题">
      <header><div><small>PIXEL THEME DECK</small><strong>切换网站主题</strong></div><button type="button" aria-label="关闭主题面板">×</button></header>
      <label for="zko-theme-select">场景</label>
      <select id="zko-theme-select"></select>
      <figure><div class="zko-theme-preview" aria-hidden="true"></div><figcaption>经典像素</figcaption></figure>
      <p>网站主题单独保存在浏览器中，不会修改 AutoClipboard 软件设置。</p>
    </section>`;
  document.body.append(picker);
  const select = picker.querySelector('select');
  for (const theme of zkoThemes) {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.label;
    select.append(option);
  }
  return picker;
};

const zkoThemePicker = buildZkoThemePicker();
const zkoThemeTrigger = zkoThemePicker?.querySelector('.zko-theme-trigger');
const zkoThemePanel = zkoThemePicker?.querySelector('.zko-theme-panel');
const zkoThemeClose = zkoThemePanel?.querySelector('header button');
const zkoThemeSelect = zkoThemePanel?.querySelector('select');
const zkoThemePreview = zkoThemePanel?.querySelector('.zko-theme-preview');
const zkoThemeCaption = zkoThemePanel?.querySelector('figcaption');

const applyZkoTheme = (themeId, persist = true) => {
  const theme = zkoThemeById.get(themeId) || zkoThemeById.get('classic');
  zkoThemeRoot.dataset.zkoTheme = theme.id;
  zkoThemeRoot.style.setProperty('--theme-accent', theme.accent);
  zkoThemeRoot.style.setProperty('--theme-secondary', theme.secondary);
  zkoThemeRoot.style.setProperty('--theme-deep', theme.deep);
  zkoThemeRoot.style.setProperty('--theme-highlight', theme.highlight);
  if (theme.asset) zkoThemeRoot.style.setProperty('--theme-scene', `url("assets/themes/${theme.asset}")`);
  else zkoThemeRoot.style.removeProperty('--theme-scene');
  if (zkoThemeMeta) zkoThemeMeta.content = theme.deep;
  if (zkoThemeHero) {
    zkoThemeHero.src = theme.asset ? `assets/themes/${theme.asset}` : zkoThemeHero.dataset.defaultSrc;
    zkoThemeHero.alt = theme.asset ? `${theme.label}像素主题场景` : zkoThemeHero.dataset.defaultAlt;
    zkoThemeHero.style.imageRendering = theme.asset ? 'pixelated' : '';
  }
  if (zkoThemeSelect) zkoThemeSelect.value = theme.id;
  if (zkoThemeCaption) zkoThemeCaption.textContent = theme.label;
  if (zkoThemePreview) zkoThemePreview.style.backgroundImage = theme.asset ? `url("assets/themes/${theme.asset}")` : '';
  if (persist) writeZkoTheme(theme.id);
};

const setZkoThemePanelOpen = (open) => {
  if (!zkoThemePanel || !zkoThemeTrigger) return;
  zkoThemePanel.hidden = !open;
  zkoThemeTrigger.setAttribute('aria-expanded', String(open));
  if (open) zkoThemeSelect?.focus();
};

zkoThemeTrigger?.addEventListener('click', () => setZkoThemePanelOpen(zkoThemePanel?.hidden));
zkoThemeClose?.addEventListener('click', () => setZkoThemePanelOpen(false));
zkoThemeSelect?.addEventListener('change', () => applyZkoTheme(zkoThemeSelect.value));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setZkoThemePanelOpen(false); });
document.addEventListener('pointerdown', (event) => {
  if (!zkoThemePicker || zkoThemePanel?.hidden || zkoThemePicker.contains(event.target)) return;
  setZkoThemePanelOpen(false);
});
applyZkoTheme(readZkoTheme(), false);

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
