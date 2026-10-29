// Autorskie grafiki SVG (stacja, robot, zbiorniki). Bez zasobów DVC/Dreame.
// Opcjonalnie użytkownik może podpiąć własne obrazy: station_image / robot_image.
// Zbiorniki: tylko szkło + kolor typu (nie poziom napełnienia).

import { PL } from '../translations/pl.js';
import { esc } from '../util/parse.js';

let uid = 0;

// Robot w rzucie 3/4. Środek w (0,0), szerokość ~170.
export function robotSvg(id) {
  return `
  <g class="robot">
    <ellipse class="r-shadow" cx="0" cy="26" rx="92" ry="20"/>
    <path class="r-side" fill="url(#${id}-rside)" d="M-84 0 v20 a84 24 0 0 0 168 0 v-20 z"/>
    <path class="r-glow" d="M-84 20 a84 24 0 0 0 168 0"/>
    <ellipse class="r-top" fill="url(#${id}-rtop)" cx="0" cy="0" rx="84" ry="24"/>
    <ellipse class="r-ring" cx="0" cy="0" rx="70" ry="19.5"/>
    <ellipse class="r-hl" cx="-26" cy="-8" rx="34" ry="6"/>
    <path class="r-lds-side" d="M-6 -10 v10 a22 7 0 0 0 44 0 v-10 z"/>
    <ellipse class="r-lds" cx="16" cy="-10" rx="22" ry="7"/>
    <ellipse class="r-lds-light" cx="16" cy="-10" rx="13" ry="3.6"/>
    <path class="r-bumper" d="M-80 10 a84 24 0 0 0 40 18"/>
    <g class="r-brush" transform="translate(-58,24)"><line x1="-12" y1="0" x2="12" y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/></g>
  </g>`;
}

function robotDefs(id) {
  return `
    <linearGradient id="${id}-rtop" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a3a55"/><stop offset=".55" stop-color="#121c2e"/><stop offset="1" stop-color="#0a111d"/></linearGradient>
    <linearGradient id="${id}-rside" x1="0" x2="1"><stop offset="0" stop-color="#05080f"/><stop offset=".5" stop-color="#1b273b"/><stop offset="1" stop-color="#05080f"/></linearGradient>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

// Mały/średni robot do nagłówka i panelu robota.
export function heroRobotSvg(visual, opts = {}) {
  if (opts.image) return `<img class="hero-img v-${visual}" src="${esc(opts.image)}" alt="">`;
  const id = `mxr${++uid}`;
  const sparks = opts.sparks ? `<g class="sparks" filter="url(#${id}-glow)">
      ${Array.from({ length: 14 }, (_, i) => {
        const left = i < 7; const a = (i % 7) / 6;
        const x = left ? -96 - a * 26 : 96 + a * 26; const y = 6 + Math.sin(i * 1.7) * 14;
        return `<circle class="sp sp${i % 5} ${left ? 'warm' : 'cool'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.4 + (i % 3) * 0.8).toFixed(1)}"/>`;
      }).join('')}
      <path class="arc warm" d="M-90 18 q-30 -10 -40 -34"/><path class="arc cool" d="M90 18 q30 -10 40 -34"/></g>` : '';
  return `<svg class="hero-robot v-${visual}" viewBox="-140 -50 280 100" aria-hidden="true">
    <defs>${robotDefs(id)}</defs>
    <ellipse class="hero-floor" cx="0" cy="30" rx="120" ry="18"/>
    ${sparks}
    <g class="robot-motion" style="--g:url(#${id}-glow)">${robotSvg(id)}</g></svg>`;
}

// Stacja + robot. Pozycja robota i efekty zależą od stanu.
const ROBOT_POS = {
  docked: [214, 318, 0.88], washing: [214, 318, 0.88], drying: [214, 318, 0.88], auto_empty: [214, 318, 0.88],
  error: [214, 318, 0.88], unavailable: [214, 318, 0.88], neutral: [214, 318, 0.88],
  cleaning: [96, 352, 0.62], paused: [96, 352, 0.62], returning: [128, 344, 0.7],
};

export function stationSvg(visual, opts = {}) {
  if (opts.image) {
    return `<div class="station-img-wrap v-${visual}"><img class="station-img" src="${esc(opts.image)}" alt="Stacja">
      <div class="station-fx"><span class="fx fx-wash"></span><span class="fx fx-dry"></span><span class="fx fx-empty"></span></div></div>`;
  }
  const id = `mxs${++uid}`;
  const [rx, ry, rs] = ROBOT_POS[visual] || ROBOT_POS.neutral;
  return `
<svg class="station-svg v-${visual}" viewBox="40 36 350 360" role="img" aria-label="Stacja: ${esc(PL.visual[visual] || '')}">
  <defs>
    ${robotDefs(id)}
    <linearGradient id="${id}-front" x1="0" x2="1"><stop offset="0" stop-color="#2b3443"/><stop offset=".45" stop-color="#1a212d"/><stop offset="1" stop-color="#0d1219"/></linearGradient>
    <linearGradient id="${id}-sidef" x1="0" x2="1"><stop offset="0" stop-color="#10151d"/><stop offset="1" stop-color="#06090e"/></linearGradient>
    <linearGradient id="${id}-glass" x1="0" x2="1"><stop offset="0" stop-color="#7fe8ff" stop-opacity=".55"/><stop offset=".5" stop-color="#1f8bff" stop-opacity=".35"/><stop offset="1" stop-color="#7fe8ff" stop-opacity=".5"/></linearGradient>
    <linearGradient id="${id}-glassd" x1="0" x2="1"><stop offset="0" stop-color="#9fdcff" stop-opacity=".25"/><stop offset="1" stop-color="#9fdcff" stop-opacity=".12"/></linearGradient>
    <radialGradient id="${id}-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1fb6ff" stop-opacity=".55"/><stop offset="1" stop-color="#1fb6ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-mouth" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#3fd8ff" stop-opacity=".75"/><stop offset=".5" stop-color="#1f7dff" stop-opacity=".25"/><stop offset="1" stop-color="#02060d" stop-opacity="1"/></radialGradient>
  </defs>

  <ellipse cx="210" cy="356" rx="200" ry="40" fill="url(#${id}-floor)"/>
  <!-- płyta dokująca (izometryczna, z siatką) -->
  <path class="plate" d="M60 340 L250 296 L380 336 L190 386 Z"/>
  <g class="plate-grid">${Array.from({ length: 7 }, (_, i) => `<line x1="${60 + i * 27}" y1="${340 - i * 6.3}" x2="${190 + i * 27}" y2="${386 - i * 7.1}"/>`).join('')}</g>
  <path class="plate-edge" filter="url(#${id}-glow)" d="M60 340 L190 386 L380 336"/>

  <!-- wieża -->
  <path fill="url(#${id}-sidef)" class="t-edge" d="M292 64 L330 50 L330 300 L292 318 Z"/>
  <path class="t-top" d="M120 64 L158 50 L330 50 L292 64 Z"/>
  <rect fill="url(#${id}-front)" class="t-edge" x="120" y="64" width="172" height="254" rx="6"/>
  <!-- komora zbiorników (szkło) -->
  <rect class="t-bay" x="130" y="72" width="152" height="112" rx="5"/>
  <rect class="glass" fill="url(#${id}-glassd)" x="138" y="84" width="58" height="94" rx="5"/>
  <rect class="glass blue" fill="url(#${id}-glass)" x="204" y="92" width="72" height="86" rx="5" filter="url(#${id}-glow)"/>
  <path class="glass-hl" d="M210 98 v72 M144 90 v80"/>
  <path class="lid" d="M136 80 h64 M204 88 h74"/>
  <!-- opaska i dolna część -->
  <rect class="band" x="120" y="188" width="172" height="14"/>
  <rect class="t-mid" x="130" y="206" width="152" height="40" rx="4"/>
  <rect class="led" x="186" y="224" width="40" height="3" rx="1.5" filter="url(#${id}-glow)"/>
  <path class="mouth" fill="url(#${id}-mouth)" d="M140 318 v-46 q0 -18 18 -18 h96 q18 0 18 18 v46 z"/>
  <path class="mouth-glow" filter="url(#${id}-glow)" d="M150 318 v-40 M262 318 v-40"/>

  <!-- ścieżka/strzałka -->
  <path class="clean-path" d="M20 380 C 60 330, 140 330, 150 372 S 220 392, 196 350"/>
  <path class="return-arrow" d="M170 340 L 198 328"/>

  <!-- efekty procesów -->
  <g class="fx fx-wash">${[0, 1, 2, 3, 4].map((i) => `<path class="drop d${i}" d="M${176 + i * 16} 300 q4 6 0 10 q-4 -4 0 -10z"/>`).join('')}</g>
  <g class="fx fx-dry">${[0, 1, 2].map((i) => `<path class="wave w${i}" d="M${180 + i * 26} 300 q6 -8 0 -16 q-6 -8 0 -16"/>`).join('')}</g>
  <g class="fx fx-empty">${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="dust p${i}" cx="${196 + (i % 3) * 14}" cy="300" r="2.4"/>`).join('')}</g>

  <g transform="translate(${rx},${ry}) scale(${rs})"><g class="robot-motion">${robotSvg(id)}</g></g>
</svg>`;
}

// Ikony‑ilustracje zbiorników do kafli. Kolor = typ zbiornika, NIE poziom.
export function tankSvg(kind) {
  const id = `mxt${++uid}`;
  const tint = { clean_water: ['#7fe8ff', '#1f8bff'], dirty_water: ['#ffd29a', '#b8752c'], dust_bag: ['#f2f6fb', '#9fb3c8'], detergent: ['#9be7ff', '#2a7bff'] }[kind];
  const body = kind === 'dust_bag'
    ? `<path fill="url(#${id}-g)" class="tk-glass" d="M14 26 h36 l4 52 q-22 8 -44 0 z"/><path class="tk-fold" d="M20 40 q12 10 24 0 M18 58 q14 8 28 0"/><rect class="tk-cap" x="12" y="18" width="40" height="10" rx="3"/>`
    : kind === 'detergent'
      ? `<rect fill="url(#${id}-g)" class="tk-glass" x="14" y="24" width="36" height="58" rx="6"/><rect class="tk-cap" x="24" y="12" width="16" height="12" rx="3"/><path class="tk-hl" d="M20 30 v46"/>`
      : `<path fill="url(#${id}-g)" class="tk-glass" d="M10 22 h44 v58 q0 6 -6 6 h-32 q-6 0 -6 -6 z"/><rect class="tk-cap" x="8" y="14" width="48" height="10" rx="3"/><path class="tk-handle" d="M22 14 v-6 h20 v6"/><path class="tk-hl" d="M16 28 v50"/>`;
  return `<svg class="tank-svg" viewBox="0 0 64 92" aria-hidden="true">
    <defs><linearGradient id="${id}-g" x1="0" x2="1"><stop offset="0" stop-color="${tint[0]}" stop-opacity=".55"/><stop offset=".55" stop-color="${tint[1]}" stop-opacity=".45"/><stop offset="1" stop-color="${tint[0]}" stop-opacity=".6"/></linearGradient>
    <filter id="${id}-f"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g filter="url(#${id}-f)" style="color:${tint[1]}">${body}</g></svg>`;
}
