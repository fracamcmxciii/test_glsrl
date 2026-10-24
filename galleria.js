const projects = [
  { title: 'Villa in campagna', dir: 'img/galleria/01-villa-campagna', count: 5,
    desc: "Ristrutturazione completa di una villa agricola: nuovi intonaci, impermeabilizzazione delle coperture, pavimenti in cotto e rifacimento degli impianti, con recupero fedele delle strutture originali." },
  { title: 'Casa in pianura',   dir: 'img/galleria/02-casa-pianura',   count: 5,
    desc: "Realizzazione chiavi in mano di abitazione in zona pianeggiante: strutture in cemento armato, infissi in alluminio con doppio vetro e finiture di pregio, consegnata pronta da abitare." },
  { title: 'Villa in collina',  dir: 'img/galleria/03-villa-collina',  count: 5,
    desc: "Ampliamento e adeguamento sismico di una villa in collina, con terrazze a sbalzo, rivestimento in pietra locale e giardino pensile sul lato sud." },
  { title: 'Casa sul mare',     dir: 'img/galleria/04-casa-mare',      count: 5,
    desc: "Costruzione di una casa fronte mare con spazi living aperti all'esterno, copertura ventilata e materiali studiati per resistere all'aggressione del sale." },
];

const photoName = (n) => `${String(n).padStart(2, '0')}.jpg`;
const $ = (id) => document.getElementById(id);
const canHover = window.matchMedia('(hover: hover)').matches;

/* ---------- Card ---------- */
const track = $('gxTrack');
const row = document.createElement('div');
row.className = 'gx-row';
track.appendChild(row);

projects.forEach((p, i) => {
  const card = document.createElement('div');
  card.className = 'gx-card';
  card.style.setProperty('--d', `${i * 110}ms`);
  card.setAttribute('role', 'button');
  card.tabIndex = 0;
  card.setAttribute('aria-label', `Apri il progetto ${p.title}`);

  const media = document.createElement('div');
  media.className = 'gx-media';
  for (let k = 0; k < p.count; k++) {
    const img = document.createElement('img');
    img.src = `${p.dir}/${photoName(k + 1)}`;
    img.alt = `${p.title} — foto ${k + 1}`;
    if (k === 0) img.classList.add('on');
    media.appendChild(img);
  }

  const tint = document.createElement('div');
  tint.className = 'gx-tint';

  const title = document.createElement('h2');
  title.className = 'gx-title';
  const words = p.title.split(' ');
  let l1 = '';
  let l2 = p.title;
  let l3 = '';
  if (words.length >= 3) {
    l1 = words[0];
    l2 = words.slice(1, -1).join(' ');
    l3 = words[words.length - 1];
  } else if (words.length === 2) {
    l1 = words[0];
    l2 = '';
    l3 = words[1];
  }
  title.innerHTML = `<span class="l1">${l1}</span><span class="l2">${l2}</span><span class="l3">${l3}</span>`;

  card.append(media, tint, title);
  card.addEventListener('click', () => openLightbox(i, 0, card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(i, 0, card);
    }
  });
  row.appendChild(card);
});

const cards = [...row.children];

requestAnimationFrame(() => document.body.classList.add('gx-ready'));

/* ---------- Hover: dissolvenza a sfera + slideshow ---------- */
function setHole(card, e) {
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
}

let showTimer = null;
let hovered = null;

function startShow(card) {
  const imgs = [...card.querySelectorAll('.gx-media img')];
  if (imgs.length < 2) return;
  let idx = imgs.findIndex((im) => im.classList.contains('on'));
  if (idx < 0) idx = 0;
  showTimer = setInterval(() => {
    imgs[idx].classList.remove('on');
    idx = (idx + 1) % imgs.length;
    imgs[idx].classList.add('on');
  }, 1150);
}

function stopShow() {
  clearInterval(showTimer);
  showTimer = null;
  if (hovered) {
    [...hovered.querySelectorAll('.gx-media img')].forEach((im, k) =>
      im.classList.toggle('on', k === 0)
    );
  }
}

cards.forEach((card) => {
  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    setHole(card, e);
    card.classList.add('hover');
    hovered = card;
    startShow(card);
  });
  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch') setHole(card, e);
  });
  card.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    card.classList.remove('hover');
    stopShow();
    hovered = null;
  });
});

/* ---------- Scorrimento: mouse / rotella / swipe / tasti ---------- */
const stage = $('gxStage');
let active = 0;
let navLock = false;
let infoTimer = null;

const infoInner = $('gxInfo');
const infoTitle = $('gxInfoTitle');
const infoText = $('gxInfoText');
const infoCount = $('gxInfoCount');

function setInfo(i) {
  const p = projects[i];
  infoInner.classList.add('swap-out');
  clearTimeout(infoTimer);
  infoTimer = setTimeout(() => {
    infoTitle.textContent = p.title;
    infoText.textContent = p.desc;
    infoCount.textContent = `${p.count} foto`;
    infoInner.classList.remove('swap-out');
  }, 260);
}

function setActive(i) {
  if (i < 0 || i >= cards.length || i === active) return;
  active = i;
  cards.forEach((c, k) => c.classList.toggle('active', k === i));
  setInfo(i);
}

const maxScroll = () => Math.max(0, row.offsetWidth - track.clientWidth);
const clampPx = (v) => Math.min(maxScroll(), Math.max(0, v));
const pitch = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 240);

let centers = [];
function measure() {
  centers = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
}
measure();
window.addEventListener('resize', () => { measure(); targetPx = clampPx(targetPx); });

let targetPx = 0;
let smoothPx = 0;
let mouseX = null;

function nudge(dir) {
  targetPx = clampPx(targetPx + dir * pitch());
}

/* Rotella */
let wheelAcc = 0;
stage.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) < 4) return;
  e.preventDefault();
  wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) < 36) return;
  nudge(wheelAcc > 0 ? 1 : -1);
  wheelAcc = 0;
}, { passive: false });

/* Swipe verticale */
let touchY = null;
stage.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
stage.addEventListener('touchend', (e) => {
  if (touchY === null) return;
  const dy = e.changedTouches[0].clientY - touchY;
  touchY = null;
  if (Math.abs(dy) < 50) return;
  nudge(dy < 0 ? 1 : -1);
}, { passive: true });

/* Tastiera */
window.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('open')) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    return;
  }
  if (navLock) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); nudge(1); navLock = true; setTimeout(() => { navLock = false; }, 350); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); navLock = true; setTimeout(() => { navLock = false; }, 350); }
});

/* Il passaggio del cursore fa scorrere le card */
if (canHover) {
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = track.getBoundingClientRect();
    if (e.clientX > r.right || e.clientX < r.left) { mouseX = null; return; }
    mouseX = e.clientX - r.left;
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    targetPx = t * maxScroll();
  });
  stage.addEventListener('pointerleave', () => { mouseX = null; });
}

/* Loop: scorrimento morbido + card attiva al centro */
const loop = () => {
  smoothPx += (targetPx - smoothPx) * 0.085;
  if (Math.abs(targetPx - smoothPx) < 0.1) smoothPx = targetPx;
  row.style.transform = `translate3d(${-smoothPx.toFixed(1)}px, 0, 0)`;

  const focus = smoothPx + (mouseX != null ? mouseX : track.clientWidth / 2);
  let best = 0;
  let bd = Infinity;
  centers.forEach((c, i) => {
    const d = Math.abs(c - focus);
    if (d < bd) { bd = d; best = i; }
  });
  if (best !== active) setActive(best);

  requestAnimationFrame(loop);
};

/* Card iniziale = prima visibile */
(function initActive() {
  const focus = track.clientWidth / 2;
  let best = 0;
  let bd = Infinity;
  centers.forEach((c, i) => {
    const d = Math.abs(c - focus);
    if (d < bd) { bd = d; best = i; }
  });
  active = best;
  cards[best].classList.add('active');
  infoTitle.textContent = projects[best].title;
  infoText.textContent = projects[best].desc;
  infoCount.textContent = `${projects[best].count} foto`;
})();

requestAnimationFrame(loop);

/* ---------- Lightbox ---------- */
const lightbox = $('lightbox');
const lbImg = $('lbImg');
const lbCaption = $('lbCaption');
const lbThumbs = $('lbThumbs');

let projectIndex = 0;
let photoIndex = 0;

function render() {
  const p = projects[projectIndex];
  lbImg.src = `${p.dir}/${photoName(photoIndex + 1)}`;
  lbImg.alt = `${p.title} — foto ${photoIndex + 1}`;
  lbCaption.textContent = `${p.title} — ${photoIndex + 1} / ${p.count}`;
  [...lbThumbs.children].forEach((t, i) => t.classList.toggle('active', i === photoIndex));
}

function buildThumbs() {
  const p = projects[projectIndex];
  lbThumbs.innerHTML = '';
  for (let i = 0; i < p.count; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lb-thumb';
    b.setAttribute('aria-label', `Foto ${i + 1}`);
    const img = document.createElement('img');
    img.src = `${p.dir}/${photoName(i + 1)}`;
    img.alt = '';
    b.appendChild(img);
    b.addEventListener('click', () => { photoIndex = i; render(); });
    lbThumbs.appendChild(b);
  }
}

let lbFrom = null;
let lbCloseTimer = null;
const lbStage = document.querySelector('.lb-stage');

function cardClip(el) {
  const cr = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const t = Math.max(0, cr.top);
  const l = Math.max(0, cr.left);
  const r = Math.max(0, vw - cr.right);
  const b = Math.max(0, vh - cr.bottom);
  return `inset(${t}px ${r}px ${b}px ${l}px round 16px)`;
}

function openLightbox(pi, idx, fromEl) {
  clearTimeout(lbCloseTimer);
  lightbox.classList.remove('closing');
  projectIndex = pi;
  photoIndex = idx;
  buildThumbs();
  render();
  lbFrom = fromEl || cards[pi] || null;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (!lbFrom) return;
  const clip = cardClip(lbFrom);
  lbStage.style.transition = 'none';
  lbImg.style.transition = 'none';
  lbStage.style.clipPath = clip;
  lbImg.style.transform = 'scale(1.14)';
  void lbStage.offsetWidth;
  requestAnimationFrame(() => {
    lbStage.style.transition = 'clip-path .6s cubic-bezier(.22, 1, .36, 1)';
    lbImg.style.transition = 'transform .7s cubic-bezier(.22, 1, .36, 1)';
    lbStage.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
    lbImg.style.transform = 'scale(1)';
    lbCloseTimer = setTimeout(() => {
      lbStage.style.transition = '';
      lbStage.style.clipPath = '';
    }, 700);
  });
}

function closeLightbox() {
  if (!lightbox.classList.contains('open')) return;
  clearTimeout(lbCloseTimer);
  lbStage.style.transition = 'none';
  lbStage.style.clipPath = 'none';
  lightbox.classList.add('closing');
  lbImg.style.transition = 'transform .45s ease';
  lbImg.style.transform = 'scale(.94)';

  lbCloseTimer = setTimeout(() => {
    lightbox.classList.remove('open');
    lightbox.classList.remove('closing');
    document.body.style.overflow = '';
    lbStage.style.transition = '';
    lbStage.style.clipPath = '';
    lbImg.style.transition = 'none';
    lbImg.style.transform = 'none';
    lbFrom = null;
  }, 460);
}

function step(delta) {
  const n = projects[projectIndex].count;
  photoIndex = (photoIndex + delta + n) % n;
  render();
}

$('lbClose').addEventListener('click', closeLightbox);
$('lbPrev').addEventListener('click', () => step(-1));
$('lbNext').addEventListener('click', () => step(1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

window.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('open')) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
});

let touchX = null;
lightbox.addEventListener('touchstart', (e) => {
  touchX = e.touches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
}, { passive: true });
