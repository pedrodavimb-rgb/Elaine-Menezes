/* ═══════════════════════════════════════════════════════
   DRA. ELAINE MENEZES — Main JS
   Scroll animations · Navbar · Counter
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ─── Respect reduced motion ──────────────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Navbar scroll behavior + mobile menu ────────────── */
(function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  function onScroll() {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function openMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // Same button opens AND closes the menu (toggle)
  hamburger.addEventListener('click', () => {
    if (hamburger.classList.contains('open')) closeMenu();
    else openMenu();
  });

  // Tapping a link closes the menu immediately; the smooth-scroll handler
  // further down then carries the user to the section (no scroll-lock left).
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Escape also closes it
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.classList.contains('open')) closeMenu();
  });
})();

/* ─── Scroll animations (IntersectionObserver) ────────── */
(function initScrollAnimations() {
  if (prefersReducedMotion) {
    document.querySelectorAll('[data-animate]').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;

      setTimeout(() => {
        el.classList.add('is-visible');
      }, delay);

      observer.unobserve(el);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
})();

/* ─── Counter animation ───────────────────────────────── */
(function initCounters() {
  if (prefersReducedMotion) {
    document.querySelectorAll('[data-count]').forEach(el => {
      el.textContent = el.dataset.count;
    });
    return;
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCounter(el, target, duration = 2000) {
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOutExpo(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.count));
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
})();

/* ─── Smooth scroll for anchor links ─────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});

/* ─── Active nav link on scroll ──────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActive() {
    const y = window.scrollY + 120;
    let active = null;
    sections.forEach(section => {
      if (section.offsetTop <= y) active = section.id;
    });
    navLinks.forEach(a => {
      const match = a.getAttribute('href') === '#' + active;
      a.classList.toggle('is-active', match);
    });
  }

  window.addEventListener('scroll', setActive, { passive: true });
})();

/* ─── Conversão: clique em botão de WhatsApp → dataLayer (GTM) ─────────── */
(function initWhatsappTracking() {
  window.dataLayer = window.dataLayer || [];
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    a.addEventListener('click', () => {
      window.dataLayer.push({
        event: 'agendar_whatsapp',
        cta_local: (a.getAttribute('aria-label') || a.textContent || 'whatsapp').trim().slice(0, 40)
      });
    });
  });
})();
