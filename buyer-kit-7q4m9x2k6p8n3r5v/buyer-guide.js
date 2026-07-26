const copyButtons = document.querySelectorAll?.('[data-copy-button]') ?? [];

for (const button of copyButtons) {
  button.addEventListener?.('click', async () => {
    const block = button.closest?.('.copy-block');
    const source = block?.querySelector?.('code');
    const text = source?.textContent?.trim() ?? '';
    const originalLabel = button.textContent;

    if (!text || !globalThis.navigator?.clipboard?.writeText) {
      button.textContent = '请手动复制';
      globalThis.setTimeout?.(() => { button.textContent = originalLabel; }, 1800);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '复制成功';
    } catch {
      button.textContent = '请手动复制';
    }

    globalThis.setTimeout?.(() => { button.textContent = originalLabel; }, 1800);
  });
}

const tocLinks = [...(document.querySelectorAll?.('.buyer-toc a[href^="#"]') ?? [])];
const sections = tocLinks
  .map((link) => document.querySelector?.(link.getAttribute?.('href')))
  .filter(Boolean);

if (tocLinks.length && sections.length && typeof IntersectionObserver === 'function') {
  const linkById = new Map(tocLinks.map((link) => [link.getAttribute('href')?.slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    for (const link of tocLinks) link.removeAttribute?.('aria-current');
    linkById.get(visible.target.id)?.setAttribute?.('aria-current', 'true');
  }, { rootMargin: '-15% 0px -65% 0px', threshold: [0.1, 0.35] });

  for (const section of sections) observer.observe(section);
}
