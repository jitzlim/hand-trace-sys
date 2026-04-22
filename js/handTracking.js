import { t } from './i18n.js';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

const HAND_COLORS = ['#39FF14', '#FF00FF'];

export function initHandTracking(onUpdate) {
  const video    = document.getElementById('input-video');
  const preview  = document.getElementById('tracking-canvas');
  const ctx      = preview.getContext('2d');
  const statusEl = document.getElementById('hud-status');

  const hands = new window.Hands({
    locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`,
  });

  hands.setOptions({
    maxNumHands:            2,
    modelComplexity:        1,
    minDetectionConfidence: 0.72,
    minTrackingConfidence:  0.5,
  });

  hands.onResults((results) => {
    ctx.clearRect(0, 0, preview.width, preview.height);
    ctx.drawImage(results.image, 0, 0, preview.width, preview.height);

    const landmarks = results.multiHandLandmarks || [];

    const sorted = landmarks.map((lm, i) => ({ lm, i }))
      .sort((a, b) => palmX(a.lm) - palmX(b.lm));

    sorted.forEach(({ lm }, rank) => {
      drawSkeleton(ctx, lm, preview.width, preview.height, HAND_COLORS[rank]);
    });

    onUpdate(landmarks);
  });

  const cam = new window.Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: 640, height: 480,
  });

  cam.start()
    .then(() => { if (statusEl) statusEl.textContent = t('status.active'); })
    .catch((err) => {
      console.error('Camera init failed:', err);
      if (statusEl) statusEl.textContent = t('status.error');
    });
}

function palmX(lm) {
  return (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5;
}

function drawSkeleton(ctx, lm, w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (const p of lm) {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
