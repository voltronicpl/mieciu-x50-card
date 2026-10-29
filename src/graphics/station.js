// Własna, autorska grafika stacji + robota (SVG). Bez zasobów DVC.
// Pozycja robota i efekty zależą od stanu wizualnego; zbiorniki pokazują
// WYŁĄCZNIE status z sensorów (bez litrów i procentów).

import { PL } from '../translations/pl.js';
import { esc } from '../util/parse.js';

const ROBOT_POS = {
  docked: [300, 312], washing: [300, 312], drying: [300, 312], auto_empty: [300, 312],
  cleaning: [108, 330], returning: [168, 326], paused: [118, 330],
  error: [300, 312], unavailable: [300, 312], neutral: [300, 312],
};

export function robotSvg(extraClass = '') {
  return `
  <g class="robot ${extraClass}">
    <ellipse class="r-shadow" cx="0" cy="14" rx="66" ry="12"/>
    <path class="r-side" d="M-62 0 v10 a62 15 0 0 0 124 0 v-10"/>
    <ellipse class="r-top" cx="0" cy="0" rx="62" ry="15"/>
    <ellipse class="r-ring" cx="0" cy="0" rx="50" ry="11.5"/>
    <ellipse class="r-lds" cx="10" cy="-6" rx="15" ry="5"/>
    <rect class="r-lds-cap" x="-5" y="-12" width="30" height="7" rx="3.5"/>
    <circle class="r-eye" cx="-38" cy="3" r="2.2"/>
  </g>`;
}

function tankCallout(key, status, ax, ay, lx, ly, side) {
  const label = PL.tank[status] || PL.tank.unknown;
  const w = 172, h = 56;
  const cx = side === 'left' ? lx + w : lx;
  const elbow = side === 'left' ? cx + 18 : cx - 18;
  return `
  <g class="callout s-${status}">
    <polyline class="co-line" points="${ax},${ay} ${elbow},${ly + h / 2} ${cx},${ly + h / 2}"/>
    <circle class="co-dot" cx="${ax}" cy="${ay}" r="3.5"/>
    <rect class="co-box" x="${lx}" y="${ly}" width="${w}" height="${h}" rx="8"/>
    <text class="co-name" x="${lx + 12}" y="${ly + 23}">${esc(PL.tankName[key])}</text>
    <text class="co-val" x="${lx + 12}" y="${ly + 45}">${esc(label)}</text>
  </g>`;
}

export function stationSvg(visual, tanks) {
  const [rx, ry] = ROBOT_POS[visual] || ROBOT_POS.neutral;
  return `
<svg class="station-svg v-${visual}" viewBox="0 0 600 380" role="img" aria-label="Stacja i robot: ${esc(PL.visual[visual] || '')}">
  <defs>
    <linearGradient id="mx-body" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#1b2a44"/><stop offset="1" stop-color="#0a1222"/>
    </linearGradient>
    <linearGradient id="mx-glass" x1="0" x2="1">
      <stop offset="0" stop-color="#5fe3ff" stop-opacity=".22"/><stop offset=".5" stop-color="#5fe3ff" stop-opacity=".06"/>
      <stop offset="1" stop-color="#5fe3ff" stop-opacity=".18"/>
    </linearGradient>
    <radialGradient id="mx-floor" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#1fb6ff" stop-opacity=".35"/><stop offset="1" stop-color="#1fb6ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="mx-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <ellipse cx="300" cy="332" rx="250" ry="34" fill="url(#mx-floor)"/>
  <g class="grid-floor">${Array.from({ length: 9 }, (_, i) => `<line x1="${80 + i * 55}" y1="300" x2="${40 + i * 65}" y2="372"/>`).join('')}
    <line x1="60" y1="318" x2="540" y2="318"/><line x1="48" y1="340" x2="552" y2="340"/><line x1="40" y1="362" x2="560" y2="362"/></g>

  <!-- ścieżka sprzątania -->
  <path class="clean-path" d="M40 352 C 70 300, 150 300, 180 340 S 260 360, 240 330"/>
  <path class="return-arrow" d="M200 326 L 236 318" marker-end="url(#mx-arr)"/>
  <marker id="mx-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#5fe3ff"/></marker>

  <!-- rampa -->
  <path class="ramp" d="M178 300 H422 L446 332 H154 Z"/>
  <path class="ramp-line" d="M196 312 H404"/>

  <!-- wieża stacji -->
  <g class="tower">
    <rect class="t-body" x="220" y="22" width="160" height="282" rx="14"/>
    <rect class="t-lid" x="216" y="18" width="168" height="16" rx="7"/>
    <rect class="t-glass clean" x="230" y="42" width="66" height="96" rx="8"/>
    <rect class="t-glass dirty" x="304" y="42" width="66" height="96" rx="8"/>
    <path class="t-handle" d="M248 48 h30 M322 48 h30"/>
    <rect class="t-panel" x="232" y="150" width="136" height="76" rx="8"/>
    <path class="t-bag" d="M244 160 h82 v58 q-41 10 -82 0 z"/>
    <rect class="t-det" x="338" y="160" width="22" height="58" rx="5"/>
    <rect class="t-brand" x="270" y="236" width="60" height="4" rx="2"/>
    <path class="t-mouth" d="M246 304 v-30 a54 22 0 0 1 108 0 v30"/>
    <rect class="t-led" x="280" y="246" width="40" height="3" rx="1.5"/>
  </g>

  <!-- efekty procesów stacji -->
  <g class="fx fx-wash">${[0, 1, 2, 3, 4].map((i) => `<path class="drop d${i}" d="M${262 + i * 18} 300 q4 6 0 10 q-4 -4 0 -10z"/>`).join('')}</g>
  <g class="fx fx-dry">${[0, 1, 2].map((i) => `<path class="wave w${i}" d="M${258 + i * 30} 300 q6 -8 0 -16 q-6 -8 0 -16"/>`).join('')}</g>
  <g class="fx fx-empty">${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="dust p${i}" cx="${282 + (i % 3) * 18}" cy="290" r="2.2"/>`).join('')}</g>

  <g transform="translate(${rx},${ry})"><g class="robot-motion">${robotSvg()}</g></g>

  ${tankCallout('clean_water', tanks.clean_water, 246, 92, 4, 36, 'left')}
  ${tankCallout('dirty_water', tanks.dirty_water, 354, 92, 424, 36, 'right')}
  ${tankCallout('dust_bag', tanks.dust_bag, 270, 190, 4, 162, 'left')}
  ${tankCallout('detergent', tanks.detergent, 349, 190, 424, 162, 'right')}

  <g class="state-chip"><rect x="220" y="350" width="160" height="26" rx="13"/><text x="300" y="368" text-anchor="middle">${esc(PL.visual[visual] || '')}</text></g>
</svg>`;
}

export function miniRobotSvg(visual) {
  return `<svg class="mini-robot v-${visual}" viewBox="-80 -40 160 70" aria-hidden="true">
    <ellipse cx="0" cy="18" rx="74" ry="14" class="mini-glow"/>
    <g class="robot-motion">${robotSvg()}</g></svg>`;
}
