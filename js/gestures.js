import { t }          from './i18n.js';
import { getSetting } from './settings.js';

const PALM_INDICES     = [0, 5, 9, 13, 17];
const THUMB_TIP        = 4;
const INDEX_TIP        = 8;
const PINCH_OPEN_DIST  = 0.22;
const SWIPE_THRESHOLD  = 0.038;
const SWIPE_COOLDOWN_F = 22;

let prevPrimPalm    = null;
let swipeCooldown   = 0;
let swipeEchoType   = null;
let swipeEchoFrames = 0;
let maxHandsLimit   = 2; // overridable per page

export function setMaxHands(n) { maxHandsLimit = n; }

export function computeGestures(multiHandLandmarks) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    prevPrimPalm = null;
    return null;
  }

  const maxHands = Math.min(maxHandsLimit, getSetting('handMode') === 'single' ? 1 : 2);
  const hands    = multiHandLandmarks.slice(0, maxHands).map(processHand);
  hands.sort((a, b) => a.palm.x - b.palm.x);

  const primary   = hands[0];
  const secondary = hands.length > 1 ? hands[1] : null;

  // ── Swipe ─────────────────────────────────────────────
  let swipe = null;
  if (swipeCooldown > 0) swipeCooldown--;
  if (prevPrimPalm && swipeCooldown === 0) {
    const vx    = primary.palm.x - prevPrimPalm.x;
    const vy    = primary.palm.y - prevPrimPalm.y;
    const speed = Math.hypot(vx, vy);
    if (speed > SWIPE_THRESHOLD) {
      swipe = {
        direction: Math.abs(vx) > Math.abs(vy)
          ? (vx > 0 ? 'right' : 'left')
          : (vy > 0 ? 'down' : 'up'),
        speed, vx, vy,
      };
      swipeCooldown = SWIPE_COOLDOWN_F;
    }
  }
  prevPrimPalm = { ...primary.palm };

  // ── Two-hand distance ──────────────────────────────────
  let twoHandDist = null;
  if (secondary) {
    twoHandDist = Math.hypot(
      primary.palm.x - secondary.palm.x,
      primary.palm.y - secondary.palm.y,
    );
  }

  // ── Gesture type ───────────────────────────────────────
  // Latch swipe type for the cooldown window so the guide row stays visibly highlighted
  if (swipe) {
    swipeEchoType = (swipe.direction === 'left' || swipe.direction === 'right') ? 'swipeH' : 'swipeV';
    swipeEchoFrames = SWIPE_COOLDOWN_F;
  } else if (swipeEchoFrames > 0) {
    swipeEchoFrames--;
    if (swipeEchoFrames === 0) swipeEchoType = null;
  }

  const curl = primary.curlFactor;
  let gestureType;
  if      (curl > 0.55)             gestureType = 'fist';
  else if (swipeEchoType)           gestureType = swipeEchoType;
  else if (primary.pinchNorm < 0.6) gestureType = 'pinch';
  else if (secondary)               gestureType = 'dual';
  else                              gestureType = 'palm';

  // ── Localized label ────────────────────────────────────
  let gestureLabel;
  if (curl > 0.15) {
    gestureLabel = `${t('gestures.fistCharge')}_${Math.round(curl * 100)}%`;
  } else if (swipe) {
    const key = `gestures.swipe${swipe.direction.charAt(0).toUpperCase()}${swipe.direction.slice(1)}`;
    gestureLabel = t(key);
  } else if (primary.pinchNorm < 0.25) {
    gestureLabel = t('gestures.pinchClose');
  } else if (primary.pinchNorm < 0.6) {
    gestureLabel = t('gestures.pinchMid');
  } else if (secondary) {
    gestureLabel = t('gestures.bothHands');
  } else {
    gestureLabel = t('gestures.palmOpen');
  }

  return { primary, secondary, swipe, twoHandDist, gestureLabel, gestureType, handCount: hands.length };
}

// ── Per-hand processing ────────────────────────────────────

function processHand(lm) {
  const palm = { x: 0, y: 0 };
  for (const i of PALM_INDICES) { palm.x += lm[i].x; palm.y += lm[i].y; }
  palm.x /= PALM_INDICES.length;
  palm.y /= PALM_INDICES.length;

  const pinchDist  = Math.hypot(lm[THUMB_TIP].x - lm[INDEX_TIP].x, lm[THUMB_TIP].y - lm[INDEX_TIP].y);
  const pinchNorm  = Math.min(pinchDist / PINCH_OPEN_DIST, 1.0);
  const curlFactor = computeCurl(lm);
  const pinchMid   = {
    x: (lm[THUMB_TIP].x + lm[INDEX_TIP].x) / 2,
    y: (lm[THUMB_TIP].y + lm[INDEX_TIP].y) / 2,
  };

  return { palm, pinchDist, pinchNorm, curlFactor, pinchMid };
}

// Returns 0 (fingers open) → 1 (fully curled / fist)
// Uses fingertip → MCP (base knuckle) distance: extended = far, curled = close.
function computeCurl(lm) {
  const handSize = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
  if (handSize < 0.01) return 0;

  // 4 fingers (skip thumb — moves differently)
  const pairs = [[8, 5], [12, 9], [16, 13], [20, 17]];
  let total = 0;
  for (const [tip, mcp] of pairs) {
    total += Math.hypot(lm[tip].x - lm[mcp].x, lm[tip].y - lm[mcp].y) / handSize;
  }
  const avg = total / pairs.length;

  // Extended hand: avg ≈ 0.9–1.1 (tip-to-MCP ~= palm length). Full fist: ≈ 0.25–0.45.
  // Map 1.0 → 0 (open), 0.3 → 1 (fist).
  return Math.min(Math.max((1.0 - avg) / 0.7, 0), 1);
}
