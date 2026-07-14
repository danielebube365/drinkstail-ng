(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* nav solid once the curtain covers the fixed hero */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > innerHeight * 0.6);
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
     - videos play only while on screen; a dimmed carousel "peek" never plays */
  const vids = $$('video');
  vids.forEach((v) => { v.muted = true; v.setAttribute('muted', ''); });
  const loadSrc = (v) => { if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; v.load(); } };
  const isPeek = (v) => { const p = v.closest('.panel'); return p && p.classList.contains('is-peek'); };
  let manage = () => {};

  if (reduced) {
    vids.forEach((v) => v.removeAttribute('autoplay'));
  } else {
    manage = () => {
      const vh = innerHeight;
      vids.forEach((v) => {
        const r = v.getBoundingClientRect();
        if (r.top < vh + 600 && r.bottom > -600) loadSrc(v);      /* preload when near */
        const onScreen = r.top < vh + 100 && r.bottom > -100 && !isPeek(v);
        if (onScreen) { if (v.paused) v.play().catch(() => {}); }
        else if (!v.paused) v.pause();
      });
    };
    addEventListener('scroll', manage, { passive: true });
    addEventListener('resize', manage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) manage(); });
    manage();
  }

  /* service peek carousel (desktop only): one video active, the other dimmed
     beside it; arrows or clicking the peek swap them. Mobile stays stacked. */
  const carousel = $('#serviceCarousel');
  if (carousel) {
    const panels = $$('.panel', carousel);
    const prev = $('.pnav--prev', carousel), next = $('.pnav--next', carousel);
    const mq = matchMedia('(min-width:760px)');
    let idx = 0;
    const render = () => {
      if (!mq.matches) {
        panels.forEach((p) => p.classList.remove('is-active', 'is-peek', 'peek-left', 'peek-right'));
      } else {
        panels.forEach((p, i) => {
          const peek = i !== idx;
          p.classList.toggle('is-active', !peek);
          p.classList.toggle('is-peek', peek);
          p.classList.toggle('peek-left', peek && i < idx);
          p.classList.toggle('peek-right', peek && i > idx);
        });
      }
      manage();
    };
    const go = (d) => { idx = (idx + d + panels.length) % panels.length; render(); };
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    panels.forEach((p, i) => p.addEventListener('click', (e) => {
      if (mq.matches && p.classList.contains('is-peek')) { e.preventDefault(); idx = i; render(); }
    }));
    (mq.addEventListener ? mq.addEventListener('change', render) : mq.addListener(render));
    render();
  }
})();
