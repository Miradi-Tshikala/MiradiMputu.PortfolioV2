/* ==========================================================
   script.js
   Custom lerp-based section snap scroll.
   - Wheel and touch both trigger smooth eased transitions
   - Identical feel scrolling up and down — no forced stops
   - IntersectionObserver keeps nav links in sync
   ========================================================== */

const TOTAL    = 5;
const sections = Array.from(document.querySelectorAll('.snap-section'));
const navLinks = document.querySelectorAll('.nav-link');
const wrapper  = document.getElementById('snapContainer');

// ── Dynamic year
document.getElementById('year').textContent = new Date().getFullYear();

// ── Active nav link
let current = 0;
function setActive(idx) {
  current = idx;
  navLinks.forEach((a, i) => a.classList.toggle('active', i === idx));
}

/* ──────────────────────────────────────────────────────────
   LERP SNAP ENGINE
   The wrapper is overflow:hidden. We translate a tall inner
   column up/down using transform: translateY(). Each section
   is exactly 100vh. goTo(idx) sets the target Y and the rAF
   loop lerps toward it smoothly.
   ────────────────────────────────────────────────────────── */

// Build the inner column that holds all sections
const column = document.createElement('div');
column.style.cssText = 'position:relative; will-change:transform;';
// Move all sections into the column
sections.forEach(sec => column.appendChild(sec));
wrapper.appendChild(column);

const VH          = () => window.innerHeight;
let   targetY     = 0;   // where we want to be (px, positive = scrolled down)
let   currentY    = 0;   // where the column actually is right now
let   isAnimating = false;
let   locked      = false; // debounce — ignore extra wheel events mid-transition

const LERP_SPEED  = 0.072;  // lower = floatier, higher = snappier
const LOCK_MS     = 700;    // ms to ignore new inputs after a snap starts

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function applyY(y) {
  column.style.transform = `translateY(${-y}px)`;
}

function tick() {
  currentY = lerp(currentY, targetY, LERP_SPEED);
  applyY(currentY);

  if (Math.abs(targetY - currentY) > 0.3) {
    requestAnimationFrame(tick);
  } else {
    currentY    = targetY;
    applyY(currentY);
    isAnimating = false;
  }
}

function goTo(idx) {
  idx = clamp(idx, 0, TOTAL - 1);
  if (idx === current && Math.abs(targetY - idx * VH()) < 2) return;

  targetY = idx * VH();
  setActive(idx);

  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(tick);
  }

  // Lock inputs briefly so one scroll doesn't skip two sections
  locked = true;
  clearTimeout(goTo._timer);
  goTo._timer = setTimeout(() => { locked = false; }, LOCK_MS);
}

// Recalculate on resize (vh changes on mobile when toolbar shows/hides)
window.addEventListener('resize', () => {
  targetY = current * VH();
  currentY = targetY;
  applyY(currentY);
}, { passive: true });

/* ── Wheel ── */
let wheelBuffer = 0;
const WHEEL_THRESHOLD = 50;

window.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (locked) return;

  wheelBuffer += e.deltaY;

  if (Math.abs(wheelBuffer) >= WHEEL_THRESHOLD) {
    const dir = wheelBuffer > 0 ? 1 : -1;
    wheelBuffer = 0;
    goTo(current + dir);
  }
}, { passive: false });

// Reset buffer when wheel stops
let wheelTimeout;
window.addEventListener('wheel', () => {
  clearTimeout(wheelTimeout);
  wheelTimeout = setTimeout(() => { wheelBuffer = 0; }, 150);
}, { passive: true });

/* ── Touch ── */
let touchStartY = 0;
let touchMoved  = false;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  touchMoved  = false;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  touchMoved = true;
  e.preventDefault(); // prevent native scroll
}, { passive: false });

window.addEventListener('touchend', (e) => {
  if (!touchMoved || locked) return;
  const delta = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(delta) < 40) return; // too small — ignore
  goTo(current + (delta > 0 ? 1 : -1));
}, { passive: true });

/* ── Keyboard ── */
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  if (e.key === 'End')  { e.preventDefault(); goTo(TOTAL - 1); }
});

/* ── Nav link clicks ── */
navLinks.forEach((link, i) => {
  link.addEventListener('click', () => {
    goTo(i);
    document.getElementById('navLinks').classList.remove('open');
  });
});

/* ── Nav logo → home ── */
document.querySelector('.nav-logo').addEventListener('click', () => goTo(0));

/* ── Mobile nav toggle ── */
const menuBtn      = document.getElementById('menuBtn');
const navLinksWrap = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => navLinksWrap.classList.toggle('open'));


/* ──────────────────────────────────────────────────────────
   PROJECT CAROUSEL — auto-scrolls through all 6 cards
   ────────────────────────────────────────────────────────── */
(function initCarousel() {
  const track = document.querySelector('.projects-grid');
  if (!track) return;

  const cards     = Array.from(track.querySelectorAll('.project-card'));
  const cardCount = cards.length;
  let   pos       = 0;
  let   paused    = false;

  // Clone cards for seamless loop
  cards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  function cardWidth() {
    return track.querySelector('.project-card').offsetWidth + 20;
  }

  const SPEED = 0.5; // px per frame

  function tick() {
    if (!paused) {
      pos += SPEED;
      if (pos >= cardWidth() * cardCount) pos -= cardWidth() * cardCount;
      track.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  track.addEventListener('mouseenter', () => { paused = true; });
  track.addEventListener('mouseleave', () => { paused = false; });

  const s2 = document.getElementById('s2');
  if (s2) {
    new IntersectionObserver(
      ([e]) => { if (!e.isIntersecting) paused = true; else paused = false; },
      { threshold: 0.3 }
    ).observe(s2);
  }
})();
