import { createSculptScene }    from './scene.js';
import { createClayMesh, createIndicator, hideIndicator } from './mesh.js';
import { applySculptGestures }  from './controls.js';
import { initHandTracking }     from '../handTracking.js';
import { computeGestures, setMaxHands } from '../gestures.js';
import { initThumbnail }        from '../thumbnail.js';

// ── Boot ─────────────────────────────────────────────────

const { renderer, scene, camera } = createSculptScene();
createClayMesh(scene);
createIndicator(scene);

setMaxHands(2); // sculpt page always needs dual-hand for orbit/zoom

let latestLandmarks = [];
initHandTracking((lm) => { latestLandmarks = lm; });
initThumbnail();

// ── HUD helpers ───────────────────────────────────────────

const $  = (id) => document.getElementById(id);
const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };

function updateHUD(gestures, state) {
  const handCount = gestures?.handCount ?? 0;
  set('sh-hands', '●'.repeat(handCount) + '○'.repeat(2 - handCount));

  if (state) {
    const modeEl = $('sh-mode');
    if (modeEl) {
      modeEl.textContent = state.modeLabel;
      modeEl.classList.toggle('active', state.modeLabel === 'SCULPTING');
    }
    set('sh-grabbed', state.undoCount > 0 ? `${state.undoCount} SAVED` : '—');

    // Guide row highlight
    document.querySelectorAll('.sg-row').forEach(el => {
      el.classList.toggle('active', el.dataset.sgesture === state.activeSGesture);
    });
  }
}

// ── Render loop ───────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  const gestures = computeGestures(latestLandmarks);
  const state    = gestures ? applySculptGestures(gestures, camera) : null;
  if (!gestures) hideIndicator();
  updateHUD(gestures, state);
  renderer.render(scene, camera);
}

animate();
