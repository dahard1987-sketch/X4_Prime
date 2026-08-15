document.addEventListener('DOMContentLoaded', () => {
  const links = [...document.querySelectorAll('.gn-links a[href^="#"]')];
  const pairs = links
    .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(item => item.section);

  if (!pairs.length || !('IntersectionObserver' in window)) return;

  const setCurrent = activeLink => {
    links.forEach(link => {
      const current = link === activeLink;
      link.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const match = pairs.find(item => item.section === visible.target);
    if (match) setCurrent(match.link);
  }, { rootMargin: '-24% 0px -66% 0px', threshold: [0, 0.1, 0.5] });

  pairs.forEach(item => observer.observe(item.section));
  setCurrent(pairs[0].link);
});
