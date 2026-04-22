import { setObjectScale, triggerSpin, shiftColor, updateCurl } from './object.js';

const PHI_MIN    = 0.18;
const PHI_MAX    = Math.PI - 0.18;
const BASE_R     = 5;
const MIN_R      = 2.5;
const MAX_R      = 9.5;
const LERP_CAM   = 0.035;
const LERP_SCALE = 0.05;
const LERP_R     = 0.03;

let theta = 0, phi = Math.PI / 2;
let tTheta = 0, tPhi = Math.PI / 2;
let currentScale = 1, targetScale = 1;
let currentR = BASE_R, targetR = BASE_R;

export function applyGestures(gestures, camera) {
  const { primary, secondary, swipe, twoHandDist } = gestures;

  // ── Camera orbit (primary hand) ───────────────────────
  tTheta = (primary.palm.x - 0.5) * Math.PI * 2.2;
  tPhi   = PHI_MIN + (1.0 - primary.palm.y) * (PHI_MAX - PHI_MIN);
  theta += (tTheta - theta) * LERP_CAM;
  phi   += (tPhi   - phi)   * LERP_CAM;

  // ── Zoom (inter-hand distance) ────────────────────────
  if (twoHandDist !== null) {
    const t = Math.min(Math.max((twoHandDist - 0.05) / 0.75, 0), 1);
    targetR = MIN_R + t * (MAX_R - MIN_R);
  } else {
    targetR = BASE_R;
  }
  currentR += (targetR - currentR) * LERP_R;

  camera.position.set(
    currentR * Math.sin(phi) * Math.cos(theta),
    currentR * Math.cos(phi),
    currentR * Math.sin(phi) * Math.sin(theta),
  );
  camera.lookAt(0, 0, 0);

  // ── Scale (secondary hand if present, else primary) ───
  const scaleHand = secondary ?? primary;
  targetScale  = 0.35 + scaleHand.pinchNorm * 1.85;
  currentScale += (targetScale - currentScale) * LERP_SCALE;
  setObjectScale(currentScale);

  // ── Curl → live squeeze + geometry swap on release ────
  updateCurl(primary.curlFactor);

  // ── Swipe → spin or color ─────────────────────────────
  if (swipe) {
    if (swipe.direction === 'left' || swipe.direction === 'right') triggerSpin();
    else shiftColor();
  }
}

export function getState() {
  return { currentScale, currentR };
}
