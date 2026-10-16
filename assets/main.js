import * as THREE from 'three';

/* ─── THREE.JS SCAN SCENE ─── */

const canvas = document.getElementById('scan3d');
const heroSection = document.getElementById('hero');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070C1A, 0.048);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
camera.position.set(6.5, 2.4, 5.8);
camera.lookAt(0.8, 0.25, 0);

/* Materials */
const matMain  = new THREE.LineBasicMaterial({ color: 0x00FFCC, transparent: true, opacity: 0.72 });
const matFaint = new THREE.LineBasicMaterial({ color: 0x00FFCC, transparent: true, opacity: 0.22 });
const matDim   = new THREE.LineBasicMaterial({ color: 0x004438, transparent: true, opacity: 0.55 });

/* ── Build car wireframe ── */
const carGroup = new THREE.Group();
carGroup.position.set(0.6, 0, 0); // shift right so hero text has left space

function edgeBox(w, h, d, x, y, z, mat) {
  const ls = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    mat || matMain
  );
  ls.position.set(x, y, z);
  carGroup.add(ls);
  return ls;
}

function edgeCyl(r, h, segs, x, y, z, rotX) {
  const ls = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(r, r, h, segs || 12)),
    matMain
  );
  ls.position.set(x, y, z);
  if (rotX !== undefined) ls.rotation.x = rotX;
  carGroup.add(ls);
  return ls;
}

// Chassis (widest, lowest)
edgeBox(4.65, 0.22, 2.02, 0, -0.39, 0, matFaint);
// Lower body
edgeBox(4.22, 0.68, 1.9, 0, 0.08, 0);
// Cabin
edgeBox(2.05, 0.7, 1.76, -0.12, 0.76, 0);
// Hood surface
edgeBox(1.55, 0.04, 1.88, -1.52, 0.37, 0, matFaint);
// Trunk surface
edgeBox(0.98, 0.04, 1.88, 1.52, 0.31, 0, matFaint);
// Front bumper face
edgeBox(0.12, 0.42, 1.88, -2.15, -0.07, 0, matFaint);
// Rear bumper face
edgeBox(0.12, 0.36, 1.88, 2.15, -0.1, 0, matFaint);
// Grille slit
edgeBox(0.04, 0.16, 0.9, -2.18, 0.06, 0, matFaint);

// Wheels — 4 cylinders
const WR = 0.44, WH = 0.24, WY = -0.44;
const WXF = -1.38, WXR = 1.38, WZO = 0.98;
[
  [WXF, WY,  WZO], [WXF, WY, -WZO],
  [WXR, WY,  WZO], [WXR, WY, -WZO],
].forEach(([x, y, z]) => {
  edgeCyl(WR, WH, 12, x, y, z, Math.PI / 2);
  // inner hub ring
  const hub = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.2, 0.2, WH + 0.01, 6)),
    matFaint
  );
  hub.position.set(x, y, z);
  hub.rotation.x = Math.PI / 2;
  carGroup.add(hub);
});

// Headlights
edgeBox(0.07, 0.17, 0.52, -2.12, 0.11,  0.65, matFaint);
edgeBox(0.07, 0.17, 0.52, -2.12, 0.11, -0.65, matFaint);
// Taillights
edgeBox(0.07, 0.22, 0.58, 2.12, 0.12,  0.65, matFaint);
edgeBox(0.07, 0.22, 0.58, 2.12, 0.12, -0.65, matFaint);
// Side windows (cabin sides)
edgeBox(1.85, 0.38, 0.04, -0.12, 0.83,  0.9, matFaint);
edgeBox(1.85, 0.38, 0.04, -0.12, 0.83, -0.9, matFaint);

scene.add(carGroup);

/* ── Scan plane (sweeps along X) ── */
const scanPlaneMat = new THREE.MeshBasicMaterial({
  color: 0x00FFCC, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false
});
const scanPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(0.03, 2.8),
  scanPlaneMat
);
scanPlane.rotation.y = Math.PI / 2;
scene.add(scanPlane);

// Scan edge line (bright border of scan plane)
const scanEdgeMat = new THREE.LineBasicMaterial({ color: 0x00FFCC, transparent: true, opacity: 0.4 });
const scanEdge = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -1.3, -1.2),
    new THREE.Vector3(0,  1.15, -1.2),
    new THREE.Vector3(0,  1.15,  1.2),
    new THREE.Vector3(0, -1.3,  1.2),
  ]),
  scanEdgeMat
);
scene.add(scanEdge);

/* ── Floor grid ── */
const grid = new THREE.GridHelper(14, 18, 0x001814, 0x001814);
grid.position.y = -0.76;
grid.material.transparent = true;
grid.material.opacity = 0.45;
scene.add(grid);

/* ── Lights ── */
scene.add(new THREE.AmbientLight(0x000C08, 5));
const scanLight = new THREE.PointLight(0x00FFCC, 2.2, 8, 1.5);
scene.add(scanLight);
const fillLight = new THREE.PointLight(0x002A4A, 1.2, 12);
fillLight.position.set(-3, 4, 3);
scene.add(fillLight);

/* ── Resize ── */
function resize() {
  const w = heroSection.clientWidth, h = heroSection.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize, { passive: true });

/* ── Animation loop ── */
let scanX = -3.0, scanDir = 1;
const SCAN_SPEED = 2.4;
let lastT = 0, paused = false;

const heroObs = new IntersectionObserver(
  e => { paused = !e[0].isIntersecting; },
  { threshold: 0.05 }
);
heroObs.observe(heroSection);

function tick(t) {
  requestAnimationFrame(tick);
  if (paused) { lastT = t; return; }

  const dt = Math.min((t - lastT) * 0.001, 0.05);
  lastT = t;

  // Scan sweeps back and forth
  scanX += SCAN_SPEED * dt * scanDir;
  if (scanX > 3.0)  { scanDir = -1; scanX =  3.0; }
  if (scanX < -3.0) { scanDir =  1; scanX = -3.0; }

  const wx = scanX + carGroup.position.x;
  scanPlane.position.x = wx;
  scanEdge.position.x  = wx;
  scanLight.position.set(wx, 0.8, 0);

  // Pulse opacity with scan direction turn
  const edge = 1 - Math.min(Math.abs(scanX) / 3.0, 1);
  scanPlaneMat.opacity = 0.05 + 0.14 * edge;
  scanEdgeMat.opacity  = 0.2  + 0.35 * edge;

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

/* ─── NAV SCROLL BEHAVIOUR ─── */
const nav = document.getElementById('nav');
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', scrollY > 32);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

/* ─── BURGER MENU ─── */
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

/* ─── SECTION REVEAL ─── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

document.querySelectorAll('.reveal-item').forEach(el => revealObs.observe(el));

/* ─── COUNTER ANIMATION ─── */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1600;
  const start = performance.now();
  const run = now => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(easeOutCubic(p) * target).toLocaleString('ro');
    if (p < 1) requestAnimationFrame(run);
    else el.textContent = target.toLocaleString('ro');
  };
  requestAnimationFrame(run);
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

/* ─── BOOKING FORM ─── */
const form         = document.getElementById('bookingForm');
const successModal = document.getElementById('successModal');
const modalClose   = document.getElementById('modalClose');

function validateField(field) {
  const empty = !field.value.trim();
  field.style.borderColor = empty ? 'var(--heat)' : '';
  return !empty;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const required = form.querySelectorAll('[required]');
  let valid = true;
  required.forEach(f => { if (!validateField(f)) valid = false; });
  if (!valid) return;

  successModal.hidden = false;
  form.reset();
});

form.querySelectorAll('[required]').forEach(f => {
  f.addEventListener('input', () => { f.style.borderColor = ''; }, { passive: true });
});

function closeModal() { successModal.hidden = true; }
modalClose.addEventListener('click', closeModal);
successModal.addEventListener('click', e => { if (e.target === successModal) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !successModal.hidden) closeModal();
});

// Set min date for date picker to today
const dateInput = form.querySelector('[name="data"]');
if (dateInput) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  dateInput.min = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
}
