// Realistyczne (cieniowane 3D) ilustracje części, przebarwione w stylu holo.
// viewBox 0 0 160 110. Kolor bazowy = currentColor (zmienia się ze stanem).
// ID gradientów są stałe dla danej części (stabilny DOM przy odświeżaniu).
let curKey = 'x';
const D = () => { const i = curKey; return { i, defs: `
  <linearGradient id="m${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf8ff"/><stop offset=".18" stop-color="currentColor" stop-opacity=".95"/><stop offset=".55" stop-color="#0b2a55"/><stop offset=".85" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="#03101f"/></linearGradient>
  <linearGradient id="h${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#03101f"/><stop offset=".35" stop-color="currentColor" stop-opacity=".7"/><stop offset=".5" stop-color="#eaf8ff"/><stop offset=".65" stop-color="currentColor" stop-opacity=".7"/><stop offset="1" stop-color="#03101f"/></linearGradient>
  <linearGradient id="d${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="#02070f"/></linearGradient>
  <radialGradient id="r${i}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#eaf8ff"/><stop offset=".3" stop-color="currentColor"/><stop offset="1" stop-color="#03101f"/></radialGradient>
  <filter id="g${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="s${i}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".7"/></filter>` }; };
const floor = (cx = 80, cy = 96, rx = 62) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="7" fill="currentColor" opacity=".18"/>`;
const svg = (body) => `<svg viewBox="0 0 160 110">${body}</svg>`;

const PARTS_RAW = {
  // Szczotka główna: wałek z gumowymi listwami w „V” + rzędy włosia, szare zaślepki
  main_brush: () => { const { i, defs } = D(); return svg(`<defs>${defs}
    <clipPath id="c${i}"><rect x="22" y="38" width="116" height="34" rx="17"/></clipPath></defs>${floor(80, 92, 70)}
    <g filter="url(#s${i})">
      <rect x="22" y="38" width="116" height="34" rx="17" fill="url(#m${i})"/>
      <g clip-path="url(#c${i})">
        ${Array.from({ length: 9 }, (_, k) => { const x = 18 + k * 14; return `<path d="M${x} 38 L${x + 10} 55 L${x} 72" fill="none" stroke="#02070f" stroke-width="4.5" opacity=".75"/><path d="M${x} 38 L${x + 10} 55 L${x} 72" fill="none" stroke="#eaf8ff" stroke-width="1.2" opacity=".55"/>`; }).join('')}
        ${Array.from({ length: 9 }, (_, k) => { const x = 25 + k * 14; return Array.from({ length: 6 }, (_, j) => `<line x1="${x + j * 0.9}" y1="${41 + j * 5}" x2="${x + j * 0.9 + 1.5}" y2="${43 + j * 5}" stroke="currentColor" stroke-width="1" opacity=".8"/>`).join(''); }).join('')}
        <rect x="22" y="40" width="116" height="5" fill="#fff" opacity=".18"/>
      </g>
      <path d="M16 40 h10 v30 h-10 a4 4 0 0 1 -4 -4 v-22 a4 4 0 0 1 4 -4z" fill="url(#h${i})"/><rect x="5" y="50" width="9" height="10" rx="2" fill="url(#r${i})"/>
      <path d="M134 40 h10 a4 4 0 0 1 4 4 v22 a4 4 0 0 1 -4 4 h-10 z" fill="url(#h${i})"/><rect x="146" y="51" width="8" height="8" rx="4" fill="url(#r${i})"/>
    </g>`); },

  // Szczotka boczna: 5 ramion z kępkami włosia, piasta z kołnierzem
  side_brush: () => { const { i, defs } = D(); return svg(`<defs>${defs}</defs>${floor(80, 92, 64)}
    <g filter="url(#s${i})">
      ${[0, 72, 144, 216, 288].map((a) => { const r = (a - 90) * Math.PI / 180, R = 56, sy = 0.48;
        const ex = 80 + Math.cos(r) * R, ey = 58 + Math.sin(r) * R * sy, mx = 80 + Math.cos(r + 0.28) * R * 0.55, my = 58 + Math.sin(r + 0.28) * R * 0.55 * sy;
        const tufts = Array.from({ length: 7 }, (_, t) => { const rr = r + (t - 3) * 0.07; return `<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${(80 + Math.cos(rr) * (R + 4 + (t % 2) * 4)).toFixed(1)}" y2="${(58 + Math.sin(rr) * (R + 4) * sy).toFixed(1)}" stroke="currentColor" stroke-width="1.1" opacity=".85"/>`; }).join('');
        return `${tufts}<path d="M80 58 Q${mx.toFixed(1)} ${(my - 3).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="#02070f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M80 58 Q${mx.toFixed(1)} ${(my - 3).toFixed(1)} ${((ex + 80) / 2).toFixed(1)} ${((ey + 58) / 2).toFixed(1)}" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`; }).join('')}
      <ellipse cx="80" cy="60" rx="17" ry="9" fill="#02070f"/><ellipse cx="80" cy="57" rx="17" ry="9" fill="url(#m${i})"/>
      <ellipse cx="80" cy="55" rx="8" ry="4.2" fill="url(#r${i})"/><ellipse cx="77" cy="53.5" rx="3" ry="1.4" fill="#fff" opacity=".7"/>
    </g>`); },

  // Filtr HEPA: prostokątna ramka z uchwytem, harmonijka plis na wierzchu
  filter: () => { const { i, defs } = D(); return svg(`<defs>${defs}</defs>${floor(80, 94, 60)}
    <g filter="url(#s${i})">
      <path d="M30 50 L108 36 L136 52 L58 68 Z" fill="url(#h${i})"/>
      <path d="M30 50 L58 68 V86 L30 68 Z" fill="url(#d${i})"/>
      <path d="M58 68 L136 52 V70 L58 86 Z" fill="url(#m${i})"/>
      <path d="M38 50.5 L106 38.5 L127 51 L59 63.5 Z" fill="#02070f" opacity=".8"/>
      ${Array.from({ length: 14 }, (_, k) => { const t = k / 13; const x1 = 38 + t * 68, y1 = 50.5 - t * 12, x2 = 59 + t * 68, y2 = 63.5 - t * 12.5;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="2.2" opacity="${k % 2 ? 0.55 : 1}"/>`; }).join('')}
      <path d="M131 55 l9 -2 v9 l-9 2z" fill="url(#r${i})"/>
      <path d="M30 50 L108 36 L136 52" fill="none" stroke="#eaf8ff" stroke-width="1" opacity=".7"/>
    </g>`); },

  // Czujniki: robot z wieżyczką LDS, przednim oknem 3D/AI i falami skanowania
  sensor_dirty: () => { const { i, defs } = D(); return svg(`<defs>${defs}</defs>${floor(80, 92, 66)}
    <g filter="url(#s${i})">
      <path d="M22 62 v10 a58 17 0 0 0 116 0 v-10z" fill="url(#h${i})"/>
      <ellipse cx="80" cy="62" rx="58" ry="17" fill="url(#m${i})"/>
      <ellipse cx="80" cy="62" rx="48" ry="13" fill="none" stroke="#02070f" stroke-width="1.5" opacity=".6"/>
      <path d="M34 72 a58 17 0 0 0 30 10" fill="none" stroke="#02070f" stroke-width="6" opacity=".9"/>
      <rect x="42" y="72" width="16" height="5" rx="2" fill="url(#r${i})" filter="url(#g${i})"/>
      <path d="M68 58 v-8 a14 5 0 0 1 28 0 v8z" fill="url(#h${i})"/><ellipse cx="82" cy="50" rx="14" ry="5" fill="url(#r${i})"/>
      <ellipse cx="82" cy="50" rx="8" ry="2.6" fill="none" stroke="#eaf8ff" stroke-width="1.4" filter="url(#g${i})"/>
    </g>
    <g fill="none" stroke="currentColor" stroke-linecap="round" filter="url(#g${i})">
      <path d="M64 36 a22 10 0 0 1 36 0" stroke-width="2"/><path d="M56 27 a32 14 0 0 1 52 0" stroke-width="1.6" opacity=".65"/><path d="M48 18 a42 18 0 0 1 68 0" stroke-width="1.2" opacity=".35"/>
    </g>`); },

  // Moduł jonów srebra: biała kapsuła z zakrętką i okienkiem z granulatem Ag+
  silver_ion: () => { const { i, defs } = D(); return svg(`<defs>${defs}</defs>${floor(80, 96, 40)}
    <g filter="url(#s${i})">
      <rect x="56" y="30" width="48" height="62" rx="12" fill="url(#h${i})"/>
      <ellipse cx="80" cy="30" rx="24" ry="7" fill="url(#m${i})"/>
      <rect x="66" y="14" width="28" height="16" rx="4" fill="url(#h${i})"/><ellipse cx="80" cy="14" rx="14" ry="4" fill="url(#r${i})"/>
      ${Array.from({ length: 9 }, (_, k) => `<line x1="${68 + k * 3}" y1="17" x2="${68 + k * 3}" y2="29" stroke="#02070f" stroke-width="1" opacity=".5"/>`).join('')}
      <rect x="66" y="46" width="28" height="34" rx="6" fill="#02070f" opacity=".85"/>
      ${Array.from({ length: 22 }, (_, k) => `<circle cx="${69 + (k * 7.3) % 22}" cy="${50 + Math.floor(k / 4) * 5.2 + (k % 2) * 1.5}" r="${1.6 + (k % 3) * 0.5}" fill="url(#r${i})"/>`).join('')}
      <text x="80" y="42" text-anchor="middle" font-size="9" font-weight="800" fill="#02070f" font-family="sans-serif">Ag⁺</text>
      <rect x="60" y="34" width="4" height="52" rx="2" fill="#fff" opacity=".35"/>
    </g>`); },

  // Koło napędowe: opona z bieżnikiem, felga i ramię zawieszenia
  wheel_dirty: () => { const { i, defs } = D(); return svg(`<defs>${defs}</defs>${floor(78, 98, 48)}
    <g filter="url(#s${i})">
      <path d="M96 40 L132 30 L138 42 L104 56 Z" fill="url(#m${i})"/><circle cx="134" cy="36" r="5" fill="url(#r${i})"/>
      <ellipse cx="86" cy="58" rx="24" ry="36" fill="#02070f"/>
      <path d="M70 22 h16 a24 36 0 0 1 0 72 h-16" fill="url(#h${i})"/>
      ${Array.from({ length: 13 }, (_, k) => { const a = -Math.PI / 2 + k / 12 * Math.PI; const y = 58 + Math.sin(a) * 36; const x = 86 + Math.cos(a) * 24; return `<path d="M${(x - 16).toFixed(1)} ${y.toFixed(1)} h16" stroke="#02070f" stroke-width="2.6"/>`; }).join('')}
      <ellipse cx="70" cy="58" rx="24" ry="36" fill="url(#m${i})"/>
      <ellipse cx="70" cy="58" rx="15" ry="23" fill="#02070f"/>
      <ellipse cx="70" cy="58" rx="12" ry="19" fill="url(#r${i})"/>
      ${[0, 1, 2, 3, 4].map((k) => { const a = k / 5 * 2 * Math.PI; return `<line x1="70" y1="58" x2="${(70 + Math.cos(a) * 11).toFixed(1)}" y2="${(58 + Math.sin(a) * 17).toFixed(1)}" stroke="#02070f" stroke-width="2.4"/>`; }).join('')}
      <ellipse cx="70" cy="58" rx="4" ry="6" fill="#eaf8ff" opacity=".85"/>
    </g>`); },

  // Środek do kamienia: wkład/butelka stacji z nakrętką, oknem poziomu i kroplą
  scale_inhibitor: () => { const { i, defs } = D(); return svg(`<defs>${defs}</defs>${floor(80, 96, 44)}
    <g filter="url(#s${i})">
      <path d="M50 34 h60 l8 10 v42 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8 v-42z" fill="url(#h${i})"/>
      <path d="M50 34 h60 l8 10 h-76z" fill="url(#m${i})"/>
      <rect x="66" y="18" width="28" height="16" rx="4" fill="url(#h${i})"/><ellipse cx="80" cy="18" rx="14" ry="4" fill="url(#r${i})"/>
      <rect x="54" y="52" width="10" height="34" rx="4" fill="#02070f" opacity=".85"/><rect x="56" y="64" width="6" height="20" rx="3" fill="currentColor" filter="url(#g${i})"/>
      <path d="M90 56 q-12 15 0 24 q12 -9 0 -24z" fill="url(#r${i})" filter="url(#g${i})"/>
      ${[[74, 62], [104, 64], [100, 80]].map(([x, y]) => `<path d="M${x - 3} ${y} l3 -3 l3 3 l-3 3z" fill="#eaf8ff" opacity=".7"/>`).join('')}
      <rect x="46" y="46" width="4" height="40" rx="2" fill="#fff" opacity=".3"/>
    </g>`); },
};

export function partSvg(key) {
  const f = PARTS_RAW[key];
  if (!f) return '';
  curKey = `mxp-${key}`;
  return f();
}
