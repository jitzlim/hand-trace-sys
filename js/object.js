import * as THREE from 'three';
import { t, tArr, onLangChange } from './i18n.js';

const PALETTE = [
  { hex: 0x39FF14 },
  { hex: 0xFF00FF },
  { hex: 0x00FFFF },
  { hex: 0xFF6600 },
  { hex: 0xBF5FFF },
];

const SHAPES = [
  { fn: () => new THREE.TorusKnotGeometry(1.2, 0.35, 220, 36, 2, 3) },
  { fn: () => new THREE.IcosahedronGeometry(1.5, 4)                  },
  { fn: () => new THREE.OctahedronGeometry(1.5, 3)                   },
  { fn: () => new THREE.TorusGeometry(1.3, 0.5, 32, 120)            },
  { fn: () => new THREE.DodecahedronGeometry(1.4, 2)                 },
];

let colorIndex = 0;
let shapeIndex = 0;
let spinVelocity = 0;

let group, wireMesh, solidMesh, particles;

// Curl-driven squeeze state
let intentScale = 1;   // set by pinch via controls.js
let curlFactor  = 0;   // 0 = open, 1 = fist — set each frame
let prevCurl    = 0;
let swapCooldown = 0;

onLangChange(() => {
  _setHUD('hud-color', t('colorPrefix') + tArr('colors', colorIndex));
  _setHUD('hud-geo',   t('shapePrefix') + tArr('shapes', shapeIndex));
});

export function createObject(scene) {
  group = new THREE.Group();
  scene.add(group);

  const geo = SHAPES[0].fn();

  wireMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: PALETTE[0].hex,
    wireframe: true,
    transparent: true,
    opacity: 1.0,
  }));
  group.add(wireMesh);

  solidMesh = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: PALETTE[0].hex,
    transparent: true,
    opacity: 0.03,
  }));
  group.add(solidMesh);

  particles = buildParticles(PALETTE[0].hex);
  group.add(particles);

  return group;
}

function buildParticles(color) {
  const COUNT = 4000;
  const pos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r  = 1.8 + Math.random() * 3.2;
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.013, transparent: true, opacity: 0.55 });
  return new THREE.Points(geo, mat);
}

// ── Public API ────────────────────────────────────────────

// Called by controls.js with the pinch-derived scale
export function setObjectScale(scale) {
  intentScale = scale;
}

// Called every frame with the live curl value from gestures.js
export function updateCurl(factor) {
  prevCurl   = curlFactor;
  curlFactor = factor;

  if (swapCooldown > 0) swapCooldown--;

  // Swap geometry when hand opens after a full squeeze
  if (prevCurl > 0.7 && curlFactor < 0.3 && swapCooldown === 0) {
    _swapGeometry();
    swapCooldown = 40; // ~1.3 s cooldown
  }
}

export function triggerSpin() {
  spinVelocity = 0.28;
}

export function shiftColor() {
  colorIndex = (colorIndex + 1) % PALETTE.length;
  const hex  = PALETTE[colorIndex].hex;
  wireMesh.material.color.setHex(hex);
  solidMesh.material.color.setHex(hex);
  particles.material.color.setHex(hex);
  _setHUD('hud-color', t('colorPrefix') + tArr('colors', colorIndex));
}

export function setVisualMode(mode) {
  if (!wireMesh) return;
  switch (mode) {
    case 'wireframe':
      wireMesh.visible            = true;
      solidMesh.visible           = true;
      wireMesh.material.wireframe = true;
      wireMesh.material.opacity   = 1.0;
      break;
    case 'solid':
      wireMesh.visible            = true;
      solidMesh.visible           = false;
      wireMesh.material.wireframe = false;
      wireMesh.material.opacity   = 0.88;
      break;
    case 'points':
      wireMesh.visible  = false;
      solidMesh.visible = false;
      break;
  }
}

let audioPulse = 0;
export function updateAudioReactivity(level) {
  if (!particles) return;
  const boosted = Math.sqrt(Math.max(level, 0));
  audioPulse = boosted;
  particles.material.size    = 0.013 + boosted * 0.09;
  particles.material.opacity = 0.45  + boosted * 0.55;
}

export function updateObject() {
  if (!group) return;

  // Curl squeeze: fingers closing = object shrinks; releasing = it springs back
  // Also fade wireframe opacity with the squeeze
  const squeeze    = 1 - curlFactor * 0.85;
  const finalScale = intentScale * squeeze * (1 + audioPulse * 0.12);
  group.scale.setScalar(finalScale);
  if (wireMesh) wireMesh.material.opacity  = 0.2 + (1 - curlFactor) * 0.8;
  if (solidMesh) solidMesh.material.opacity = (0.2 + (1 - curlFactor) * 0.8) * 0.03;

  // Normal rotation
  group.rotation.y += 0.003;
  group.rotation.x += 0.0008;

  if (spinVelocity > 0.001) {
    group.rotation.y += spinVelocity;
    spinVelocity     *= 0.94;
  }
}

// ── Internal ──────────────────────────────────────────────

function _swapGeometry() {
  shapeIndex = (shapeIndex + 1) % SHAPES.length;
  const newGeo = SHAPES[shapeIndex].fn();
  wireMesh.geometry.dispose();
  solidMesh.geometry.dispose();
  wireMesh.geometry  = newGeo;
  solidMesh.geometry = newGeo.clone();
  _setHUD('hud-geo', t('shapePrefix') + tArr('shapes', shapeIndex));
}

function _setHUD(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
