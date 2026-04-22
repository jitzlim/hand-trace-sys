import { t } from './i18n.js';

let analyser  = null;
let dataArray = null;
let active    = false;

export async function initAudio() {
  if (active) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.60; // was 0.82 — faster beat response
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    active = true;

    const el = document.getElementById('hud-audio-status');
    if (el) el.textContent = t('status.micActive');
  } catch (err) {
    console.warn('Audio init skipped:', err.message);
  }
}

// Only read lower 65% of bins — bass + mids, where music energy lives.
// Upper bins (7kHz+) are near-silent for music and drag the average down.
const FOCUS_RATIO = 0.65;
const NOISE_FLOOR = 0.04;
const GAIN        = 2.0;

export function getAudioLevel() {
  if (!active || !analyser) return 0;
  analyser.getByteFrequencyData(dataArray);

  const focusBins = Math.floor(dataArray.length * FOCUS_RATIO);
  let sum = 0, peak = 0;
  for (let i = 0; i < focusBins; i++) {
    sum += dataArray[i];
    if (dataArray[i] > peak) peak = dataArray[i];
  }

  // Blend mean + peak: mean tracks overall loudness, peak catches transients
  const raw = (sum / focusBins / 255) * 0.55 + (peak / 255) * 0.45;

  if (raw < NOISE_FLOOR) return 0;
  return Math.min((raw - NOISE_FLOOR) / (1 - NOISE_FLOOR) * GAIN, 1.0);
}
