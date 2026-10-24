const container = document.querySelector('.snap-container');
const sections = [...document.querySelectorAll('[data-section]')];
const navLinks = [...document.querySelectorAll('.main-nav a')];
const dotsWrap = document.querySelector('.dots');

const DURATION = 1200;

let current = 0;
let animating = false;
let cooldown = false;

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

sections.forEach((s, i) => {
  const b = document.createElement('button');
  b.dataset.index = i;
  b.addEventListener('click', () => goTo(i));
  dotsWrap.appendChild(b);
});
const dots = [...dotsWrap.children];

const setActive = (index) => {
  current = index;
  navLinks.forEach((a, i) => a.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
};

function goTo(index, duration = DURATION) {
  index = Math.max(0, Math.min(sections.length - 1, index));
  const start = container.scrollTop;
  const end = sections[index].offsetTop;

  if (Math.abs(end - start) < 1) {
    setActive(index);
    return;
  }
  if (animating) return;

  animating = true;
  setActive(index);

  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    container.scrollTop = start + (end - start) * easeInOutCubic(p);
    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      animating = false;
      cooldown = true;
      setTimeout(() => (cooldown = false), 300);
    }
  };
  requestAnimationFrame(step);
}

/* Mouse / trackpad */
container.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (animating || cooldown || Math.abs(e.deltaY) < 4) return;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
  },
  { passive: false }
);

/* Touch swipe */
let touchStartY = null;
container.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

container.addEventListener('touchend', (e) => {
  if (touchStartY === null || animating) return;
  const delta = touchStartY - e.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(delta) > 50) goTo(current + (delta > 0 ? 1 : -1));
}, { passive: true });

/* Keyboard */
window.addEventListener('keydown', (e) => {
  if (animating) return;
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
    e.preventDefault();
    goTo(current + 1);
  } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
    e.preventDefault();
    goTo(current - 1);
  } else if (e.key === 'Home') {
    e.preventDefault();
    goTo(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    goTo(sections.length - 1);
  }
});

/* Fallback: scrollbar drag keeps nav in sync */
container.addEventListener('scroll', () => {
  if (animating) return;
  const index = Math.round(container.scrollTop / sections[0].offsetHeight);
  if (index !== current && index >= 0 && index < sections.length) {
    setActive(index);
  }
});

/* Reveal animations (replay every time the section is entered) */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        entry.target.classList.add('in-view');
      } else if (!entry.isIntersecting) {
        entry.target.classList.remove('in-view');
      }
    });
  },
  { root: container, threshold: [0, 0.5] }
);

sections.forEach((s) => observer.observe(s));
sections[0].classList.add('in-view');
setActive(0);

/* Navigation */
navLinks.forEach((link) => {
  if (!link.hash) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    goTo(navLinks.indexOf(link));
  });
});

document.querySelector('.brand').addEventListener('click', (e) => {
  e.preventDefault();
  goTo(0);
});
