/* ==========================================================
   script.js — Single-page fullscreen snap scroll
   Brittany Chiang v2 style:
   - CSS scroll-snap handles the actual snapping
   - JS syncs nav dots, nav links, and handles keyboard
   - Mobile nav toggle + dynamic year
   ========================================================== */

const TOTAL = 5;
const container = document.getElementById('snapContainer');
const dots      = document.querySelectorAll('.dot');
const navLinks  = document.querySelectorAll('.nav-link');
const sections  = document.querySelectorAll('.snap-section');

// ── Dynamic year
document.getElementById('year').textContent = new Date().getFullYear();

// ── Track current section index
let current = 0;

// ── Update active dot + nav link
function setActive(idx) {
  current = idx;

  dots.forEach((d, i)     => d.classList.toggle('active', i === idx));
  navLinks.forEach((a, i) => a.classList.toggle('active', i === idx));
}

// ── Scroll to a section by index
function goTo(idx) {
  idx = Math.max(0, Math.min(TOTAL - 1, idx));
  sections[idx].scrollIntoView({ behavior: 'smooth' });
  setActive(idx);
}

// ── Watch which section is in view using IntersectionObserver
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = parseInt(entry.target.dataset.idx ?? 0);
      setActive(idx);
    }
  });
}, {
  root: container,
  threshold: 0.5   // section must be >50% visible to count
});
sections.forEach(sec => {
  // Assign data-idx from order if not set in HTML
  const idx = Array.from(sections).indexOf(sec);
  sec.dataset.idx = idx;
  io.observe(sec);
});

// ── Dot nav clicks
dots.forEach(dot => {
  dot.addEventListener('click', () => goTo(parseInt(dot.dataset.idx)));
});

// ── Nav link clicks
navLinks.forEach((link, i) => {
  link.addEventListener('click', () => {
    goTo(i);
    // Close mobile menu if open
    document.getElementById('navLinks').classList.remove('open');
  });
});

// ── Nav logo click → go home
document.querySelector('.nav-logo').addEventListener('click', () => goTo(0));

// ── Keyboard navigation (arrow keys / Page Up / Page Down)
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  if (e.key === 'End')  { e.preventDefault(); goTo(TOTAL - 1); }
});

// ── Mobile nav toggle
const menuBtn       = document.getElementById('menuBtn');
const navLinksWrap  = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => navLinksWrap.classList.toggle('open'));