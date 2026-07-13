(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* nav solid on scroll */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  const toggle = $('#navToggle'), mobile = $('#navMobile');
  if (toggle && mobile) {
    const set = (open) => {
      mobile.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => set(!mobile.classList.contains('open')));
    $$('a', mobile).forEach((a) => a.addEventListener('click', () => set(false)));
  }

  /* staggered reveals */
  const reveals = new Set($$('.reveal'));
  const show = (el) => { el.classList.add('in'); reveals.delete(el); };
  if (reduced) { reveals.forEach(show); }
  else {
    const check = () => { const vh = innerHeight; reveals.forEach((el) => { if (el.getBoundingClientRect().top < vh * 0.92) show(el); }); };
    requestAnimationFrame(check);
    addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* videos, tuned for slow networks:
     - posters show instantly while nothing downloads
     - only the hero loads up front (metadata only)
     - the rest carry data-src and download only when scrolled near (600px)
     - videos play only while on screen, and pause off screen */
  const vids = $$('video');
  vids.forEach((v) => { v.muted = true; v.setAttribute('muted', ''); });
  const loadSrc = (v) => { if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; v.load(); } };

  if (reduced) {
    vids.forEach((v) => v.removeAttribute('autoplay'));
  } else {
    const manage = () => {
      const vh = innerHeight;
      vids.forEach((v) => {
        const r = v.getBoundingClientRect();
        if (r.top < vh + 600 && r.bottom > -600) loadSrc(v);      /* preload when near */
        const onScreen = r.top < vh + 100 && r.bottom > -100;
        if (onScreen) { if (v.paused) v.play().catch(() => {}); }
        else if (!v.paused) v.pause();
      });
    };
    addEventListener('scroll', manage, { passive: true });
    addEventListener('resize', manage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) manage(); });
    manage();
  }
})();
