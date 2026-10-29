/*! Mieciu X50 Card v0.1.0 | MIT | https://github.com/ — autorska karta Lovelace */
(() => {
'use strict';

// ===== src/util/parse.js =====
// Narzędzia do bezpiecznego parsowania wartości z HA.
// W żywym HA atrybuty są natywnymi typami (dict/list/bool), ale w eksportach
// z Edytora szablonów bywają stringami w składni Pythona. Obsługujemy oba.

function toBool(v) {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return ['true', '1', 'on', 'yes'].includes(v.trim().toLowerCase());
  return false;
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function isUnavail(stateObj) {
  return !stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown';
}

// Parser literałów Pythona (dict/list/tuple/str/int/float/True/False/None,
// datetime.datetime(...)) -> wartości JS. Nie wykonuje żadnego kodu.
function pyParse(input) {
  if (typeof input !== 'string') return input;
  const s = input.trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) { /* dalej */ }
  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const fail = () => { throw new Error('pyParse @' + i); };
  function str() {
    const q = s[i++]; let out = '';
    while (i < s.length && s[i] !== q) {
      if (s[i] === '\\' && i + 1 < s.length) {
        const n = s[i + 1];
        out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
        i += 2;
      } else out += s[i++];
    }
    i++; return out;
  }
  function seq(close) {
    const arr = []; i++; ws();
    while (i < s.length && s[i] !== close) { arr.push(val()); ws(); if (s[i] === ',') { i++; ws(); } }
    i++; return arr;
  }
  function dict() {
    const obj = {}; i++; ws();
    while (i < s.length && s[i] !== '}') {
      const k = val(); ws(); if (s[i] !== ':') fail(); i++; ws();
      obj[String(k)] = val(); ws(); if (s[i] === ',') { i++; ws(); }
    }
    i++; return obj;
  }
  function val() {
    ws();
    const c = s[i];
    if (c === '{') return dict();
    if (c === '[') return seq(']');
    if (c === '(') return seq(')');
    if (c === "'" || c === '"') return str();
    const m = /^-?\d+(\.\d+)?([eE][-+]?\d+)?/.exec(s.slice(i));
    if (m) { i += m[0].length; return Number(m[0]); }
    const id = /^[A-Za-z_][\w.]*/.exec(s.slice(i));
    if (id) {
      i += id[0].length;
      if (id[0] === 'True') return true;
      if (id[0] === 'False') return false;
      if (id[0] === 'None') return null;
      ws();
      if (s[i] === '(') {           // np. datetime.datetime(2026, 10, 29, 12, 21, 8)
        const args = seq(')');
        if (id[0].endsWith('datetime')) {
          const [y, mo, d, h = 0, mi = 0, se = 0] = args;
          return new Date(y, mo - 1, d, h, mi, se).toISOString();
        }
        return { [id[0]]: args };
      }
      ws();
      if (s[i] === '=') { i++; return val(); } // "a = 0" w krotce pozycji
      return id[0];
    }
    fail();
  }
  try { return val(); } catch (_) { return null; }
}

// Pozycja robota/stacji: "(-187, -757, a = 0)" | {x,y,a} | [x,y,a]
function parsePosition(v) {
  if (!v) return null;
  if (typeof v === 'object' && !Array.isArray(v) && 'x' in v) return { x: toNum(v.x), y: toNum(v.y), a: toNum(v.a) ?? 0 };
  if (Array.isArray(v)) return { x: toNum(v[0]), y: toNum(v[1]), a: toNum(v[2]) ?? 0 };
  const nums = String(v).match(/-?\d+(\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  return { x: Number(nums[0]), y: Number(nums[1]), a: nums[2] ? Number(nums[2]) : 0 };
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtNum(n, digits = 0) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('pl-PL', { maximumFractionDigits: digits });
}

function fmtMinutes(min) {
  const m = toNum(min);
  if (m === null) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

// ===== src/translations/pl.js =====
// Polskie etykiety. Jeśli HA udostępnia hass.formatEntityState, karta korzysta
// z tłumaczeń integracji; poniższe są tylko awaryjne lub dla elementów karty.

const PL = {
  tabs: {
    map: 'Mapa', cleaning: 'Sprzątanie', station: 'Stacja', rooms: 'Pomieszczenia',
    service: 'Serwis', history: 'Historia', settings: 'Ustawienia',
  },
  visual: {
    docked: 'W stacji', cleaning: 'Sprząta', returning: 'Wraca do stacji', paused: 'Pauza',
    washing: 'Mycie mopów', drying: 'Suszenie mopów', auto_empty: 'Opróżnianie',
    error: 'Błąd', unavailable: 'Niedostępny', neutral: 'Bezczynny',
  },
  tank: {
    installed: 'Zainstalowany', not_installed: 'Brak', missing: 'Brak',
    unknown: 'Nieznany', attention: 'Wymaga uwagi',
  },
  tankName: {
    clean_water: 'Czysta woda', dirty_water: 'Brudna woda', dust_bag: 'Worek na kurz', detergent: 'Detergent',
  },
  options: {
    // tryby
    sweeping: 'Odkurzanie', mopping: 'Mopowanie', sweeping_and_mopping: 'Odkurzanie i mopowanie',
    mopping_after_sweeping: 'Po odkurzaniu',
    // ssanie
    quiet: 'Cichy', silent: 'Cichy', standard: 'Standard', strong: 'Mocny', turbo: 'Turbo',
    // mop
    slightly_dry: 'Lekko', moist: 'Wilgotno', wet: 'Mokro',
    // CleanGenius
    off: 'Wył.', routine_cleaning: 'Rutynowe', deep_cleaning: 'Dokładne',
    // trasa
    quick: 'Szybka',
    // auto opróżnianie
    high_frequency: 'Często', low_frequency: 'Rzadko',
    // samoczyszczenie
    by_area: 'Wg powierzchni', by_time: 'Wg czasu', by_room: 'Wg pokoju',
    // dywany
    avoidance: 'Omijaj', adaptation: 'Adaptacja', remove_mop: 'Zdejmij mop', ignore: 'Ignoruj', cross: 'Przejedź',
    // podłogi
    tile: 'Płytki', wood: 'Drewno', none: 'Brak', carpet: 'Dywan',
    medium_pile_carpet: 'Dywan średni', low_pile_carpet: 'Dywan niski',
    in_deep_mode: 'W trybie dokładnym', in_all_modes: 'We wszystkich',
  },
  history: {
    'Room cleaning': 'Pokoje', 'Zone cleaning': 'Strefa', 'Spot cleaning': 'Punkt',
    'Cleaning': 'Całe mieszkanie', 'Fast mapping': 'Mapowanie',
  },
  service: {
    main_brush: 'Szczotka główna', side_brush: 'Szczotka boczna', filter: 'Filtr',
    sensor_dirty: 'Czujniki', silver_ion: 'Jony srebra', wheel_dirty: 'Koła', scale_inhibitor: 'Odkamieniacz',
  },
  station: {
    self_wash_base_status: 'Baza myjąca', auto_empty_status: 'Opróżnianie', station_drainage_status: 'Drenaż',
    hot_water_status: 'Gorąca woda', drying_progress: 'Postęp suszenia', drying_left: 'Pozostało suszenia',
    low_water_warning: 'Niski poziom wody', mop_pad: 'Mop',
  },
  generic: {
    rooms: 'Pomieszczenia', selectAll: 'Wszystkie', clear: 'Wyczyść', cleanSelected: 'Sprzątaj wybrane',
    start: 'Start', pause: 'Pauza', dock: 'Do bazy', resume: 'Wznów',
    unavailable: 'niedostępne', noMap: 'Brak obrazu mapy z kamery',
    confirm: 'Na pewno?', soon: 'Dostępne w kolejnej wersji (po audycie API)',
    cleaningMode: 'Tryb sprzątania', suction: 'Moc ssania', humidity: 'Nawilżanie mopów',
    battery: 'Bateria', state: 'Stan', map: 'Mapa', total: 'Łącznie', cycles: 'Cykle', last: 'Ostatnie sprzątanie',
    progress: 'Postęp', area: 'Powierzchnia', time: 'Czas', currentRoom: 'Pokój',
  },
};

function optLabel(opt) {
  if (opt === null || opt === undefined) return '—';
  const k = String(opt);
  if (PL.options[k]) return PL.options[k];
  return k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

// ===== src/adapter/entities.js =====
// Rozwiązywanie encji: automatycznie z prefiksu (object_id odkurzacza),
// każdą można nadpisać w YAML:  entities: { battery: sensor.inna_bateria }

const ENTITY_KEYS = {
  battery: 'sensor.{p}_battery_level',
  status: 'sensor.{p}_status',
  state: 'sensor.{p}_state',
  cleaning_time: 'sensor.{p}_cleaning_time',
  cleaned_area: 'sensor.{p}_cleaned_area',
  cleaning_progress: 'sensor.{p}_cleaning_progress',
  current_room: 'sensor.{p}_current_room',
  total_area: 'sensor.{p}_total_cleaned_area',
  total_time: 'sensor.{p}_total_cleaning_time',
  cleaning_count: 'sensor.{p}_cleaning_count',
  history: 'sensor.{p}_cleaning_history',
  error: 'sensor.{p}_error',
  task_status: 'sensor.{p}_task_status',
  mop_pad: 'sensor.{p}_mop_pad',
  // sprzątanie
  cleaning_mode: 'select.{p}_cleaning_mode',
  suction_level: 'select.{p}_suction_level',
  mop_pad_humidity: 'select.{p}_mop_pad_humidity',
  cleangenius: 'select.{p}_cleangenius',
  cleangenius_mode: 'select.{p}_cleangenius_mode',
  cleaning_route: 'select.{p}_cleaning_route',
  carpet_cleaning: 'select.{p}_carpet_cleaning',
  wetness_level: 'number.{p}_wetness_level',
  // mapa
  selected_map: 'select.{p}_selected_map',
  map_rotation: 'select.{p}_map_rotation',
  // stacja
  clean_water_tank: 'sensor.{p}_clean_water_tank_status',
  dirty_water_tank: 'sensor.{p}_dirty_water_tank_status',
  dust_bag: 'sensor.{p}_dust_bag_status',
  detergent: 'sensor.{p}_detergent_status',
  station_drainage_status: 'sensor.{p}_station_drainage_status',
  hot_water_status: 'sensor.{p}_hot_water_status',
  auto_empty_status: 'sensor.{p}_auto_empty_status',
  self_wash_base_status: 'sensor.{p}_self_wash_base_status',
  low_water_warning: 'sensor.{p}_low_water_warning',
  drying_progress: 'sensor.{p}_drying_progress',
  drying_left: 'sensor.{p}_drying_left',
  drying_time: 'select.{p}_drying_time',
  washing_mode: 'select.{p}_washing_mode',
  auto_empty_mode: 'select.{p}_auto_empty_mode',
  water_temperature: 'select.{p}_water_temperature',
  self_clean_frequency: 'select.{p}_self_clean_frequency',
  btn_auto_empty: 'button.{p}_start_auto_empty',
  btn_self_clean: 'button.{p}_self_clean',
  btn_manual_drying: 'button.{p}_manual_drying',
  btn_empty_water_tank: 'button.{p}_empty_water_tank',
  btn_water_tank_draining: 'button.{p}_water_tank_draining',
  btn_base_station_cleaning: 'button.{p}_base_station_cleaning',
  // serwis
  maintenance: 'binary_sensor.{p}_maintenance',
};

const SERVICE_ITEMS = ['main_brush', 'side_brush', 'filter', 'sensor_dirty', 'silver_ion', 'wheel_dirty', 'scale_inhibitor'];
const SERVICE_RESET = {
  main_brush: 'reset_main_brush', side_brush: 'reset_side_brush', filter: 'reset_filter',
  sensor_dirty: 'reset_sensor', silver_ion: 'reset_silver_ion', wheel_dirty: 'reset_wheel',
  scale_inhibitor: 'reset_scale_inhibitor',
};

function prefixFromConfig(config) {
  if (config.prefix) return config.prefix;
  return String(config.entity || '').split('.')[1] || '';
}

function resolveEntities(config) {
  const p = prefixFromConfig(config);
  const out = {};
  for (const [k, tpl] of Object.entries(ENTITY_KEYS)) out[k] = tpl.replace('{p}', p);
  for (const it of SERVICE_ITEMS) {
    out[`svc_${it}_left`] = `sensor.${p}_${it}_left`;
    out[`svc_${it}_time`] = `sensor.${p}_${it}_time_left`;
    out[`svc_${it}_reset`] = `button.${p}_${SERVICE_RESET[it]}`;
  }
  out.vacuum = config.entity;
  out.map = config.map_entity || `camera.${p}_map`;
  Object.assign(out, config.entities || {});
  return out;
}

// Encje per pokój — szablon z ID segmentu, nie z nazwy.
function roomEntity(config, roomId, key) {
  const p = prefixFromConfig(config);
  const domain = key === 'wetness_level' ? 'number' : 'select';
  return `${domain}.${p}_room_${roomId}_${key}`;
}

// Wszystkie przełączniki urządzenia (do zakładki Ustawienia).
function discoverSwitches(hass, config) {
  const p = prefixFromConfig(config);
  return Object.keys(hass.states)
    .filter((id) => id.startsWith(`switch.${p}_`))
    .sort();
}

// ===== src/adapter/capability-detection.js =====

function getCapabilities(vacState) {
  const raw = vacState?.attributes?.capabilities;
  const list = Array.isArray(raw) ? raw : pyParse(raw);
  return new Set(Array.isArray(list) ? list : []);
}

function hasService(hass, domain, service) {
  return !!hass?.services?.[domain]?.[service];
}

// Encja istnieje i nie jest unavailable/unknown.
function usable(hass, entityId) {
  const st = hass?.states?.[entityId];
  return !!st && !isUnavail(st);
}

function exists(hass, entityId) {
  return !!hass?.states?.[entityId];
}

// ===== src/adapter/commands.js =====
// Wszystkie akcje karty w jednym miejscu. Tylko usługi potwierdzone:
//  - vacuum.start / vacuum.pause / vacuum.return_to_base (standard HA)
//  - dreame_vacuum.vacuum_clean_segment {segments: [id,...]} (docs Tasshack)
//  - select.select_option, switch.toggle, button.press (standard HA)
// Strefy, punkty i edycja mapy celowo NIE są tu zaimplementowane (v0.2+).


const Commands = {
  start: (hass, vac) => hass.callService('vacuum', 'start', { entity_id: vac }),
  pause: (hass, vac) => hass.callService('vacuum', 'pause', { entity_id: vac }),
  dock: (hass, vac) => hass.callService('vacuum', 'return_to_base', { entity_id: vac }),

  canCleanSegments: (hass) => hasService(hass, 'dreame_vacuum', 'vacuum_clean_segment'),
  cleanSegments: (hass, vac, segments) =>
    hass.callService('dreame_vacuum', 'vacuum_clean_segment', { entity_id: vac, segments: segments.map(Number) }),

  selectOption: (hass, entityId, option) =>
    hass.callService('select', 'select_option', { entity_id: entityId, option }),
  toggle: (hass, entityId) => hass.callService('switch', 'toggle', { entity_id: entityId }),
  press: (hass, entityId) => hass.callService('button', 'press', { entity_id: entityId }),
};

// ===== src/adapter/map.js =====
// Mapa: obraz z kamery integracji + warstwa nakładek liczona z
// calibration_points (punkty współrzędnych robota -> piksele obrazu).
// Nie zgadujemy geometrii pokoi z obrazu; używamy tylko środków (x,y)
// pokoi podanych przez integrację w atrybucie `rooms` kamery.


function buildTransform(calibration) {
  const pts = Array.isArray(calibration) ? calibration : pyParse(calibration);
  if (!Array.isArray(pts) || pts.length < 3) return null;
  const [p0, p1, p2] = pts;
  const v = (p) => [toNum(p.vacuum.x), toNum(p.vacuum.y)];
  const m = (p) => [toNum(p.map.x), toNum(p.map.y)];
  const [v0, v1, v2] = [v(p0), v(p1), v(p2)];
  const [m0, m1, m2] = [m(p0), m(p1), m(p2)];
  // M * [dv1 dv2] = [dm1 dm2]
  const a = v1[0] - v0[0], c = v2[0] - v0[0];
  const b = v1[1] - v0[1], d = v2[1] - v0[1];
  const det = a * d - b * c;
  if (!det) return null;
  const inv = [d / det, -c / det, -b / det, a / det]; // [[i00,i01],[i10,i11]]
  const dm1 = [m1[0] - m0[0], m1[1] - m0[1]];
  const dm2 = [m2[0] - m0[0], m2[1] - m0[1]];
  const M = [
    dm1[0] * inv[0] + dm2[0] * inv[2], dm1[0] * inv[1] + dm2[0] * inv[3],
    dm1[1] * inv[0] + dm2[1] * inv[2], dm1[1] * inv[1] + dm2[1] * inv[3],
  ];
  return (x, y) => {
    const dx = x - v0[0], dy = y - v0[1];
    return [m0[0] + M[0] * dx + M[1] * dy, m0[1] + M[2] * dx + M[3] * dy];
  };
}

// Lista pokoi: preferujemy atrybut kamery (ma środki x,y), uzupełniamy
// z vacuum.rooms dla wybranej mapy. Zawsze kluczem jest ID segmentu.
function getRooms(vacState, mapState) {
  const byId = new Map();
  const camRooms = pyParse(mapState?.attributes?.rooms);
  if (camRooms && typeof camRooms === 'object') {
    for (const r of Object.values(camRooms)) {
      if (!r || r.room_id === undefined) continue;
      byId.set(Number(r.room_id), {
        id: Number(r.room_id), name: r.name, icon: r.icon, order: toNum(r.order),
        x: toNum(r.x), y: toNum(r.y), floor: r.floor_material, visible: r.visibility !== 'Hidden',
        color: toNum(r.color_index),
      });
    }
  }
  const vacRooms = pyParse(vacState?.attributes?.rooms);
  const selMap = vacState?.attributes?.selected_map;
  if (vacRooms && typeof vacRooms === 'object') {
    const list = vacRooms[selMap] || Object.values(vacRooms)[0] || [];
    for (const r of list) {
      const id = Number(r.id);
      const prev = byId.get(id) || { id, visible: true };
      byId.set(id, { ...prev, name: prev.name || r.name, icon: prev.icon || r.icon });
    }
  }
  return [...byId.values()].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}

function getRobotPosition(mapState) {
  return parsePosition(mapState?.attributes?.vacuum_position);
}
function getChargerPosition(mapState) {
  return parsePosition(mapState?.attributes?.charger_position);
}

// ===== src/state/visual-state.js =====
// deriveRobotVisualState — kolejność priorytetów ze specyfikacji (pkt 5).
// Nie opieramy się tylko na sensor.status (sleeping współistnieje z docked).


const AE_IDLE = new Set(['', 'idle', '0', 'none', 'not_performed', 'unavailable', 'unknown', 'off']);

function deriveRobotVisualState(vac) {
  if (isUnavail(vac)) return 'unavailable';
  const a = vac.attributes || {};
  const b = (k) => toBool(a[k]);
  const vs = String(a.vacuum_state ?? '').toLowerCase();

  // 1) błąd
  if (b('has_error') || vac.state === 'error') return 'error';
  // 2) stacja w działaniu
  if (b('washing')) return 'washing';
  if (b('drying')) return 'drying';
  const ae = String(a.auto_empty_status ?? '').toLowerCase();
  if (!AE_IDLE.has(ae)) return 'auto_empty';
  // 3) powrót
  if (b('returning') || b('returning_to_wash') || vac.state === 'returning') return 'returning';
  // 4) pauza
  if (b('paused') || b('washing_paused') || b('returning_paused') || b('returning_to_wash_paused') || vac.state === 'paused') return 'paused';
  // 5) sprzątanie
  if (b('running') || b('started') || b('segment_cleaning') || b('zone_cleaning') || b('spot_cleaning') || vac.state === 'cleaning') return 'cleaning';
  // 6) w stacji
  if (b('docked') || b('charging') || vac.state === 'docked' || vs === 'charging' || vs === 'charging_completed') return 'docked';
  // 7) brak pewności
  return 'neutral';
}

const STATION_ACTIVE = new Set(['washing', 'drying', 'auto_empty']);

// Status zbiornika -> etykieta karty. Bez wymyślania % napełnienia.
function tankStatus(stateObj) {
  if (isUnavail(stateObj)) return 'unknown';
  const s = String(stateObj.state).toLowerCase();
  if (s === 'installed' || s === 'enabled' || s === 'normal') return 'installed';
  if (s.includes('not_installed') || s === 'missing' || s === 'removed' || s === 'no_bag' || s === 'not_detected') return 'not_installed';
  return 'attention'; // np. full, low, check, error
}

// ===== src/graphics/station.js =====
// Autorskie grafiki SVG (stacja, robot, zbiorniki). Bez zasobów DVC/Dreame.
// Opcjonalnie użytkownik może podpiąć własne obrazy: station_image / robot_image.
// Zbiorniki: tylko szkło + kolor typu (nie poziom napełnienia).



let uid = 0;

// Robot w rzucie 3/4. Środek w (0,0), szerokość ~170.
function robotSvg(id) {
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
function heroRobotSvg(visual, opts = {}) {
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

function stationSvg(visual, opts = {}) {
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
function tankSvg(kind) {
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

// ===== src/styles.js =====
const STYLES = `
:host {
  --mx-bg: #030814; --mx-bg2: #06112a; --mx-panel: rgba(7, 18, 40, .82); --mx-panel2: rgba(10, 26, 56, .72);
  --mx-line: rgba(56, 160, 255, .30); --mx-line-strong: rgba(70, 190, 255, .75);
  --mx-cyan: #3fd8ff; --mx-blue: #1f7dff; --mx-text: #eaf4ff; --mx-dim: #8aa3c4;
  --mx-ok: #38e59b; --mx-warn: #ffb547; --mx-bad: #ff5a6e;
  display: block; font-family: "Rajdhani", "Exo 2", "Saira", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
* { box-sizing: border-box; }
.root {
  display: block; container-type: inline-size; color: var(--mx-text); border-radius: 18px; overflow: hidden; position: relative; padding: 10px;
  background: radial-gradient(1000px 520px at 30% 20%, rgba(31,125,255,.20), transparent 60%),
              radial-gradient(900px 600px at 95% 10%, rgba(63,216,255,.12), transparent 60%),
              linear-gradient(180deg, var(--mx-bg2), var(--mx-bg));
  box-shadow: 0 0 0 1px rgba(63,216,255,.25), 0 0 40px rgba(31,125,255,.25) inset;
}
.root::before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.4;
  background-image: linear-gradient(rgba(63,216,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(63,216,255,.045) 1px, transparent 1px);
  background-size: 28px 28px; }
.panel {
  position: relative; min-width: 0; border-radius: 12px; padding: 12px;
  background: linear-gradient(180deg, var(--mx-panel2), var(--mx-panel));
  box-shadow: 0 0 0 1px var(--mx-line), 0 0 24px rgba(31,125,255,.14) inset, 0 6px 24px rgba(0,0,0,.35);
}
.panel::before, .panel::after { content:""; position:absolute; width:16px; height:16px; pointer-events:none; border-color: var(--mx-cyan); border-style: solid; opacity:.9; filter: drop-shadow(0 0 4px var(--mx-cyan)); }
.panel::before { top:-1px; left:-1px; border-width: 2px 0 0 2px; border-top-left-radius: 12px; }
.panel::after { bottom:-1px; right:-1px; border-width: 0 2px 2px 0; border-bottom-right-radius: 12px; }
.ptitle { font-size: 16px; font-weight: 600; letter-spacing: .3px; margin: 0 0 10px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
h4 { margin: 0 0 6px; font-size: 14px; font-weight: 600; }
.dim { color: var(--mx-dim); } .small { font-size: 12px; font-weight: 500; } .ok { color: var(--mx-ok); } .warn { color: var(--mx-warn); } .bad { color: var(--mx-bad); }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
button:disabled { opacity: .38; cursor: not-allowed; }
ha-icon { --mdc-icon-size: 20px; display: inline-flex; }
.link { color: var(--mx-cyan); font-size: 12.5px; }

/* ===== nagłówek ===== */
.top { display:grid; grid-template-columns: 270px 1fr auto; gap: 12px; align-items: center; margin-bottom: 10px; padding: 8px 12px; border-radius: 14px;
  background: linear-gradient(90deg, rgba(10,26,56,.85), rgba(6,16,36,.6)); box-shadow: 0 0 0 1px var(--mx-line), 0 0 20px rgba(31,125,255,.15) inset; position: relative; }
.brand { display:flex; align-items:center; gap:10px; }
.brand .hero-robot, .brand .hero-img { width: 120px; height: 56px; object-fit: contain; }
.brand h1 { margin:0; font-size: 34px; line-height: .95; font-weight: 700; letter-spacing: .4px; }
.brand small { color: var(--mx-cyan); font-size: 16px; white-space: nowrap; }
.tele { display:flex; gap:8px; overflow-x:auto; scrollbar-width: none; }
.tele::-webkit-scrollbar { display:none; }
.chip { flex: 1 1 auto; min-width: 112px; display:flex; align-items:center; gap:10px; padding: 9px 12px; border-radius: 12px; background: rgba(6,16,36,.85); box-shadow: 0 0 0 1px var(--mx-line), 0 0 14px rgba(31,125,255,.12) inset; }
.chip-ic { width: 36px; height: 36px; display:grid; place-items:center; color: var(--mx-cyan); }
.chip-ic ha-icon { --mdc-icon-size: 30px; filter: drop-shadow(0 0 6px rgba(63,216,255,.7)); }
.chip.c-batt .chip-ic { color: var(--mx-ok); } .chip.c-batt .chip-ic ha-icon { filter: drop-shadow(0 0 6px rgba(56,229,155,.8)); }
.chip b { display:block; font-size: 18px; line-height:1.1; font-weight: 600; white-space: nowrap; }
.chip span { font-size: 12px; color: var(--mx-dim); white-space: nowrap; }
.clock { text-align: right; display:flex; flex-direction:column; gap: 4px; }
.clock-row { display:flex; align-items:center; justify-content:flex-end; gap: 10px; }
.clock b { font-size: 34px; font-weight: 600; line-height:1; }
.clock span { color: var(--mx-cyan); font-size: 17px; }
.wifi { color: var(--mx-ok); --mdc-icon-size: 26px; filter: drop-shadow(0 0 6px rgba(56,229,155,.7)); }
.hbtn { color: var(--mx-cyan); display:inline-flex; } .hbtn.on { color: var(--mx-warn); }

/* ===== siatka ===== */
.row1 { display:grid; grid-template-columns: 150px minmax(0,1fr) minmax(0,1fr); gap: 10px; margin-bottom: 10px; }
.row2 { display:grid; grid-template-columns: minmax(0,1.55fr) minmax(0,1fr); gap: 10px; margin-bottom: 10px; }
.row3 { display:grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1.35fr) minmax(0,1fr) minmax(0,1fr); gap: 10px; }
.row-wide { display:grid; gap: 10px; }
.page { display:grid; grid-template-columns: 150px minmax(0,1fr); gap: 10px; }
.page .main { display:grid; gap: 10px; min-width: 0; }

/* ===== nawigacja ===== */
.nav { display:flex; flex-direction:column; gap:10px; padding: 10px 8px; }
.nav button { display:flex; align-items:center; gap:12px; padding: 13px 12px; border-radius: 10px; text-align:left; font-size: 16px; font-weight: 500; }
.nav button ha-icon { color: var(--mx-cyan); --mdc-icon-size: 24px; }
.nav button:hover { background: rgba(31,125,255,.12); }
.nav button.active { background: linear-gradient(90deg, rgba(31,125,255,.65), rgba(31,125,255,.2)); box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 18px rgba(63,216,255,.45); }
.nav button.active ha-icon { color: #fff; }

/* ===== mapa ===== */
.map-panel { display:grid; grid-template-columns: 46px minmax(0,1fr); gap: 10px; }
.map-tools { display:flex; flex-direction:column; gap:10px; }
.tool { width:44px; height:44px; border-radius:10px; display:grid; place-items:center; color: var(--mx-cyan); background: rgba(6,16,36,.8); box-shadow:0 0 0 1px var(--mx-line); }
.tool ha-icon { --mdc-icon-size: 24px; }
.tool.active { box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 14px rgba(63,216,255,.5); background: rgba(31,125,255,.25); }
.dim2d3d { margin-top: auto; display:flex; align-items:center; justify-content:center; gap:6px; font-size: 14px; padding: 8px 0; border-radius: 10px; box-shadow: 0 0 0 1px var(--mx-line); }
.dim2d3d button { color: var(--mx-dim); } .dim2d3d button.on { color: #fff; font-weight: 700; } .dim2d3d i { width:1px; height:14px; background: var(--mx-line); }
.map-col { display:flex; flex-direction:column; min-width:0; }
.map-view { position: relative; overflow: hidden; border-radius: 10px; flex: 1; min-height: 340px; touch-action: none; cursor: grab;
  background: radial-gradient(circle at 50% 55%, rgba(31,125,255,.18), transparent 70%),
              repeating-linear-gradient(90deg, rgba(63,216,255,.05) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, rgba(63,216,255,.05) 0 1px, transparent 1px 22px); }
.map-view.dragging { cursor: grabbing; }
.map-stage { position:absolute; left:50%; top:50%; transform-origin: 0 0; transition: transform .25s ease; }
.map-view.dragging .map-stage { transition: none; }
.map-3d { transform-style: preserve-3d; transition: transform .6s ease; position: relative; }
.map-3d.on { transform: perspective(1600px) rotateX(50deg) rotateZ(-32deg); }
.map-stage img { display:block; max-width:none; user-select:none; -webkit-user-drag:none; }
.map-stage img.holo { filter: url(#mx-holo) drop-shadow(0 0 3px rgba(63,216,255,.9)) drop-shadow(0 0 14px rgba(31,125,255,.6)); }
.map-3d.on img.holo { filter: url(#mx-holo) drop-shadow(0 0 3px rgba(63,216,255,.9)) drop-shadow(0 8px 0 rgba(31,125,255,.35)) drop-shadow(0 16px 0 rgba(31,125,255,.18)) drop-shadow(0 0 18px rgba(31,125,255,.6)); }
.map-overlay { position:absolute; inset:0; overflow: visible; }
.rm { cursor:pointer; }
.rm rect { fill: rgba(4,12,28,.72); stroke: var(--rc); stroke-width: 2.5; filter: drop-shadow(0 0 6px var(--rc)); }
.rm text { fill: #fff; font-weight: 600; }
.rm.sel rect { fill: var(--rc); stroke: #fff; }
.rm.sel text { fill: #04101f; }
.rm.cur rect { stroke-dasharray: 6 4; }
.map-empty { position:absolute; inset:0; display:grid; place-items:center; color: var(--mx-dim); text-align:center; padding: 20px; }
.compass { position:absolute; top:12px; right:12px; width:42px; height:42px; border-radius:50%; display:grid; place-items:center; box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 12px rgba(63,216,255,.4); color: var(--mx-cyan); font-weight:700; background: rgba(6,16,36,.75); }
.map-modes { display:flex; gap:10px; margin-top: 10px; flex-wrap: wrap; }
.pill { padding: 9px 16px; border-radius: 10px; box-shadow:0 0 0 1px var(--mx-line); background: rgba(6,16,36,.8); font-size: 14px; display:inline-flex; align-items:center; gap:8px; }
.pill ha-icon { color: var(--mx-cyan); --mdc-icon-size: 18px; }
.pill.active { background: linear-gradient(180deg, rgba(31,125,255,.75), rgba(13,79,196,.6)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 14px rgba(63,216,255,.45); }
.pill.active ha-icon { color: #fff; }

/* ===== stacja ===== */
.station-panel { display:grid; grid-template-columns: minmax(0,1.35fr) minmax(0,1fr); gap: 10px; }
.st-head { display:flex; align-items:center; gap: 12px; margin-bottom: 4px; }
.st-ic { width: 46px; height: 46px; border-radius: 10px; display:grid; place-items:center; color: var(--mx-ok); background: rgba(56,229,155,.12); box-shadow: 0 0 0 1px rgba(56,229,155,.55), 0 0 14px rgba(56,229,155,.35); }
.st-ic ha-icon { --mdc-icon-size: 28px; }
.st-head h3 { margin: 0; font-size: 22px; font-weight: 600; line-height: 1.1; } .st-head small { color: var(--mx-cyan); font-size: 15px; }
.st-body { display:grid; grid-template-columns: minmax(0,1fr) 116px; gap: 6px; align-items: center; }
.st-art { min-width: 0; }
.station-svg, .station-img { width: 100%; height: auto; display:block; }
.station-img-wrap { position: relative; }
.proc { display:flex; flex-direction:column; gap: 7px; }
.proc-ready { display:flex; align-items:center; gap:8px; color: var(--mx-ok); font-size: 15px; }
.proc-ready ha-icon { --mdc-icon-size: 22px; padding: 4px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(56,229,155,.6), 0 0 10px rgba(56,229,155,.4); }
.proc-ready.bad { color: var(--mx-bad); }
.proc-item { display:flex; align-items:center; gap:8px; font-size: 12.5px; }
.proc-item ha-icon { color: #cfe6ff; --mdc-icon-size: 18px; padding: 6px; border-radius: 8px; box-shadow: 0 0 0 1px var(--mx-line); background: rgba(6,16,36,.8); }
.proc-item span { display:block; color: #d5e6f8; line-height: 1.1; }
.proc-item b { display:block; color: var(--mx-ok); font-weight: 600; font-size: 13px; }
.proc-item.busy b { color: var(--mx-cyan); } .proc-item.off b { color: var(--mx-dim); } .proc-item.warn b { color: var(--mx-warn); }
.st-tanks { padding: 10px; border-radius: 10px; background: rgba(4,12,28,.55); box-shadow: 0 0 0 1px var(--mx-line); }
.st-tanks h4 { font-size: 15px; margin-bottom: 10px; }
.tanks { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
.tank { display:flex; flex-direction:column; align-items:center; text-align:center; gap: 6px; padding: 10px 6px; border-radius: 10px; background: rgba(8,22,48,.75); box-shadow: 0 0 0 1px var(--mx-line), 0 0 14px rgba(31,125,255,.12) inset; min-height: 0; }
.tank-svg { width: 44px; height: 62px; }
.tk-glass { stroke: rgba(220,240,255,.85); stroke-width: 1.4; }
.tk-cap { fill: rgba(220,240,255,.85); } .tk-handle, .tk-fold { fill:none; stroke: rgba(220,240,255,.8); stroke-width: 1.4; } .tk-hl { stroke: rgba(255,255,255,.7); stroke-width: 2; stroke-linecap: round; }
.tk-name { display:block; font-size: 12.5px; line-height: 1.15; color: #d5e6f8; }
.tk-val { display:block; font-size: 12.5px; font-weight: 600; color: var(--mx-ok); margin-top: 2px; }
.tank.s-not_installed .tk-val { color: var(--mx-bad); } .tank.s-attention .tk-val { color: var(--mx-warn); } .tank.s-unknown .tk-val { color: var(--mx-dim); }
.tank.s-not_installed { box-shadow: 0 0 0 1px var(--mx-bad); } .tank.s-attention { box-shadow: 0 0 0 1px var(--mx-warn); }
.station-actions { grid-column: 1 / -1; display:flex; flex-wrap:wrap; gap:8px; }

/* SVG stacji */
.plate { fill: rgba(10,24,48,.9); stroke: rgba(63,216,255,.45); stroke-width: 1.2; }
.plate-grid line { stroke: rgba(63,216,255,.18); stroke-width: 1; }
.plate-edge { fill:none; stroke: var(--mx-cyan); stroke-width: 2.5; }
.t-edge { stroke: rgba(150,200,255,.35); stroke-width: 1; }
.t-top { fill: #2c3646; stroke: rgba(170,210,255,.4); }
.t-bay { fill: rgba(2,6,13,.85); stroke: rgba(150,200,255,.3); }
.glass { stroke: rgba(210,240,255,.85); stroke-width: 1.4; }
.glass-hl { stroke: rgba(255,255,255,.6); stroke-width: 2; stroke-linecap: round; }
.lid { stroke: rgba(200,230,255,.7); stroke-width: 3; stroke-linecap: round; }
.band { fill: #3a4558; } .t-mid { fill: rgba(6,10,18,.8); stroke: rgba(150,200,255,.2); }
.led { fill: var(--mx-cyan); }
.mouth { stroke: rgba(63,216,255,.6); stroke-width: 1.2; }
.mouth-glow { stroke: var(--mx-cyan); stroke-width: 3; stroke-linecap: round; opacity: .9; }
.robot .r-shadow { fill: rgba(0,0,0,.55); }
.robot .r-side { stroke: rgba(120,180,255,.35); }
.robot .r-glow { fill:none; stroke: var(--mx-cyan); stroke-width: 3; filter: var(--g); opacity: .95; }
.robot .r-top { stroke: rgba(160,210,255,.55); stroke-width: 1.2; }
.robot .r-ring { fill: none; stroke: rgba(170,215,255,.25); stroke-width: 1.2; }
.robot .r-hl { fill: rgba(255,255,255,.08); }
.robot .r-lds-side { fill: #0b121e; stroke: rgba(150,200,255,.4); }
.robot .r-lds { fill: #1a2537; stroke: rgba(170,215,255,.6); }
.robot .r-lds-light { fill: none; stroke: var(--mx-cyan); stroke-width: 2.2; }
.robot .r-bumper { fill:none; stroke: rgba(63,216,255,.7); stroke-width: 2; }
.robot .r-brush line { stroke: rgba(200,225,255,.5); stroke-width: 1.4; }
.clean-path, .return-arrow { fill: none; stroke: var(--mx-cyan); stroke-width: 2.4; stroke-dasharray: 6 6; opacity: 0; }
.v-cleaning .clean-path { opacity: .85; animation: mx-dash 1.6s linear infinite; }
.v-paused .clean-path { opacity: .35; }
.v-returning .return-arrow { opacity: .9; animation: mx-dash 1s linear infinite; }
.v-cleaning .robot-motion { animation: mx-roam 6s ease-in-out infinite; }
.v-cleaning .r-brush { animation: mx-spin .5s linear infinite; transform-box: fill-box; transform-origin: center; }
.v-returning .robot-motion { animation: mx-return 2.4s ease-in-out infinite; }
.v-error .robot .r-glow, .v-unavailable .robot .r-glow { stroke: var(--mx-dim); filter: none; }
.v-error .robot .r-lds-light { stroke: var(--mx-bad); }
.v-paused .robot .r-lds-light { stroke: var(--mx-warn); }
.fx { opacity: 0; }
.v-washing .fx-wash, .v-drying .fx-dry, .v-auto_empty .fx-empty { opacity: 1; }
.drop { fill: var(--mx-cyan); animation: mx-drop 1.4s ease-in infinite; }
.d1{animation-delay:.25s}.d2{animation-delay:.5s}.d3{animation-delay:.75s}.d4{animation-delay:1s}
.wave { fill:none; stroke: var(--mx-warn); stroke-width: 2; stroke-linecap: round; animation: mx-rise 2.2s ease-in-out infinite; }
.w1{animation-delay:.6s}.w2{animation-delay:1.2s}
.dust { fill: #cfe8ff; animation: mx-suck 1.2s ease-in infinite; }
.p1{animation-delay:.2s}.p2{animation-delay:.4s}.p3{animation-delay:.6s}.p4{animation-delay:.8s}.p5{animation-delay:1s}
.hero-floor { fill: rgba(31,125,255,.28); filter: blur(5px); }
.sparks .sp { animation: mx-spark 1.1s ease-out infinite; }
.sparks .warm { fill: #ffb347; stroke: #ffb347; } .sparks .cool { fill: #6fd6ff; stroke: #6fd6ff; }
.sparks .arc { fill: none; stroke-width: 2; opacity: .8; animation: mx-flicker .4s steps(2) infinite; }
.sp1{animation-delay:.15s}.sp2{animation-delay:.3s}.sp3{animation-delay:.5s}.sp4{animation-delay:.7s}
@keyframes mx-dash { to { stroke-dashoffset: -24; } }
@keyframes mx-roam { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,-6px); } }
@keyframes mx-return { 0% { transform: translate(-14px,4px); } 100% { transform: translate(18px,-4px); } }
@keyframes mx-spin { to { transform: rotate(360deg); } }
@keyframes mx-drop { 0% { transform: translateY(-20px); opacity:0 } 30%{opacity:1} 100% { transform: translateY(14px); opacity:0 } }
@keyframes mx-rise { 0% { transform: translateY(0); opacity:0 } 40%{opacity:.9} 100% { transform: translateY(-46px); opacity:0 } }
@keyframes mx-suck { 0% { transform: translateY(0); opacity:0 } 20%{opacity:1} 100% { transform: translateY(-110px); opacity:0 } }
@keyframes mx-spark { 0% { opacity: 0; transform: translateY(4px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
@keyframes mx-flicker { 50% { opacity: .3; } }

/* ===== robot + sterowanie ===== */
.robot-panel { display:grid; grid-template-columns: minmax(0,.95fr) minmax(0,1.25fr) minmax(0,1.5fr); gap: 14px; align-items: center; }
.rp-hero { position: relative; }
.rp-name b { display:block; font-size: 24px; font-weight: 700; line-height: 1; } .rp-name small { color: var(--mx-cyan); font-size: 15px; }
.rp-hero .hero-robot, .rp-hero .hero-img { width: 100%; height: auto; display:block; margin-top: 4px; }
.rp-now { display:flex; align-items:center; gap: 10px; }
.rp-now ha-icon { color: var(--mx-ok); --mdc-icon-size: 26px; }
.rp-now span { display:block; color: var(--mx-ok); font-size: 13px; } .rp-now b { font-size: 17px; font-weight: 600; }
.rp-prog { display:flex; align-items:center; gap: 10px; margin: 8px 0 6px; } .rp-prog b { font-size: 18px; min-width: 44px; text-align: right; }
.bar { flex: 1; height: 8px; border-radius: 4px; background: rgba(63,216,255,.12); overflow:hidden; }
.bar > i { display:block; height:100%; background: linear-gradient(90deg, var(--mx-blue), var(--mx-cyan)); box-shadow: 0 0 12px var(--mx-cyan); border-radius: 4px; }
.stats3 { display:grid; grid-template-columns: repeat(3, 1fr); }
.stats3 > div { padding: 0 8px; border-left: 1px solid var(--mx-line); } .stats3 > div:first-child { border-left: 0; padding-left: 0; }
.stats3 b { font-size: 19px; font-weight: 600; display:block; } .stats3 span { font-size: 12px; color: var(--mx-dim); }
.rp-mode { display:flex; align-items:center; gap: 10px; margin-top: 8px; }
.rp-mode ha-icon { --mdc-icon-size: 22px; color: var(--mx-cyan); }
.rp-mode b { display:block; font-size: 14px; font-weight: 600; } .rp-mode span { font-size: 12.5px; color: var(--mx-dim); }
.ctrl-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; height: 100%; }
.big { min-height: 120px; border-radius: 12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 10px; font-size: 20px; font-weight: 600;
  background: linear-gradient(180deg, rgba(14,32,66,.9), rgba(6,16,36,.9)); box-shadow: 0 0 0 1px var(--mx-line), 0 0 16px rgba(31,125,255,.15) inset; }
.big ha-icon { --mdc-icon-size: 40px; }
.big.primary { background: linear-gradient(180deg, #2a8bff, #0b52d0); box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 28px rgba(31,125,255,.7); }

.modes-panel h4 { color: #dbe9fb; }
.opts { display:grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 8px; }
.opts.row { grid-template-columns: repeat(4, 1fr); margin-bottom: 10px; }
.opt { padding: 10px 4px; border-radius: 10px; font-size: 12.5px; display:flex; flex-direction:column; align-items:center; gap: 6px; background: rgba(6,16,36,.8); box-shadow: 0 0 0 1px var(--mx-line); }
.opts.row .opt { flex-direction: row; justify-content: center; gap: 8px; padding: 12px 6px; text-align: left; }
.opt ha-icon { color: var(--mx-cyan); --mdc-icon-size: 24px; }
.opt.active { background: linear-gradient(180deg, rgba(31,125,255,.85), rgba(13,79,196,.75)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 16px rgba(63,216,255,.5); }
.opt.active ha-icon { color: #fff; }
.modes-split { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ===== pomieszczenia ===== */
.seg { display:flex; padding: 3px; border-radius: 9px; box-shadow: 0 0 0 1px var(--mx-line); background: rgba(4,12,28,.7); }
.seg button { padding: 6px 14px; border-radius: 7px; font-size: 13px; color: var(--mx-dim); }
.seg button.on { background: linear-gradient(180deg, #2a8bff, #0b52d0); color: #fff; box-shadow: 0 0 10px rgba(31,125,255,.6); }
.rooms { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; }
.room { position: relative; text-align:left; padding: 9px 26px 9px 10px; border-radius: 10px; min-height: 68px; background: rgba(6,16,36,.8); box-shadow:0 0 0 1px var(--mx-line); }
.r-ic ha-icon { color: var(--rc); --mdc-icon-size: 20px; filter: drop-shadow(0 0 4px var(--rc)); }
.room b { display:block; font-size: 13.5px; font-weight: 600; margin-top: 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.r-sub { font-size: 12px; color: var(--mx-dim); }
.r-arrow { position:absolute; right: 9px; top: 50%; width: 0; height: 0; transform: translateY(-50%); border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 10px solid var(--rc); filter: drop-shadow(0 0 5px var(--rc)); }
.room.sel { background: linear-gradient(180deg, rgba(31,125,255,.75), rgba(13,79,196,.55)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 16px rgba(63,216,255,.45); }
.room.sel .r-ic ha-icon { color: #fff; } .room.sel .r-sub { color: #dcecff; }
.room.cur::after { content:""; position:absolute; top:8px; right:8px; width:7px; height:7px; border-radius:50%; background: var(--mx-ok); box-shadow:0 0 8px var(--mx-ok); }
.room-actions { display:none; gap:8px; margin-top: 10px; flex-wrap: wrap; } .room-actions.show { display:flex; }

/* ===== zaawansowane ===== */
.tabs { display:flex; gap: 2px; padding: 3px; border-radius: 9px; background: rgba(4,12,28,.7); box-shadow: 0 0 0 1px var(--mx-line); margin-bottom: 10px; overflow-x: auto; scrollbar-width: none; }
.tabs button { flex: 1 0 auto; padding: 7px 6px; border-radius: 7px; font-size: 12px; color: #c9dbf0; white-space: nowrap; }
.tabs button.on { background: linear-gradient(180deg, #2a8bff, #0b52d0); color: #fff; box-shadow: 0 0 10px rgba(31,125,255,.6); }
.adv-cols { display:grid; grid-template-columns: minmax(0,1.15fr) minmax(0,1fr); gap: 10px; }
.adv-left, .adv-right { display:flex; flex-direction:column; gap: 6px; min-width: 0; }
.adv-right { padding-left: 10px; border-left: 1px solid var(--mx-line); }
.genius { padding: 10px; border-radius: 10px; background: rgba(8,22,48,.75); box-shadow: 0 0 0 1px var(--mx-line); display:flex; flex-direction:column; gap: 6px; }
.g-head { display:flex; align-items:center; gap: 10px; }
.g-ic { width: 36px; height: 36px; border-radius: 50%; display:grid; place-items:center; color: #d9a6ff; box-shadow: 0 0 0 1px rgba(200,140,255,.6), 0 0 12px rgba(200,140,255,.45); }
.g-head b { display:block; font-size: 15px; } .g-head small { font-size: 11.5px; color: var(--mx-dim); }
.g-head .tgbtn { margin-left: auto; }
.g-note { font-size: 12.5px; color: #d5e6f8; }
.sel-row { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size: 12.5px; color: #d5e6f8; }
.sel-row select { background: rgba(4,12,28,.9); color: var(--mx-text); border: 1px solid var(--mx-line); border-radius: 7px; padding: 6px 8px; font: inherit; font-size: 12.5px; width: 56%; min-width: 0; }
.sw { display:flex; justify-content:space-between; align-items:center; gap:8px; padding: 6px 0; font-size: 12.5px; text-align:left; color: #d5e6f8; width: 100%; }
.tg { width: 34px; height: 18px; border-radius: 9px; background: rgba(127,155,189,.35); position: relative; flex: 0 0 auto; transition: background .2s; display:inline-block; }
.tg::after { content:""; position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#cfe2f7; transition: left .2s; }
.tg.on { background: var(--mx-blue); box-shadow: 0 0 10px rgba(63,216,255,.6); } .tg.on::after { left: 18px; background:#fff; }
.sw-list { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 4px 18px; }
.sw-list .sw { border-bottom: 1px solid rgba(63,216,255,.1); padding: 9px 0; font-size: 14px; }

/* ===== serwis ===== */
.svc { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
.svc-item { text-align:center; padding: 10px 4px; border-radius: 10px; background: rgba(6,16,36,.75); box-shadow:0 0 0 1px var(--mx-line); }
.ring { width: 64px; height: 64px; display:block; margin: 0 auto 4px; }
.ring .bg { stroke: rgba(63,216,255,.12); } .ring .fg { stroke-linecap: round; transition: stroke-dashoffset .6s; }
.ring text { fill: var(--mx-text); font-size: 14px; font-weight: 700; }
.svc-item b { display:block; font-size: 12.5px; font-weight: 500; }
.svc-item small { display:block; color: var(--mx-dim); font-size: 12px; }
.rst { margin-top: 6px; font-size: 12px; color: var(--mx-cyan); padding: 4px 10px; border-radius: 7px; box-shadow: 0 0 0 1px var(--mx-line); }

/* ===== historia ===== */
.hist { display:flex; flex-direction:column; gap: 8px; }
.h-item { display:grid; grid-template-columns: 64px minmax(0,1fr) auto; gap: 10px; align-items:center; padding: 6px; border-radius: 10px; background: rgba(6,16,36,.75); box-shadow:0 0 0 1px var(--mx-line); }
.h-thumb { width: 64px; height: 46px; border-radius: 6px; object-fit: cover; background: rgba(31,125,255,.15); box-shadow: 0 0 0 1px var(--mx-line); }
.h-txt { min-width:0; } .h-txt b, .h-txt span { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .h-txt b { font-size: 14px; font-weight: 600; } .h-txt span { font-size: 12px; color: var(--mx-dim); }
.h-side { display:flex; flex-direction:column; align-items:flex-end; gap: 2px; }
.h-date { font-size: 11px; color: var(--mx-dim); white-space: nowrap; }
.h-ok { color: var(--mx-ok); } .h-bad { color: var(--mx-warn); }
.h-ok ha-icon, .h-bad ha-icon { --mdc-icon-size: 22px; }

/* ===== inne ===== */
.rtable { width:100%; border-collapse:collapse; font-size:13px; } .rtable th { text-align:left; padding:6px; color: var(--mx-dim); font-weight: 500; } .rtable td { padding:6px; border-top: 1px solid rgba(63,216,255,.1); }
.err-banner { padding: 10px 12px; border-radius: 10px; background: rgba(255,90,110,.15); box-shadow: 0 0 0 1px var(--mx-bad); color: #ffd5db; margin-bottom: 10px; display:flex; gap:8px; align-items:center; }
.toast { position:absolute; bottom: 14px; left: 50%; transform: translateX(-50%); background: rgba(6,16,36,.96); box-shadow: 0 0 0 1px var(--mx-line-strong); padding: 8px 14px; border-radius: 10px; font-size: 13px; z-index: 5; }

/* ===== responsywność ===== */
@container (max-width: 1380px) {
  .row3 { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .top { grid-template-columns: auto 1fr auto; } .brand .hero-robot { width: 90px; }
}
@container (max-width: 1150px) {
  .row1 { grid-template-columns: 1fr; } .row1 .nav, .page .nav { flex-direction: row; overflow-x: auto; scrollbar-width: none; }
  .page { grid-template-columns: 1fr; }
  .nav button { flex: 0 0 auto; padding: 10px 12px; }
  .row2 { grid-template-columns: 1fr; }
  .top { grid-template-columns: 1fr auto; } .tele { grid-column: 1 / -1; order: 3; }
}
@container (max-width: 760px) {
  .robot-panel { grid-template-columns: 1fr; }
  .station-panel { grid-template-columns: 1fr; }
  .row3 { grid-template-columns: 1fr; }
  .rooms { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .adv-cols { grid-template-columns: 1fr; } .adv-right { border-left: 0; padding-left: 0; }
  .modes-split { grid-template-columns: 1fr; } .opts.row { grid-template-columns: repeat(2, 1fr); }
  .map-view { min-height: 300px; }
  .nav button span { display: none; }
  .brand h1 { font-size: 26px; } .clock b { font-size: 26px; }
  .chip { min-width: 128px; }
}
@container (max-width: 420px) { .st-body { grid-template-columns: 1fr; } .svc { grid-template-columns: repeat(2, 1fr); } .ctrl-row .big { min-height: 92px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;

// ===== src/views/views.js =====
// Widoki karty (układ 1:1 z zatwierdzonym mockupem). Tylko HTML, bez wywołań usług.







const icon = (i, cls = '') => `<ha-icon class="${cls}" icon="${esc(i)}"></ha-icon>`;
const pct = (v) => Math.max(0, Math.min(100, toNum(v) ?? 0));
const ROOM_COLORS = ['#ffb347', '#3fa9ff', '#c86bff', '#38e59b', '#ff6fb1'];
const roomColor = (r) => ROOM_COLORS[((r.color ?? r.id) % ROOM_COLORS.length + ROOM_COLORS.length) % ROOM_COLORS.length];
const opts = (so) => (Array.isArray(so?.attributes?.options) ? so.attributes.options : (pyParse(so?.attributes?.options) || []));

// ---------- kontekst ----------
function makeCtx(hass, config, e, ui) {
  const st = (k) => hass.states[e[k]];
  const fmt = (so) => {
    if (!so) return '—';
    if (isUnavail(so)) return PL.generic.unavailable;
    try { return hass.formatEntityState ? hass.formatEntityState(so) : so.state; } catch (_) { return so.state; }
  };
  const p = String(e.vacuum).split('.')[1];
  const ent = (domain, key) => hass.states[`${domain}.${p}_${key}`];
  return { hass, config, e, ui, st, fmt, ent, p, vac: hass.states[e.vacuum], cam: hass.states[e.map] };
}

// ---------- nagłówek ----------
function renderTop(c, visual) {
  const a = c.vac?.attributes || {};
  const batt = toNum(c.st('battery')?.state ?? a.battery);
  const chg = String(c.ent('sensor', 'charging_status')?.state || '');
  const battLab = chg === 'charging' ? 'Ładowanie…' : chg === 'charging_completed' ? 'Naładowany' : 'Bateria';
  const now = new Date();
  const ap = pyParse(a.ap);
  const rssi = toNum(ap?.rssi);
  const wifi = rssi === null ? 'mdi:wifi' : rssi > -55 ? 'mdi:wifi-strength-4' : rssi > -67 ? 'mdi:wifi-strength-3' : rssi > -75 ? 'mdi:wifi-strength-2' : 'mdi:wifi-strength-1';
  const dnd = c.ent('switch', 'dnd');
  const chip = (ic, val, lab, cls = '') => `<div class="chip ${cls}"><span class="chip-ic">${icon(ic)}</span><div><b>${esc(val)}</b><span>${esc(lab)}</span></div></div>`;
  const date = now.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/^./, (x) => x.toUpperCase()).replace('.,', ',');
  return `
  <header class="top">
    <div class="brand">${heroRobotSvg(visual, { image: c.config.robot_image })}<div><h1>${esc(c.config.name || 'Mieciu')}</h1><small>${esc(c.config.model || 'Dreame X50 Ultra')}</small></div></div>
    <div class="tele">
      ${chip(batt === null ? 'mdi:battery-unknown' : chg === 'charging' ? 'mdi:battery-charging' : 'mdi:battery', batt === null ? '—' : `${batt}%`, battLab, 'c-batt')}
      ${chip('mdi:home', PL.visual[visual] || '—', 'Stan', 'c-home')}
      ${chip('mdi:map-plus', a.selected_map || '—', 'Aktualna mapa')}
      ${chip('mdi:vector-square', c.st('total_area') ? `${fmtNum(toNum(c.st('total_area').state))} m²` : '—', 'Łącznie')}
      ${chip('mdi:sync', c.st('cleaning_count') ? fmtNum(toNum(c.st('cleaning_count').state)) : '—', 'Cykli')}
      ${chip('mdi:clock-outline', c.st('cleaning_time') && !isUnavail(c.st('cleaning_time')) ? fmtMinutes(c.st('cleaning_time').state) : '—', 'Ostatnie sprzątanie')}
    </div>
    <div class="clock">
      <div class="clock-row"><b>${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</b>${icon(wifi, 'wifi')}</div>
      <div class="clock-row"><span>${esc(date)}</span>
        <button class="hbtn ${dnd?.state === 'on' ? 'on' : ''}" title="Nie przeszkadzać">${icon('mdi:weather-night')}</button>
        <button class="hbtn" data-act="tab" data-tab="settings" title="Ustawienia">${icon('mdi:cog')}</button></div>
    </div>
  </header>`;
}

function renderErrorBanner(c) {
  const err = c.st('error');
  if (!err || isUnavail(err) || err.state === 'no_error') return '';
  return `<div class="err-banner">${icon('mdi:alert-circle')}<span>${esc(err.attributes?.description || c.fmt(err))}</span></div>`;
}

const TABS = [
  ['map', 'mdi:map-legend', 'Mapa'], ['cleaning', 'mdi:hand-back-right-outline', 'Sprzątanie'], ['station', 'mdi:home-floor-g', 'Stacja'],
  ['service', 'mdi:tools', 'Serwis'], ['history', 'mdi:calendar-clock', 'Historia'], ['settings', 'mdi:tune-variant', 'Ustawienia'],
];
function renderNav(tab) {
  return `<nav class="nav panel">${TABS.map(([k, ic, lab]) =>
    `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${icon(ic)}<span>${lab}</span></button>`).join('')}</nav>`;
}

// ---------- mapa ----------
function renderMap(c, dims) {
  const ui = c.ui;
  const rooms = getRooms(c.vac, c.cam);
  const T = buildTransform(c.cam?.attributes?.calibration_points);
  const cur = toNum(c.vac?.attributes?.current_segment);
  let overlay = '';
  if (dims && T && ui.labels) {
    const s = Math.max(dims.w, dims.h) / 46;
    overlay = `<svg class="map-overlay" viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}">
      ${rooms.filter((rm) => rm.x !== null && rm.visible).map((rm) => {
        const [px, py] = T(rm.x, rm.y);
        const sel = ui.selected.has(rm.id);
        const w = Math.max(5, (rm.name || '').length * 0.62 + 2) * s;
        return `<g class="rm${sel ? ' sel' : ''}${rm.id === cur ? ' cur' : ''}" data-act="room" data-room="${rm.id}" style="--rc:${roomColor(rm)}">
          <rect x="${px - w / 2}" y="${py - s * 1.25}" width="${w}" height="${s * 2.5}" rx="${s * 0.5}"/>
          <text x="${px}" y="${py + s * 0.35}" text-anchor="middle" style="font-size:${s}px">${sel ? `${[...ui.selected].indexOf(rm.id) + 1}. ` : ''}${esc(rm.name || rm.id)}</text></g>`;
      }).join('')}
    </svg>`;
  }
  const hasImg = !!c.cam?.attributes?.entity_picture && !isUnavail(c.cam);
  const tool = (act, ic, title, active = false, extra = '') => `<button class="tool ${active ? 'active' : ''}" data-act="${act}" ${extra} title="${title}">${icon(ic)}</button>`;
  return `
  <section class="panel map-panel">
    <div class="map-tools">
      ${tool('holo', 'mdi:layers-outline', 'Warstwa holograficzna', ui.holo)}
      ${tool('fit', 'mdi:crosshairs-gps', 'Wyśrodkuj')}
      ${tool('zoom', 'mdi:magnify-plus-outline', 'Przybliż', false, 'data-dir="1"')}
      ${tool('zoom', 'mdi:magnify-minus-outline', 'Oddal', false, 'data-dir="-1"')}
      ${tool('labels', 'mdi:label-outline', 'Etykiety pokoi', ui.labels)}
      ${tool('all-rooms', 'mdi:select-all', 'Zaznacz wszystkie')}
      <div class="dim2d3d"><button class="${!ui.map3d ? 'on' : ''}" data-act="map2d">2D</button><i></i><button class="${ui.map3d ? 'on' : ''}" data-act="map3d">3D</button></div>
    </div>
    <div class="map-col">
      <div class="map-view">
        ${hasImg ? `<div class="map-stage"><div class="map-3d ${ui.map3d ? 'on' : ''}"><div class="img-slot"></div>${overlay}</div></div>`
          : `<div class="map-empty">${icon('mdi:map-marker-off-outline')}<br>${PL.generic.noMap}<br><small>${esc(c.e.map)}</small></div>`}
        <div class="compass">N</div>
      </div>
      <div class="map-modes">
        <button class="pill active">${icon('mdi:selection-marker')}Pokój</button>
        <button class="pill" disabled title="${PL.generic.soon}">${icon('mdi:map-marker-radius-outline')}Strefa</button>
        <button class="pill" disabled title="${PL.generic.soon}">${icon('mdi:crosshairs')}Punkt</button>
        <button class="pill" disabled title="${PL.generic.soon}">${icon('mdi:alert-outline')}Zakazana</button>
      </div>
    </div>
  </section>`;
}

// ---------- stacja ----------
function stationProcesses(c, visual) {
  const a = c.vac?.attributes || {};
  const row = (ic, label, val, cls) => `<div class="proc-item ${cls}">${icon(ic)}<div><span>${esc(label)}</span><b>${esc(val)}</b></div></div>`;
  const out = [];
  const base = c.st('self_wash_base_status');
  const err = c.st('error');
  const hasErr = err && !isUnavail(err) && err.state !== 'no_error';
  if (base) {
    const v = hasErr ? 'Błąd' : STATION_ACTIVE.has(visual) ? PL.visual[visual] : base.state === 'idle' ? 'Gotowa' : c.fmt(base);
    out.push(`<div class="proc-ready ${hasErr ? 'bad' : ''}">${icon('mdi:check-decagram-outline')}<b>${esc(v)}</b></div>`);
  }
  const avail = (busy, available, busyLab = 'W toku') => (busy ? [busyLab, 'busy'] : available ? ['Dostępne', ''] : ['Niedostępne', 'off']);
  let [v, cl] = avail(toBool(a.washing), toBool(a.washing_available));
  out.push(row('mdi:washing-machine', 'Mycie mopów', v, cl));
  const dl = c.st('drying_left');
  [v, cl] = avail(toBool(a.drying), toBool(a.drying_available), dl && !isUnavail(dl) ? `W toku · ${fmtMinutes(dl.state)}` : 'W toku');
  out.push(row('mdi:fan', 'Suszenie', v, cl));
  [v, cl] = avail(visual === 'auto_empty', toBool(a.dust_collection_available));
  out.push(row('mdi:delete-variant', 'Opróżnianie', v, cl));
  const refill = c.ent('switch', 'auto_water_refilling');
  const lowWater = toBool(a.low_water) || (c.st('low_water_warning') && !['no_warning', 'unavailable', 'unknown'].includes(c.st('low_water_warning').state));
  if (refill || lowWater) {
    out.push(row('mdi:water-plus', 'Dolewanie wody', lowWater ? 'Niski poziom' : refill?.state === 'on' ? 'Włączone' : 'Wyłączone', lowWater ? 'warn' : refill?.state === 'on' ? '' : 'off'));
  }
  const det = c.st('detergent');
  if (det) {
    const ts = tankStatus(det);
    out.push(row('mdi:bottle-tonic-outline', 'Detergent', ts === 'installed' ? 'Dostępny' : PL.tank[ts], ts === 'installed' ? '' : ts === 'unknown' ? 'off' : 'warn'));
  }
  return out.join('');
}

function tankTiles(c) {
  const tiles = [['clean_water', 'clean_water_tank'], ['dirty_water', 'dirty_water_tank'], ['dust_bag', 'dust_bag'], ['detergent', 'detergent']];
  return tiles.map(([kind, key]) => {
    const so = c.st(key);
    const s = tankStatus(so);
    return `<div class="tank s-${s}">${tankSvg(kind)}<div><span class="tk-name">${esc(PL.tankName[kind])}</span><b class="tk-val">${esc(PL.tank[s])}</b></div></div>`;
  }).join('');
}

function renderStation(c, visual, withActions = false) {
  const btns = !withActions ? '' : [
    ['btn_auto_empty', 'mdi:delete-empty', 'Opróżnij'], ['btn_self_clean', 'mdi:dishwasher', 'Umyj mopy'],
    ['btn_manual_drying', 'mdi:weather-sunny', 'Susz'], ['btn_base_station_cleaning', 'mdi:car-wash', 'Czyść stację'],
    ['btn_empty_water_tank', 'mdi:waves-arrow-up', 'Opróżnij zbiornik'],
  ].filter(([k]) => c.st(k)).map(([k, ic, lab]) =>
    `<button class="pill" data-act="press" data-entity="${esc(c.e[k])}" data-label="${esc(lab)}" ${c.st(k).state === 'unavailable' ? 'disabled' : ''}>${icon(ic)}${lab}</button>`).join('');
  return `
  <section class="panel station-panel">
    <div class="st-left">
      <div class="st-head"><span class="st-ic">${icon('mdi:home-import-outline')}</span><div><h3>Stacja dokująca</h3><small>${esc(c.config.station_name || 'Dreame PowerDock')}</small></div></div>
      <div class="st-body">
        <div class="st-art">${stationSvg(visual, { image: c.config.station_image })}</div>
        <div class="proc">${stationProcesses(c, visual)}</div>
      </div>
    </div>
    <div class="st-tanks">
      <h4>Zbiorniki i pojemniki</h4>
      <div class="tanks">${tankTiles(c)}</div>
    </div>
    ${btns ? `<div class="station-actions">${btns}</div>` : ''}
  </section>`;
}

// ---------- robot + przyciski ----------
function renderRobot(c, visual) {
  const a = c.vac?.attributes || {};
  const prog = toNum(c.st('cleaning_progress')?.state ?? a.cleaning_progress);
  const room = c.st('current_room');
  const running = visual === 'cleaning' || visual === 'returning' || visual === 'paused';
  const dis = isUnavail(c.vac) ? 'disabled' : '';
  const act = pyParse(a.active_segments);
  const done = pyParse(a.completed_segments);
  const actN = Array.isArray(act) ? act.length : null;
  const doneN = Array.isArray(done) ? done.length : (actN ? 0 : null);
  const area = c.st('cleaned_area'), time = c.st('cleaning_time');
  const mode = c.st('cleaning_mode'), suc = c.st('suction_level'), hum = c.st('mop_pad_humidity');
  const headLab = visual === 'cleaning' ? 'Aktywnie sprząta' : visual === 'paused' ? 'Wstrzymano' : visual === 'returning' ? 'Wraca do stacji' : 'Status';
  const headVal = visual === 'cleaning' || visual === 'paused' ? (room && !isUnavail(room) ? room.state : PL.visual[visual]) : PL.visual[visual];
  return `
  <section class="panel robot-panel">
    <div class="rp-hero">
      <div class="rp-name"><b>${esc(c.config.name || 'Mieciu')}</b><small>${esc(c.config.model || 'Dreame X50 Ultra')}</small></div>
      ${heroRobotSvg(visual, { sparks: visual === 'cleaning', image: c.config.robot_image })}
    </div>
    <div class="rp-info">
      <div class="rp-now">${icon(visual === 'cleaning' ? 'mdi:battery-charging-high' : 'mdi:information-outline')}<div><span>${headLab}</span><b>${esc(headVal)}</b></div></div>
      <div class="rp-prog"><div class="bar"><i style="width:${running && prog !== null ? pct(prog) : 0}%"></i></div><b>${running && prog !== null ? `${prog}%` : ''}</b></div>
      <div class="stats3">
        <div><b>${area && !isUnavail(area) ? `${fmtNum(toNum(area.state))} m²` : '—'}</b><span>Powierzchnia</span></div>
        <div><b>${time && !isUnavail(time) ? fmtMinutes(time.state) : '—'}</b><span>Czas</span></div>
        <div><b>${running && actN ? `${doneN} / ${actN}` : '—'}</b><span>Pokoje</span></div>
      </div>
      <div class="rp-mode">${icon('mdi:robot-vacuum')}<div><b>${esc(optLabel(mode?.state))}</b><span>${esc(optLabel(suc?.state).toLowerCase())} / ${esc(optLabel(hum?.state).toLowerCase())}</span></div></div>
    </div>
    <div class="ctrl-row">
      <button class="big primary" data-act="start" ${dis}>${icon('mdi:play')}<span>${visual === 'paused' ? PL.generic.resume : PL.generic.start}</span></button>
      <button class="big" data-act="pause" ${dis || (visual !== 'cleaning' && visual !== 'returning' ? 'disabled' : '')}>${icon('mdi:pause')}<span>${PL.generic.pause}</span></button>
      <button class="big" data-act="dock" ${dis}>${icon('mdi:home')}<span>${PL.generic.dock}</span></button>
    </div>
  </section>`;
}

const OPT_ICONS = {
  sweeping: 'mdi:robot-vacuum', sweeping_and_mopping: 'mdi:robot-vacuum-variant', mopping: 'mdi:water-outline', mopping_after_sweeping: 'mdi:autorenew',
  quiet: 'mdi:fan-speed-1', silent: 'mdi:fan-speed-1', standard: 'mdi:fan-speed-2', strong: 'mdi:fan-speed-3', turbo: 'mdi:fan-plus',
  slightly_dry: 'mdi:water-minus-outline', moist: 'mdi:water-outline', wet: 'mdi:water',
};
function optTiles(c, key, cls = '') {
  const so = c.st(key);
  if (!so) return '<span class="dim">brak encji</span>';
  if (isUnavail(so)) return `<span class="dim">${PL.generic.unavailable}</span>`;
  return `<div class="opts ${cls}">${opts(so).map((o) =>
    `<button class="opt ${so.state === o ? 'active' : ''}" data-act="select" data-entity="${esc(so.entity_id)}" data-option="${esc(o)}">${icon(OPT_ICONS[o] || 'mdi:circle-medium')}<span>${esc(optLabel(o))}</span></button>`).join('')}</div>`;
}

function renderModes(c) {
  return `
  <section class="panel modes-panel">
    <h4>${PL.generic.cleaningMode}</h4>${optTiles(c, 'cleaning_mode', 'row')}
    <div class="modes-split">
      <div><h4>${PL.generic.suction}</h4>${optTiles(c, 'suction_level')}</div>
      <div><h4>${PL.generic.humidity}</h4>${optTiles(c, 'mop_pad_humidity')}</div>
    </div>
  </section>`;
}

// ---------- pomieszczenia ----------
function renderRooms(c, canClean) {
  const rooms = getRooms(c.vac, c.cam);
  const cur = toNum(c.vac?.attributes?.current_segment);
  const sel = c.ui.selected;
  const view = c.ui.roomsView || 'all';
  let list = rooms;
  if (view === 'order') {
    list = [...rooms].sort((x, y) => (toNum(c.hass.states[roomEntity(c.config, x.id, 'order')]?.state) ?? x.order ?? 99)
      - (toNum(c.hass.states[roomEntity(c.config, y.id, 'order')]?.state) ?? y.order ?? 99));
  }
  const tiles = list.map((r) => {
    const floor = c.hass.states[roomEntity(c.config, r.id, 'floor_material')];
    const ord = c.hass.states[roomEntity(c.config, r.id, 'order')];
    const sub = view === 'order' ? `Kolejność ${ord && !isUnavail(ord) ? ord.state : r.order ?? '—'}` : floor && !isUnavail(floor) ? optLabel(floor.state) : `#${r.id}`;
    return `<button class="room ${sel.has(r.id) ? 'sel' : ''} ${r.id === cur ? 'cur' : ''}" data-act="room" data-room="${r.id}" style="--rc:${roomColor(r)}">
      <span class="r-ic">${icon(r.icon || 'mdi:home-outline')}</span><b>${esc(r.name || `Pokój ${r.id}`)}</b><span class="r-sub">${esc(sub)}</span><i class="r-arrow"></i></button>`;
  }).join('');
  return `
  <section class="panel rooms-panel">
    <div class="ptitle"><span>${PL.generic.rooms} (${rooms.length})</span>
      <div class="seg">
        <button class="${view === 'all' ? 'on' : ''}" data-act="roomsview" data-view="all">Wszystkie</button>
        <button disabled title="${PL.generic.soon}">Strefy</button>
        <button class="${view === 'order' ? 'on' : ''}" data-act="roomsview" data-view="order">Kolejność</button>
      </div></div>
    <div class="rooms">${tiles || '<span class="dim">Brak danych pokoi</span>'}</div>
    <div class="room-actions ${sel.size ? 'show' : ''}">
      <button class="pill active" data-act="clean-rooms" ${!sel.size || !canClean ? 'disabled' : ''}>${icon('mdi:play')}${PL.generic.cleanSelected}${sel.size ? ` (${sel.size})` : ''}</button>
      <button class="pill" data-act="clear-rooms" ${!sel.size ? 'disabled' : ''}>${PL.generic.clear}</button>
    </div>
  </section>`;
}

// ---------- ustawienia zaawansowane ----------
const ADV = {
  general: { label: 'Ogólne', selects: ['cleaning_route', 'auto_recleaning', 'auto_rewashing', 'mop_extend_frequency'], switches: ['resume_cleaning', 'customized_cleaning', 'mop_extend', 'side_reach', 'gap_cleaning_extension', 'mopping_under_furnitures'] },
  carpets: { label: 'Dywany', selects: ['carpet_cleaning'], switches: ['carpet_boost', 'clean_carpets_first', 'intensive_carpet_cleaning', 'side_brush_carpet_rotate', 'large_particles_boost'] },
  cleangenius: { label: 'CleanGenius', genius: true, selects: ['water_temperature', 'washing_mode', 'self_clean_frequency'], switches: ['carpet_boost', 'clean_carpets_first', 'smart_mop_washing', 'mop_extend', 'mopping_under_furnitures'] },
  ai: { label: 'AI i przeszkody', selects: ['auto_lds_coverage'], switches: ['ai_obstacle_detection', 'ai_furniture_detection', 'ai_pet_detection', 'ai_fluid_detection', 'obstacle_avoidance', 'collision_avoidance', 'fuzzy_obstacle_detection'] },
  station: { label: 'Stacja', selects: ['drying_time', 'auto_empty_mode', 'washing_mode', 'self_clean_frequency'], switches: ['self_clean', 'auto_drying', 'smart_mop_washing', 'mop_washing_with_detergent', 'mopping_with_detergent', 'silent_drying', 'auto_water_refilling'] },
};

function shortName(so) {
  const fn = so.attributes?.friendly_name || so.entity_id;
  const first = so.entity_id.split('.')[1].split('_')[0];
  const words = fn.split(/\s+/);
  return words.length > 1 && words[0].toLowerCase() === first.toLowerCase() ? words.slice(1).join(' ') : fn;
}

function selectRow(c, so, label) {
  if (!so) return '';
  const name = label || shortName(so);
  if (isUnavail(so)) return `<div class="sel-row"><span>${esc(name)}</span><span class="dim">${PL.generic.unavailable}</span></div>`;
  return `<div class="sel-row"><span>${esc(name)}</span><select data-act="select-change" data-entity="${esc(so.entity_id)}">
    ${opts(so).map((o) => `<option value="${esc(o)}" ${o === so.state ? 'selected' : ''}>${esc(optLabel(o))}</option>`).join('')}</select></div>`;
}

function switchRow(so) {
  if (!so || isUnavail(so)) return '';
  return `<button class="sw" data-act="toggle" data-entity="${esc(so.entity_id)}"><span>${esc(shortName(so))}</span><i class="tg ${so.state === 'on' ? 'on' : ''}"></i></button>`;
}

function renderAdvanced(c, forceTab) {
  const tab = forceTab || (ADV[c.ui.advTab] ? c.ui.advTab : 'cleangenius');
  const def = ADV[tab];
  let left = '';
  if (def.genius) {
    const cg = c.st('cleangenius'), cgm = c.st('cleangenius_mode');
    const on = cg && !isUnavail(cg) && cg.state !== 'off';
    left += `<div class="genius">
      <div class="g-head"><span class="g-ic">${icon('mdi:brain')}</span><div><b>CleanGenius</b><small>Inteligentne sprzątanie (AI)</small></div>
        ${cg && !isUnavail(cg) ? `<button class="tgbtn" data-act="genius" data-entity="${esc(cg.entity_id)}" data-on="${on ? 1 : 0}"><i class="tg ${on ? 'on' : ''}"></i></button>` : ''}</div>
      ${selectRow(c, cg, 'Tryb')}
      ${cgm && !isUnavail(cgm) ? `<div class="g-note">CleanGenius: ${esc(optLabel(cgm.state))}</div>` : ''}
    </div>`;
  }
  left += def.selects.map((k) => selectRow(c, c.ent('select', k))).join('');
  const right = def.switches.map((k) => switchRow(c.ent('switch', k))).join('');
  return `
  <section class="panel adv-panel">
    <h3 class="ptitle">Ustawienia zaawansowane</h3>
    ${forceTab ? '' : `<div class="tabs">${Object.entries(ADV).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-act="advtab" data-tab="${k}">${v.label}</button>`).join('')}</div>`}
    <div class="adv-cols"><div class="adv-left">${left || '<span class="dim">—</span>'}</div><div class="adv-right">${right || '<span class="dim">—</span>'}</div></div>
  </section>`;
}

// ---------- serwis ----------
function ring(v) {
  const n = toNum(v);
  const r = 26, C = 2 * Math.PI * r;
  const col = n === null ? 'var(--mx-dim)' : n > 50 ? 'var(--mx-ok)' : n > 20 ? 'var(--mx-warn)' : 'var(--mx-bad)';
  return `<svg class="ring" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="${r}" fill="none" stroke-width="5"/>
    <circle class="fg" cx="32" cy="32" r="${r}" fill="none" stroke-width="5" stroke="${col}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (n ?? 0) / 100)}" transform="rotate(-90 32 32)" style="filter:drop-shadow(0 0 4px ${col})"/>
    <text x="32" y="36" text-anchor="middle">${n === null ? '—' : `${n}%`}</text></svg>`;
}

const SVC_DASH = ['main_brush', 'side_brush', 'filter', 'sensor_dirty', 'silver_ion', 'scale_inhibitor'];
const SVC_LABEL = { ...PL.service, scale_inhibitor: 'Środek do kamienia' };
function renderService(c, full = false) {
  const maint = c.st('maintenance');
  const keys = full ? SERVICE_ITEMS : SVC_DASH;
  const items = keys.filter((k) => c.st(`svc_${k}_left`)).map((k) => {
    const left = c.st(`svc_${k}_left`), time = c.st(`svc_${k}_time`), rst = c.st(`svc_${k}_reset`);
    const unit = time?.attributes?.unit_of_measurement || '';
    return `<div class="svc-item">${ring(isUnavail(left) ? null : left.state)}<b>${esc(SVC_LABEL[k])}</b>
      <small>${time && !isUnavail(time) ? `${fmtNum(toNum(time.state))} ${esc(unit)}` : '—'}</small>
      ${full && rst && rst.state !== 'unavailable' ? `<button class="rst" data-act="press" data-entity="${esc(rst.entity_id)}" data-label="Reset: ${esc(SVC_LABEL[k])}">Resetuj</button>` : ''}</div>`;
  }).join('');
  const items2 = maint?.state === 'on' ? pyParse(maint.attributes?.items) : null;
  return `
  <section class="panel svc-panel">
    <h3 class="ptitle"><span>Serwis i konserwacja</span>${maint?.state === 'on' ? `<span class="warn small">${icon('mdi:wrench-clock')} ${Array.isArray(items2) ? items2.map((x) => SVC_LABEL[`${x}_dirty`] || SVC_LABEL[x] || x).join(', ') : 'wymaga uwagi'}</span>` : ''}</h3>
    <div class="svc">${items || '<span class="dim">Brak danych</span>'}</div>
  </section>`;
}

// ---------- historia ----------
function parseHistory(histState, camState) {
  if (!histState) return [];
  const skip = new Set(['device_class', 'icon', 'friendly_name']);
  const pics = pyParse(camState?.attributes?.cleaning_history_picture) || {};
  const picByTs = {};
  for (const url of Object.values(pics)) {
    const m = /[?&]v=(\d+)/.exec(String(url));
    if (m) picByTs[m[1]] = url;
  }
  return Object.entries(histState.attributes || {})
    .filter(([k]) => !skip.has(k))
    .map(([k, v]) => {
      const d = pyParse(v) || {};
      const ts = toNum(d.timestamp);
      return {
        key: k, ts, date: ts ? new Date(ts * 1000) : null,
        time: d.cleaning_time, area: d.cleaned_area, status: d.status,
        completed: toBool(d.completed), pic: ts ? picByTs[String(Math.round(ts))] : null,
      };
    })
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
}

function relDate(d) {
  if (!d) return '';
  const now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  const hm = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `Dziś, ${hm}`;
  if (diff === 1) return `Wczoraj, ${hm}`;
  return `${d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}, ${hm}`;
}

function renderHistory(c, limit = 4) {
  const items = parseHistory(c.st('history'), c.cam).slice(0, limit);
  return `
  <section class="panel hist-panel">
    <h3 class="ptitle"><span>Historia sprzątania</span>${limit < 10 ? '<button class="link" data-act="tab" data-tab="history">Zobacz wszystkie</button>' : ''}</h3>
    <div class="hist">${items.map((h) => `
      <div class="h-item">${h.pic ? `<img class="h-thumb" loading="lazy" src="${esc(h.pic)}" alt="">` : '<div class="h-thumb"></div>'}
        <div class="h-txt"><b>${esc(PL.history[h.status] || h.status || 'Sprzątanie')}</b><span>${esc(h.area || '—')} · ${esc(h.time || '—')}</span></div>
        <div class="h-side"><span class="h-date">${esc(relDate(h.date) || h.key)}</span>
        ${h.completed ? `<span class="h-ok">${icon('mdi:check-circle-outline')}</span>` : `<span class="h-bad" title="Przerwane">${icon('mdi:alert-circle-outline')}</span>`}</div>
      </div>`).join('') || '<span class="dim">Brak historii</span>'}</div>
  </section>`;
}

// ---------- ustawienia (wszystkie przełączniki) ----------
function renderSettings(c) {
  const ids = discoverSwitches(c.hass, c.config);
  return `
  <section class="panel">
    <h3 class="ptitle">Ustawienia urządzenia <span class="dim small">niedostępne ukryte</span></h3>
    <div class="sw-list">${ids.map((id) => switchRow(c.hass.states[id])).join('')}</div>
  </section>`;
}

function renderRoomDetails(c) {
  const rooms = getRooms(c.vac, c.cam);
  const keys = ['order', 'floor_material', 'floor_material_direction', 'cleaning_mode', 'suction_level', 'mop_pad_humidity', 'cleaning_times', 'cleaning_route', 'visibility'];
  const labels = { order: 'Kolejność', floor_material: 'Podłoga', floor_material_direction: 'Kierunek', cleaning_mode: 'Tryb', suction_level: 'Ssanie', mop_pad_humidity: 'Mop', cleaning_times: 'Przejazdy', cleaning_route: 'Trasa', visibility: 'Widoczność' };
  const rows = rooms.map((r) => `<tr><td><b>${esc(r.name || r.id)}</b> <span class="dim">#${r.id}</span></td>${keys.map((k) => {
    const so = c.hass.states[roomEntity(c.config, r.id, k)];
    return `<td>${so && !isUnavail(so) ? esc(optLabel(so.state)) : '<span class="dim">—</span>'}</td>`;
  }).join('')}</tr>`).join('');
  return `
  <section class="panel" style="overflow-x:auto">
    <h3 class="ptitle">Ustawienia per pokój <span class="dim small">podgląd · „—” = niedostępne (np. wyłączone Sprzątanie niestandardowe)</span></h3>
    <table class="rtable"><thead><tr><th>Pokój</th>${keys.map((k) => `<th>${labels[k]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

// ===== src/mieciu-x50-card.js =====






const VERSION = '0.1.0';

class MieciuX50Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._ui = { tab: 'map', advTab: 'cleangenius', roomsView: 'all', selected: new Set(), map3d: true, holo: true, labels: true };
    this._view = { x: 0, y: 0, z: null };
    this._refs = [];
    this._mapImg = null;
    this._mapUrl = null;
    this._mapDims = null;
    this._bound = false;
  }

  static getStubConfig(hass) {
    const vac = Object.keys(hass?.states || {}).find((id) => id.startsWith('vacuum.')) || 'vacuum.mieciu';
    return { entity: vac, map_entity: `camera.${vac.split('.')[1]}_map`, name: 'Mieciu' };
  }

  setConfig(config) {
    if (!config || !config.entity || !String(config.entity).startsWith('vacuum.')) {
      throw new Error('mieciu-x50-card: wymagane "entity: vacuum.xxx"');
    }
    this._config = { theme: 'dark', ...config };
    this._e = resolveEntities(this._config);
    if (config.map_filter === 'none') this._ui.holo = false;
    if (config.default_tab) this._ui.tab = config.default_tab;
    if (config.map_3d === false) this._ui.map3d = false;
    this._refs = [];
    this._schedule();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._e) return;
    const ids = [...Object.values(this._e), ...discoverSwitches(hass, this._config)];
    const prefix = `_${this._e.vacuum.split('.')[1]}_room_`;
    for (const id of Object.keys(hass.states)) if (id.includes(prefix)) ids.push(id);
    const refs = ids.map((id) => hass.states[id]);
    const changed = refs.length !== this._refs.length || refs.some((r, i) => r !== this._refs[i]);
    if (!changed) return;
    this._refs = refs;
    this._schedule();
  }

  getCardSize() { return 14; }
  getGridOptions() { return { columns: 'full', min_columns: 6 }; }

  connectedCallback() {
    this._clock = setInterval(() => this._schedule(), 30000);
  }
  disconnectedCallback() { clearInterval(this._clock); }

  _schedule() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = null; this._render(); });
  }

  _toast(msg) {
    this._toastMsg = msg;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { this._toastMsg = null; this._schedule(); }, 2600);
    this._schedule();
  }

  async _call(fn, okMsg) {
    try { await fn(); if (okMsg) this._toast(okMsg); } catch (err) { this._toast(`Błąd: ${err?.message || err}`); }
  }

  _render() {
    const hass = this._hass;
    if (!hass || !this._config) return;
    // nie przerywaj rozwiniętej listy <select>
    if (this.shadowRoot.activeElement?.tagName === 'SELECT') { setTimeout(() => this._schedule(), 1500); return; }

    const c = makeCtx(hass, this._config, this._e, this._ui);
    const visual = deriveRobotVisualState(c.vac);
    const canClean = Commands.canCleanSegments(hass);
    const tab = this._ui.tab;
    let body = '';
    const page = (inner) => `<div class="page">${renderNav(tab)}<div class="main">${renderErrorBanner(c)}${inner}</div></div>`;
    if (!c.vac) {
      body = page(`<section class="panel"><b>Nie znaleziono encji ${this._config.entity}</b></section>`);
    } else if (tab === 'map') {
      body = `${renderErrorBanner(c)}
        <div class="row1">${renderNav(tab)}${renderMap(c, this._mapDims)}${renderStation(c, visual)}</div>
        <div class="row2">${renderRobot(c, visual)}${renderModes(c)}</div>
        <div class="row3">${renderRooms(c, canClean)}${renderAdvanced(c)}${renderService(c)}${renderHistory(c, 4)}</div>`;
    } else if (tab === 'cleaning') {
      body = page(`<div class="row2">${renderRobot(c, visual)}${renderModes(c)}</div>
        <div class="row-wide" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)">${renderRooms(c, canClean)}${renderAdvanced(c)}</div>
        ${renderRoomDetails(c)}`);
    } else if (tab === 'station') {
      body = page(`${renderStation(c, visual, true)}${renderAdvanced(c, 'station')}`);
    } else if (tab === 'service') {
      body = page(renderService(c, true));
    } else if (tab === 'history') {
      body = page(renderHistory(c, 30));
    } else {
      body = page(renderSettings(c));
    }

    this.shadowRoot.innerHTML = `<style>${STYLES}</style>
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
        <filter id="mx-holo" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"/>
          <feColorMatrix type="hueRotate" values="180"/>
          <feColorMatrix type="saturate" values="2.8"/>
          <feComponentTransfer><feFuncR type="linear" slope="1.35"/><feFuncG type="linear" slope="1.35"/><feFuncB type="linear" slope="1.5"/></feComponentTransfer>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.6 1.6 1.6 0 -0.12"/>
        </filter></defs></svg>
      <ha-card class="root">
        ${renderTop(c, visual)}
        ${body}
        ${this._toastMsg ? `<div class="toast">${this._toastMsg.replace(/</g, '&lt;')}</div>` : ''}
      </ha-card>`;

    this._mountMap(c);
    this._bind();
  }

  // ----- mapa: stabilny <img> (bez migotania), pan/zoom -----
  _mountMap(c) {
    const slot = this.shadowRoot.querySelector('.img-slot');
    if (!slot) return;
    const url = c.cam?.attributes?.entity_picture;
    if (!this._mapImg) {
      this._mapImg = document.createElement('img');
      this._mapImg.alt = 'Mapa';
      this._mapImg.draggable = false;
    }
    this._mapImg.className = this._ui.holo ? 'holo' : '';
    if (url && url !== this._mapUrl) {
      this._mapUrl = url;
      const pre = new Image();
      pre.onload = () => {
        this._mapImg.src = url;
        const dims = { w: pre.naturalWidth, h: pre.naturalHeight };
        const changed = !this._mapDims || dims.w !== this._mapDims.w || dims.h !== this._mapDims.h;
        this._mapDims = dims;
        if (changed) { this._view.z = null; this._schedule(); }
      };
      pre.src = url;
    }
    slot.appendChild(this._mapImg);
    this._applyView();
  }

  _applyView() {
    const view = this.shadowRoot.querySelector('.map-view');
    const stage = this.shadowRoot.querySelector('.map-stage');
    if (!view || !stage || !this._mapDims) return;
    const { w, h } = this._mapDims;
    if (this._view.z === null) {
      const vw = view.clientWidth || 600, vh = view.clientHeight || 340;
      this._view = { x: 0, y: 0, z: Math.min(vw / w, vh / h) * (this._ui.map3d ? 1.25 : 0.95) };
    }
    const { x, y, z } = this._view;
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${z}) translate(${-w / 2}px, ${-h / 2}px)`;
  }

  _zoom(factor) {
    if (this._view.z === null) return;
    this._view.z = Math.max(0.05, Math.min(8, this._view.z * factor));
    this._applyView();
  }

  _bind() {
    if (this._bound) return;
    this._bound = true;
    const root = this.shadowRoot;
    let drag = null;

    root.addEventListener('pointerdown', (ev) => {
      const view = ev.target.closest?.('.map-view');
      if (!view || ev.button !== 0) return;
      drag = { sx: ev.clientX, sy: ev.clientY, x: this._view.x, y: this._view.y, moved: false, view };
    });
    root.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) { drag.moved = true; drag.view.classList.add('dragging'); drag.view.setPointerCapture?.(ev.pointerId); }
      this._view.x = drag.x + dx; this._view.y = drag.y + dy;
      this._applyView();
    });
    const end = () => {
      if (!drag) return;
      drag.view.classList.remove('dragging');
      this._dragMoved = drag.moved;
      drag = null;
      setTimeout(() => { this._dragMoved = false; }, 0);
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('wheel', (ev) => {
      if (!ev.target.closest?.('.map-view')) return;
      ev.preventDefault();
      this._zoom(ev.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });

    root.addEventListener('change', (ev) => {
      const el = ev.target;
      if (el.dataset?.act === 'select-change') {
        this._call(() => Commands.selectOption(this._hass, el.dataset.entity, el.value), 'Zapisano');
        el.blur();
      }
    });

    root.addEventListener('click', (ev) => {
      if (this._dragMoved) return;
      const el = ev.target.closest?.('[data-act]');
      if (!el || el.disabled || el.tagName === 'SELECT') return;
      const act = el.dataset.act;
      const hass = this._hass, vac = this._e.vacuum;
      switch (act) {
        case 'tab': this._ui.tab = el.dataset.tab; this._view.z = null; this._schedule(); break;
        case 'advtab': this._ui.advTab = el.dataset.tab; this._schedule(); break;
        case 'start': this._call(() => Commands.start(hass, vac), 'Start'); break;
        case 'pause': this._call(() => Commands.pause(hass, vac), 'Pauza'); break;
        case 'dock': this._call(() => Commands.dock(hass, vac), 'Powrót do bazy'); break;
        case 'room': {
          const id = Number(el.dataset.room);
          const s = this._ui.selected;
          if (s.has(id)) s.delete(id); else s.add(id);
          this._schedule(); break;
        }
        case 'all-rooms': {
          const c = makeCtx(hass, this._config, this._e, this._ui);
          getRooms(c.vac, c.cam).filter((r) => r.visible).forEach((r) => this._ui.selected.add(r.id));
          this._schedule(); break;
        }
        case 'clear-rooms': this._ui.selected.clear(); this._schedule(); break;
        case 'clean-rooms': {
          const seg = [...this._ui.selected];
          if (!seg.length) return;
          this._call(() => Commands.cleanSegments(hass, vac, seg), `Sprzątanie ${seg.length} pom.`);
          break;
        }
        case 'select': this._call(() => Commands.selectOption(hass, el.dataset.entity, el.dataset.option)); break;
        case 'toggle': this._call(() => Commands.toggle(hass, el.dataset.entity)); break;
        case 'press': {
          // akcje stacji i resety serwisowe zawsze z potwierdzeniem
          if (!window.confirm(`${el.dataset.label || 'Wykonać akcję'}?\n${el.dataset.entity}`)) return;
          this._call(() => Commands.press(hass, el.dataset.entity), 'Wysłano');
          break;
        }
        case 'map3d': this._ui.map3d = true; this._view.z = null; this._schedule(); break;
        case 'map2d': this._ui.map3d = false; this._view.z = null; this._schedule(); break;
        case 'labels': this._ui.labels = !this._ui.labels; this._schedule(); break;
        case 'roomsview': this._ui.roomsView = el.dataset.view; this._schedule(); break;
        case 'genius': {
          const on = el.dataset.on === '1';
          const so = hass.states[el.dataset.entity];
          const options = Array.isArray(so?.attributes?.options) ? so.attributes.options : [];
          const target = on ? 'off' : (options.find((o) => o !== 'off') || null);
          if (target) this._call(() => Commands.selectOption(hass, el.dataset.entity, target));
          break;
        }
        case 'holo': this._ui.holo = !this._ui.holo; this._schedule(); break;
        case 'zoom': this._zoom(Number(el.dataset.dir) > 0 ? 1.25 : 0.8); break;
        case 'fit': this._view.z = null; this._applyView(); break;
        default: break;
      }
    });
  }
}

if (!customElements.get('mieciu-x50-card')) {
  customElements.define('mieciu-x50-card', MieciuX50Card);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'mieciu-x50-card',
    name: 'Mieciu X50 Card',
    description: 'Holograficzna karta dla Dreame X50 Ultra (integracja Tasshack dreame-vacuum).',
    preview: false,
  });
  // eslint-disable-next-line no-console
  console.info(`%c MIECIU-X50-CARD %c v${VERSION} `, 'background:#1f7dff;color:#fff;font-weight:700', 'background:#050b17;color:#3fd8ff');
}

})();
