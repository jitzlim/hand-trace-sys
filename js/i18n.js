const TRANSLATIONS = {
  ja: {
    title:      '手追跡 // HAND.TRACE.SYS',
    guideTitle: 'ジェスチャー_ガイド',
    colorPrefix: '色相：',
    shapePrefix: '形状：',
    labels: {
      hands:   '検出手',
      gesture: 'ジェスチャー',
      pinch:   'ピンチ距離',
      scale:   'スケール値',
      radius:  'カメラ半径',
      camX:    'カメラX',
      camY:    'カメラY',
      camZ:    'カメラZ',
      audio:   '音響レベル',
    },
    status: {
      init:      '■ カメラ初期化中...',
      active:    '■ トラッキング_アクティブ',
      error:     '✕ カメラエラー — 許可を確認',
      micActive: '■ マイク_アクティブ',
      micWait:   '□ マイク待機中',
    },
    gestures: {
      idle:       '待機中',
      swipeLeft:  'スワイプ_左',
      swipeRight: 'スワイプ_右',
      swipeUp:    'スワイプ_上',
      swipeDown:  'スワイプ_下',
      pinchClose: 'ピンチ_クローズ',
      pinchMid:   'ピンチ_ミドル',
      palmOpen:   '手のひら_オープン',
      bothHands:  '両手_アクティブ',
      fistCharge: 'グー_チャージ',
    },
    guide: [
      ['手のひら',      '軌道'],
      ['ピンチ',        'スケール'],
      ['スワイプ 左右', 'スピン'],
      ['スワイプ 上下', '色変更'],
      ['グー（長押し）', '形状変更'],
      ['両手間隔',      'ズーム'],
    ],
    colors: ['毒素グリーン', 'ホットマゼンタ', '電気シアン', 'ネオンオレンジ', 'アシッドパープル'],
    shapes: ['トーラスノット', '二十面体', '八面体', 'トーラス', '十二面体'],
    settings: {
      title:    '設定 // SYS.CONFIG',
      language: '言語',
      tracking: 'トラッキング',
      visual:   'ビジュアル',
      bloom:    'ブルーム',
      grain:    'グレイン強度',
    },
  },

  en: {
    title:      'HAND.TRACE.SYS',
    guideTitle: 'GESTURE_GUIDE',
    colorPrefix: 'COLOR: ',
    shapePrefix: 'SHAPE: ',
    labels: {
      hands:   'HANDS',
      gesture: 'GESTURE',
      pinch:   'PINCH_DIST',
      scale:   'SCALE',
      radius:  'CAM_RADIUS',
      camX:    'CAM_X',
      camY:    'CAM_Y',
      camZ:    'CAM_Z',
      audio:   'AUDIO_LVL',
    },
    status: {
      init:      '■ INITIALIZING_CAM...',
      active:    '■ TRACKING_ACTIVE',
      error:     '✕ CAM_ERROR — CHECK_PERMISSIONS',
      micActive: '■ MIC_ACTIVE',
      micWait:   '□ MIC_STANDBY',
    },
    gestures: {
      idle:       'STANDBY',
      swipeLeft:  'SWIPE_LEFT',
      swipeRight: 'SWIPE_RIGHT',
      swipeUp:    'SWIPE_UP',
      swipeDown:  'SWIPE_DOWN',
      pinchClose: 'PINCH_CLOSE',
      pinchMid:   'PINCH_MID',
      palmOpen:   'PALM_OPEN',
      bothHands:  'DUAL_HAND_ACTIVE',
      fistCharge: 'FIST_CHARGE',
    },
    guide: [
      ['PALM',      'ORBIT'],
      ['PINCH',     'SCALE'],
      ['SWIPE H',   'SPIN'],
      ['SWIPE V',   'COLOR'],
      ['FIST HOLD', 'MORPH'],
      ['DUAL HAND', 'ZOOM'],
    ],
    colors: ['TOXIC_GREEN', 'HOT_MAGENTA', 'ELECTRIC_CYAN', 'NEON_ORANGE', 'ACID_PURPLE'],
    shapes: ['TORUS_KNOT', 'ICOSAHEDRON', 'OCTAHEDRON', 'TORUS', 'DODECAHEDRON'],
    settings: {
      title:    'SETTINGS // SYS.CONFIG',
      language: 'LANGUAGE',
      tracking: 'TRACKING MODE',
      visual:   'VISUAL MODE',
      bloom:    'BLOOM',
      grain:    'GRAIN INTENSITY',
    },
  },

  ko: {
    title:      '손 추적 // HAND.TRACE.SYS',
    guideTitle: '제스처_가이드',
    colorPrefix: '색상: ',
    shapePrefix: '형태: ',
    labels: {
      hands:   '감지된 손',
      gesture: '제스처',
      pinch:   '핀치 거리',
      scale:   '스케일',
      radius:  '카메라 반경',
      camX:    '카메라 X',
      camY:    '카메라 Y',
      camZ:    '카메라 Z',
      audio:   '오디오 레벨',
    },
    status: {
      init:      '■ 카메라 초기화 중...',
      active:    '■ 트래킹_활성',
      error:     '✕ 카메라 오류 — 권한 확인',
      micActive: '■ 마이크_활성',
      micWait:   '□ 마이크 대기',
    },
    gestures: {
      idle:       '대기 중',
      swipeLeft:  '스와이프_왼쪽',
      swipeRight: '스와이프_오른쪽',
      swipeUp:    '스와이프_위',
      swipeDown:  '스와이프_아래',
      pinchClose: '핀치_닫힘',
      pinchMid:   '핀치_중간',
      palmOpen:   '손바닥_열림',
      bothHands:  '양손_활성',
      fistCharge: '주먹_차징',
    },
    guide: [
      ['손바닥',    '궤도'],
      ['핀치',      '스케일'],
      ['스와이프 H', '회전'],
      ['스와이프 V', '색상'],
      ['주먹 유지',  '형상 변경'],
      ['양손 간격',  '줌'],
    ],
    colors: ['독성 그린', '핫 마젠타', '전기 시안', '네온 오렌지', '애시드 퍼플'],
    shapes: ['토러스 노트', '이십면체', '팔면체', '토러스', '십이면체'],
    settings: {
      title:    '설정 // SYS.CONFIG',
      language: '언어',
      tracking: '트래킹 모드',
      visual:   '비주얼 모드',
      bloom:    '블룸',
      grain:    '그레인 강도',
    },
  },
};

const LANG_CODES = Object.keys(TRANSLATIONS);
let current = localStorage.getItem('htrace-lang') || 'ja';

// Listeners registered by other modules (avoids circular imports)
const listeners = [];
export function onLangChange(fn) { listeners.push(fn); }

// ── Public API ────────────────────────────────────────────

export function getLang()  { return current; }

// Dot-path lookup: t('labels.camX'), t('gestures.idle'), etc.
export function t(path) {
  const parts = path.split('.');
  let node = TRANSLATIONS[current];
  for (const p of parts) {
    if (node == null) return path;
    node = node[p];
  }
  return node ?? path;
}

// Array lookup: tArr('colors', 2)
export function tArr(path, index) {
  const arr = t(path);
  return Array.isArray(arr) ? (arr[index] ?? path) : path;
}

export function setLang(code) {
  if (!TRANSLATIONS[code]) return;
  current = code;
  localStorage.setItem('htrace-lang', code);
  applyLang();
  listeners.forEach(fn => fn());
}

export function applyLang() {
  // Static labels via data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string') el.textContent = val;
  });
  // Guide rows (indexed)
  const guide = TRANSLATIONS[current].guide;
  document.querySelectorAll('.guide-row').forEach((el, i) => {
    if (guide[i]) el.textContent = `${guide[i][0]} → ${guide[i][1]}`;
  });
  // Note: opt-btn active states are managed by settings.js _syncButtons()
}
