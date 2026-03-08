/* ==========================================================
   script.js — Lerp section snap scroll
   ========================================================== */

const TOTAL     = 5;
const container = document.getElementById('snapContainer');
const navLinks  = document.querySelectorAll('.nav-link');
const sections  = Array.from(document.querySelectorAll('.snap-section'));

document.getElementById('year').textContent = new Date().getFullYear();

let current = 0;

function setActive(idx) {
  current = idx;
  navLinks.forEach((a, i) => a.classList.toggle('active', i === idx));
}

/* ── Lerp engine ── */
let targetScroll  = 0;
let currentScroll = 0;
let animating     = false;
let locked        = false;

function lerp(a, b, t) { return a + (b - a) * t; }

function tick() {
  currentScroll = lerp(currentScroll, targetScroll, 0.08);
  container.scrollTop = currentScroll;
  if (Math.abs(targetScroll - currentScroll) > 0.5) {
    requestAnimationFrame(tick);
  } else {
    container.scrollTop = targetScroll;
    currentScroll = targetScroll;
    animating = false;
  }
}

function goTo(idx) {
  idx = Math.max(0, Math.min(TOTAL - 1, idx));
  targetScroll = idx * window.innerHeight;
  setActive(idx);
  if (!animating) { animating = true; requestAnimationFrame(tick); }
  locked = true;
  clearTimeout(goTo._t);
  goTo._t = setTimeout(() => { locked = false; }, 750);
}

window.addEventListener('resize', () => {
  targetScroll = currentScroll = current * window.innerHeight;
  container.scrollTop = targetScroll;
}, { passive: true });

/* ── Wheel ── */
let wheelAcc = 0;
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (locked) return;
  wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) >= 50) {
    goTo(current + (wheelAcc > 0 ? 1 : -1));
    wheelAcc = 0;
  }
}, { passive: false });

let wt;
window.addEventListener('wheel', () => {
  clearTimeout(wt);
  wt = setTimeout(() => { wheelAcc = 0; }, 200);
}, { passive: true });

/* ── Touch ── */
let ty0 = 0, didMove = false;
window.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; didMove = false; }, { passive: true });
window.addEventListener('touchmove',  e => { didMove = true; e.preventDefault(); }, { passive: false });
window.addEventListener('touchend',   e => {
  if (!didMove || locked) return;
  const delta = ty0 - e.changedTouches[0].clientY;
  if (Math.abs(delta) < 40) return;
  goTo(current + (delta > 0 ? 1 : -1));
}, { passive: true });

/* ── Keyboard ── */
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  if (e.key === 'End')  { e.preventDefault(); goTo(TOTAL - 1); }
});

/* ── Nav ── */
navLinks.forEach((link, i) => {
  link.addEventListener('click', () => {
    goTo(i);
    document.getElementById('navLinks').classList.remove('open');
  });
});
document.querySelector('.nav-logo').addEventListener('click', () => goTo(0));

const menuBtn = document.getElementById('menuBtn');
menuBtn.addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));


/* ── Project carousel ── */
(function() {
  const track = document.querySelector('.projects-grid');
  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.project-card'));
  let pos = 0, paused = false;

  cards.forEach(c => {
    const clone = c.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  function cardW() { const c = track.querySelector('.project-card'); return c ? c.offsetWidth + 20 : 300; }

  function frame() {
    if (!paused) {
      pos += 0.5;
      if (pos >= cardW() * cards.length) pos -= cardW() * cards.length;
      track.scrollLeft = pos;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  track.addEventListener('mouseenter', () => { paused = true; });
  track.addEventListener('mouseleave', () => { paused = false; });
})();
