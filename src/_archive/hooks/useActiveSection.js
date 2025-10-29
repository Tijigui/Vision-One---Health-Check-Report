import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds, options) {
  const [active, setActive] = useState(sectionIds[0] || null);
  useEffect(() => {
    const els = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
    const visible = {};
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        const id = target.id;
        visible[id] = isIntersecting ? intersectionRatio : 0;
      });
      let best = null, bestRatio = 0;
      Object.keys(visible).forEach(id => {
        const r = visible[id] || 0;
        if (r > bestRatio) { best = id; bestRatio = r; }
      });
      if (best) setActive(best);
    }, options || { threshold: [0.25, 0.5, 0.75], rootMargin: '-40% 0px -40% 0px' });
    els.forEach(el => io.observe(el));
    setTimeout(() => {
      const first = els.find(e => e && e.offsetParent !== null);
      if (first) setActive(first.id);
    }, 0);
    return () => io.disconnect();
  }, [sectionIds]);
  return active;
}