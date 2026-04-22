import { setLang, getLang } from './i18n.js';
import { setVisualMode }    from './object.js';

const DEFAULTS = {
  lang:       'ja',
  handMode:   'dual',
  visualMode: 'wireframe',
  bloom:      'on',
  grain:      'low',
};

let state      = { ...DEFAULTS };
let _bloomPass = null;
let _grainPass = null;

// Load persisted settings
try {
  Object.assign(state, JSON.parse(localStorage.getItem('htrace-settings') || '{}'));
} catch {}

// ── Public API ────────────────────────────────────────────

export function getSetting(key) {
  return state[key] ?? DEFAULTS[key];
}

export function initSettings({ bloomPass, grainPass }) {
  _bloomPass = bloomPass;
  _grainPass = grainPass;

  // Apply all saved settings on boot
  Object.entries(state).forEach(([k, v]) => _apply(k, v));
  _syncButtons();

  // Wire opt-btn clicks
  document.querySelectorAll('.opt-btn[data-setting]').forEach(btn => {
    btn.addEventListener('click', () => setSetting(btn.dataset.setting, btn.dataset.value));
  });

  // Panel toggle
  const panel    = document.getElementById('settings-panel');
  const trigger  = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('settings-close');

  const open  = () => { panel.classList.add('open');    trigger.classList.add('active'); };
  const close = () => { panel.classList.remove('open'); trigger.classList.remove('active'); };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.contains('open') ? close() : open();
  });

  closeBtn.addEventListener('click', close);

  // Click outside → close
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== trigger) close();
  });
}

export function setSetting(key, value) {
  state[key] = value;
  localStorage.setItem('htrace-settings', JSON.stringify(state));
  _apply(key, value);
  _syncButtons();
}

// ── Private ───────────────────────────────────────────────

function _apply(key, value) {
  switch (key) {
    case 'lang':
      setLang(value);
      break;
    case 'bloom':
      if (_bloomPass) _bloomPass.enabled = (value === 'on');
      break;
    case 'grain': {
      const amounts = { off: 0, low: 0.07, high: 0.20 };
      if (_grainPass) _grainPass.uniforms.amount.value = amounts[value] ?? 0.07;
      break;
    }
    case 'visualMode':
      setVisualMode(value);
      break;
    // 'handMode' is read on demand in gestures.js via getSetting()
  }
}

function _syncButtons() {
  document.querySelectorAll('.opt-btn[data-setting]').forEach(btn => {
    const live = btn.dataset.setting === 'lang' ? getLang() : state[btn.dataset.setting];
    btn.classList.toggle('active', btn.dataset.value === live);
  });
}
