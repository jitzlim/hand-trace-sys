const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toFixed(2);
const bar = (v, len = 10) => '█'.repeat(Math.round(v * len)).padEnd(len, '░');

export function updateHUD({ gestureLabel, pinchDist, scale, radius, cameraPos, handCount, audioLevel, gestureType }) {
  $('hud-gesture').textContent = gestureLabel || '—';
  $('hud-pinch').textContent   = fmt(pinchDist ?? 0);
  $('hud-scale').textContent   = fmt(scale);
  $('hud-radius').textContent  = fmt(radius);
  $('hud-cam-x').textContent   = fmt(cameraPos.x);
  $('hud-cam-y').textContent   = fmt(cameraPos.y);
  $('hud-cam-z').textContent   = fmt(cameraPos.z);
  $('hud-hands').textContent   = `${'●'.repeat(handCount)}${'○'.repeat(2 - handCount)}`;
  $('hud-audio').textContent   = bar(audioLevel ?? 0);

  // Highlight the active gesture guide row
  document.querySelectorAll('.guide-row').forEach(el => {
    el.classList.toggle('active', el.dataset.gesture === gestureType);
  });
}
