import { t } from './i18n.js';

let analyser  = null;
let dataArray = null;
let active    = false;

export async function initAudio() {
  if (active) return; // don't double-init
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const ctx = new AudioContext();
    // AudioContext starts suspended if created without prior user gesture — force resume
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    active = true;

    const el = document.getElementById('hud-audio-status');
    if (el) el.textContent = t('status.micActive');
  } catch (err) {
    console.warn('Audio init skipped:', err.message);
  }
}

// Returns 0–1 average frequency amplitude with noise gate
const NOISE_FLOOR = 0.06;
export function getAudioLevel() {
  if (!active || !analyser) return 0;
  analyser.getByteFrequencyData(dataArray);
  let sum = 0;
  for (const v of dataArray) sum += v;
  const raw = (sum / dataArray.length) / 255;
  if (raw < NOISE_FLOOR) return 0;
  return (raw - NOISE_FLOOR) / (1 - NOISE_FLOOR);
}
