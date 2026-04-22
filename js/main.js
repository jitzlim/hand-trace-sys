import * as THREE from 'three';
import { createScene }                                       from './scene.js';
import { createObject, updateObject, updateAudioReactivity } from './object.js';
import { initHandTracking }                                  from './handTracking.js';
import { computeGestures }                                   from './gestures.js';
import { applyGestures, getState }                           from './controls.js';
import { updateHUD }                                         from './ui.js';
import { initAudio, getAudioLevel }                          from './audio.js';
import { applyLang }                                         from './i18n.js';
import { initSettings }                                      from './settings.js';
import { initThumbnail }                                     from './thumbnail.js';

// ── Boot ──────────────────────────────────────────────────

const { scene, camera, composer, grainPass, bloomPass } = createScene();
createObject(scene);

let latestLandmarks = [];
initHandTracking((landmarks) => { latestLandmarks = landmarks; });

// Audio requires user gesture before AudioContext can start — defer to first click
document.addEventListener('pointerdown', initAudio, { once: true });

initSettings({ bloomPass, grainPass });
applyLang();
initThumbnail();

// ── Render loop ───────────────────────────────────────────

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  grainPass.uniforms.time.value = clock.getElapsedTime() * 1.8;

  const audioLevel = getAudioLevel();
  updateAudioReactivity(audioLevel);

  const gestures = computeGestures(latestLandmarks);
  if (gestures) applyGestures(gestures, camera);

  updateObject();

  const { currentScale, currentR } = getState();

  updateHUD({
    gestureLabel: gestures?.gestureLabel       ?? null,
    pinchDist:    gestures?.primary?.pinchDist ?? 0,
    scale:        currentScale,
    radius:       currentR,
    cameraPos:    camera.position,
    handCount:    gestures?.handCount          ?? 0,
    audioLevel,
    gestureType:  gestures?.gestureType        ?? null,
  });

  composer.render();
}

animate();
