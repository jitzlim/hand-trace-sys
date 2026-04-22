import { startGrab, applyGrab, saveUndo, undo, getUndoCount, updateIndicator } from './mesh.js';

const PINCH_DIST_MAX = 0.05; // raw landmark distance — fingertips must actually touch
const LERP_CAM     = 0.035;
const LERP_R       = 0.03;
const BASE_R       = 5;
const MIN_R        = 2;
const MAX_R        = 9;
const PHI_MIN      = 0.2;
const PHI_MAX      = Math.PI - 0.2;

let theta = 0, phi = Math.PI / 2;
let tTheta = 0, tPhi = Math.PI / 2;
let currentR = BASE_R, targetR = BASE_R;

let grab     = null;
let pinching = false;
let prevCurl = 0;

export function applySculptGestures(gestures, camera) {
  if (!gestures) return;
  const { primary, twoHandDist, handCount } = gestures;

  const isTwoHand = handCount >= 2;

  // ── NDC of pinch midpoint (mirror X for webcam) ──────
  const ndcX = -(primary.pinchMid.x * 2 - 1);
  const ndcY = -(primary.pinchMid.y * 2 - 1);

  if (isTwoHand) {
    // ── TWO HANDS: orbit + zoom only, no sculpting ──────
    if (grab) { grab = null; pinching = false; }
    prevCurl = primary.curlFactor; // keep in sync so hand-drop doesn't false-trigger undo

    tTheta = (primary.palm.x - 0.5) * Math.PI * 2.2;
    tPhi   = PHI_MIN + (1 - primary.palm.y) * (PHI_MAX - PHI_MIN);

    const t = Math.min(Math.max((twoHandDist - 0.05) / 0.75, 0), 1);
    targetR = MIN_R + t * (MAX_R - MIN_R);

    updateIndicator(ndcX, ndcY, camera, false);

  } else {
    // ── ONE HAND: sculpt only, camera locked ─────────────

    // Fist release → undo
    if (prevCurl > 0.6 && primary.curlFactor < 0.25) {
      if (undo()) flashGuide('undo');
    }

    const isPinching = primary.pinchDist < PINCH_DIST_MAX && primary.curlFactor < 0.45;

    if (isPinching && !pinching) {
      saveUndo();
      grab     = startGrab(ndcX, ndcY, camera);
      pinching = true;
    } else if (isPinching && grab) {
      applyGrab(grab, ndcX, ndcY, camera);
    } else if (!isPinching) {
      grab     = null;
      pinching = false;
    }

    updateIndicator(ndcX, ndcY, camera, isPinching && !!grab);
  }

  prevCurl = primary.curlFactor;

  // ── Camera (lerp toward target — locked when single hand) ──
  theta    += (tTheta - theta) * LERP_CAM;
  phi      += (tPhi   - phi)   * LERP_CAM;
  currentR += (targetR - currentR) * LERP_R;

  camera.position.set(
    currentR * Math.sin(phi) * Math.cos(theta),
    currentR * Math.cos(phi),
    currentR * Math.sin(phi) * Math.sin(theta),
  );
  camera.lookAt(0, 0, 0);

  // ── Derive state for HUD ──────────────────────────────
  let modeLabel, activeSGesture;
  if (isTwoHand) {
    modeLabel      = 'ORBIT';
    activeSGesture = 'twohand';
  } else if (pinching && grab) {
    modeLabel      = 'SCULPTING';
    activeSGesture = 'sculpt';
  } else {
    modeLabel      = 'READY';
    activeSGesture = 'idle';
  }

  return { modeLabel, undoCount: getUndoCount(), activeSGesture };
}

function flashGuide(name) {
  const row = document.querySelector(`[data-sgesture="${name}"]`);
  if (!row) return;
  row.classList.add('active');
  setTimeout(() => row.classList.remove('active'), 600);
}
