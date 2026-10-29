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
// Własna, autorska grafika stacji + robota (SVG). Bez zasobów DVC.
// Pozycja robota i efekty zależą od stanu wizualnego; zbiorniki pokazują
// WYŁĄCZNIE status z sensorów (bez litrów i procentów).



const ROBOT_POS = {
  docked: [300, 312], washing: [300, 312], drying: [300, 312], auto_empty: [300, 312],
  cleaning: [108, 330], returning: [168, 326], paused: [118, 330],
  error: [300, 312], unavailable: [300, 312], neutral: [300, 312],
};

function robotSvg(extraClass = '') {
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

function stationSvg(visual, tanks) {
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

function miniRobotSvg(visual) {
  return `<svg class="mini-robot v-${visual}" viewBox="-80 -40 160 70" aria-hidden="true">
    <ellipse cx="0" cy="18" rx="74" ry="14" class="mini-glow"/>
    <g class="robot-motion">${robotSvg()}</g></svg>`;
}

// ===== src/styles.js =====
const STYLES = `
:host {
  --mx-bg: #050b17; --mx-bg2: #081326; --mx-panel: rgba(10, 24, 46, .78);
  --mx-line: rgba(64, 170, 255, .28); --mx-line-strong: rgba(80, 200, 255, .65);
  --mx-cyan: #3fd8ff; --mx-blue: #1f7dff; --mx-text: #e6f3ff; --mx-dim: #7f9bbd;
  --mx-ok: #38e59b; --mx-warn: #ffb547; --mx-bad: #ff5a6e;
  --mx-r: 14px; --mx-glow: 0 0 0 1px var(--mx-line), 0 0 18px rgba(31,125,255,.18) inset;
  display: block; font-family: "Rajdhani", "Exo 2", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
* { box-sizing: border-box; }
.root {
  display: block; container-type: inline-size; color: var(--mx-text); border-radius: 18px; overflow: hidden;
  background: radial-gradient(1200px 500px at 20% -10%, rgba(31,125,255,.18), transparent 60%),
              radial-gradient(900px 500px at 110% 30%, rgba(63,216,255,.10), transparent 60%),
              linear-gradient(180deg, var(--mx-bg2), var(--mx-bg));
  padding: 12px; position: relative;
}
.root::before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.35;
  background-image: linear-gradient(rgba(63,216,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(63,216,255,.05) 1px, transparent 1px);
  background-size: 32px 32px; }
.panel { position: relative; background: var(--mx-panel); border-radius: var(--mx-r); box-shadow: var(--mx-glow); padding: 12px; min-width: 0; }
.panel::after { content:""; position:absolute; top:-1px; left:18px; width:60px; height:2px; background: var(--mx-cyan); border-radius:2px; box-shadow:0 0 10px var(--mx-cyan); }
.ptitle { font-size: 15px; font-weight: 600; letter-spacing: .4px; margin: 0 0 10px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
.dim { color: var(--mx-dim); } .ok { color: var(--mx-ok); } .warn { color: var(--mx-warn); } .bad { color: var(--mx-bad); }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; }
button:disabled { opacity: .35; cursor: not-allowed; }
ha-icon { --mdc-icon-size: 20px; }

/* nagłówek telemetrii */
.top { display:grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; margin-bottom: 12px; position:relative; }
.brand { display:flex; align-items:center; gap:10px; }
.brand svg { width: 86px; height: 40px; }
.brand h1 { margin:0; font-size: 28px; line-height: 1; letter-spacing: .5px; }
.brand small { color: var(--mx-cyan); font-size: 14px; }
.tele { display:flex; gap:8px; overflow-x:auto; scrollbar-width: none; }
.tele::-webkit-scrollbar { display:none; }
.chip { flex: 0 0 auto; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 12px; background: rgba(8,20,40,.8); box-shadow: var(--mx-glow); min-width: 110px; }
.chip ha-icon { color: var(--mx-cyan); }
.chip b { display:block; font-size: 17px; line-height:1.1; }
.chip span { font-size: 11.5px; color: var(--mx-dim); }
.clock { text-align: right; } .clock b { font-size: 30px; font-weight: 600; display:block; line-height:1; } .clock span { color: var(--mx-cyan); font-size: 13px; }

/* układ */
.layout { display:grid; grid-template-columns: 170px 1fr; gap: 12px; position:relative; }
.nav { display:flex; flex-direction:column; gap:8px; }
.nav button { display:flex; align-items:center; gap:10px; padding: 12px 12px; border-radius: 12px; background: rgba(8,20,40,.6); box-shadow: 0 0 0 1px var(--mx-line); text-align:left; font-size: 15px; }
.nav button.active { background: linear-gradient(90deg, rgba(31,125,255,.45), rgba(63,216,255,.12)); box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 16px rgba(63,216,255,.35); }
.nav button ha-icon { color: var(--mx-cyan); }
.main { display:grid; gap: 12px; min-width:0; }
.row-a { display:grid; grid-template-columns: 1.15fr 1fr; gap: 12px; }
.row-b { display:grid; grid-template-columns: 1.15fr 1fr; gap: 12px; }
.row-c { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }

/* mapa */
.map-wrap { display:grid; grid-template-columns: 44px 1fr; gap: 8px; height: 100%; }
.map-tools { display:flex; flex-direction:column; gap:8px; }
.tool { width:40px; height:40px; border-radius:10px; display:grid; place-items:center; box-shadow:0 0 0 1px var(--mx-line); background: rgba(8,20,40,.7); }
.tool.active { box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 12px rgba(63,216,255,.4); color: var(--mx-cyan); }
.map-view { position: relative; overflow: hidden; border-radius: 12px; min-height: 340px; background: radial-gradient(circle at 50% 50%, rgba(31,125,255,.12), transparent 70%); touch-action: none; cursor: grab; }
.map-view.dragging { cursor: grabbing; }
.map-stage { position:absolute; left:50%; top:50%; transform-origin: 0 0; transition: transform .25s ease; }
.map-view.dragging .map-stage { transition: none; }
.map-3d { transform-style: preserve-3d; transition: transform .5s ease; }
.map-3d.on { transform: perspective(1400px) rotateX(48deg) rotateZ(-28deg); }
.map-stage img { display:block; max-width:none; user-select:none; -webkit-user-drag:none; }
.map-stage img.holo { filter: invert(1) hue-rotate(180deg) saturate(1.6) brightness(1.05) drop-shadow(0 0 6px rgba(63,216,255,.55)); mix-blend-mode: screen; }
.map-overlay { position:absolute; inset:0; overflow: visible; }
.rm { cursor:pointer; }
.rm circle { fill: rgba(8,20,40,.75); stroke: var(--mx-line-strong); stroke-width: 2; }
.rm text { fill: #fff; font-size: 22px; font-weight: 600; paint-order: stroke; stroke: rgba(0,0,0,.6); stroke-width: 4px; }
.rm.sel circle { fill: rgba(31,125,255,.8); stroke: #fff; filter: drop-shadow(0 0 8px var(--mx-cyan)); }
.rm.cur circle { stroke: var(--mx-ok); }
.map-empty { position:absolute; inset:0; display:grid; place-items:center; color: var(--mx-dim); text-align:center; padding: 20px; }
.map-modes { display:flex; gap:8px; margin-top: 10px; flex-wrap: wrap; }
.pill { padding: 8px 14px; border-radius: 10px; box-shadow:0 0 0 1px var(--mx-line); background: rgba(8,20,40,.7); font-size: 13.5px; display:inline-flex; align-items:center; gap:6px; }
.pill.active { background: rgba(31,125,255,.45); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 12px rgba(63,216,255,.35); }
.compass { position:absolute; top:10px; right:10px; width:38px; height:38px; border-radius:50%; display:grid; place-items:center; box-shadow:0 0 0 1px var(--mx-line-strong); color: var(--mx-cyan); font-weight:700; background: rgba(8,20,40,.7); }

/* stacja */
.station-grid { display:grid; grid-template-columns: 1fr 168px; gap: 10px; align-items: start; }
.station-svg { width: 100%; height: auto; display:block; }
.proc { display:flex; flex-direction:column; gap: 8px; }
.proc-item { display:flex; align-items:center; gap:10px; padding: 7px 10px; border-radius: 10px; box-shadow: 0 0 0 1px var(--mx-line); background: rgba(8,20,40,.55); font-size: 13px; }
.proc-item ha-icon { color: var(--mx-cyan); --mdc-icon-size: 18px; }
.proc-item b { display:block; font-weight: 600; }
.proc-item.active { box-shadow: 0 0 0 1px var(--mx-ok), 0 0 10px rgba(56,229,155,.3); }
.station-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top: 10px; }

/* SVG stacji */
.grid-floor line { stroke: rgba(63,216,255,.12); stroke-width: 1; }
.ramp { fill: #0b1830; stroke: var(--mx-line-strong); stroke-width: 1.2; }
.ramp-line { stroke: var(--mx-cyan); stroke-width: 2; opacity:.6; filter: url(#mx-glow); }
.t-body { fill: url(#mx-body); stroke: rgba(120,190,255,.45); stroke-width: 1.4; }
.t-lid { fill: #22334f; stroke: rgba(120,190,255,.5); }
.t-glass { fill: url(#mx-glass); stroke: var(--mx-cyan); stroke-width: 1.4; filter: url(#mx-glow); }
.t-handle { stroke: rgba(200,235,255,.6); stroke-width: 3; stroke-linecap: round; }
.t-panel { fill: rgba(10,20,40,.9); stroke: rgba(120,190,255,.35); }
.t-bag { fill: rgba(200,220,240,.12); stroke: rgba(220,235,255,.5); stroke-dasharray: 3 3; }
.t-det { fill: rgba(63,216,255,.18); stroke: var(--mx-cyan); }
.t-brand { fill: rgba(200,230,255,.35); }
.t-mouth { fill: #050b17; stroke: rgba(63,216,255,.5); }
.t-led { fill: var(--mx-cyan); filter: url(#mx-glow); }
.robot .r-shadow { fill: rgba(0,0,0,.45); }
.robot .r-side { fill: #0d1626; stroke: rgba(120,190,255,.5); }
.robot .r-top { fill: #16233a; stroke: rgba(150,210,255,.7); stroke-width: 1.2; }
.robot .r-ring { fill: none; stroke: var(--mx-cyan); stroke-width: 1.6; filter: url(#mx-glow); }
.robot .r-lds { fill: #0b1220; stroke: rgba(150,210,255,.6); }
.robot .r-lds-cap { fill: #1c2b46; stroke: rgba(150,210,255,.6); }
.robot .r-eye { fill: var(--mx-cyan); filter: url(#mx-glow); }
.clean-path, .return-arrow { fill: none; stroke: var(--mx-cyan); stroke-width: 2; stroke-dasharray: 6 6; opacity: 0; }
.v-cleaning .clean-path { opacity: .8; animation: mx-dash 1.6s linear infinite; }
.v-paused .clean-path { opacity: .35; }
.v-returning .return-arrow { opacity: .9; animation: mx-dash 1s linear infinite; }
.v-cleaning .robot-motion { animation: mx-roam 6s ease-in-out infinite; }
.v-returning .robot-motion { animation: mx-return 2.4s ease-in-out infinite; }
.v-error .robot .r-ring, .v-unavailable .robot .r-ring { stroke: var(--mx-dim); filter:none; }
.v-error .robot .r-eye { fill: var(--mx-bad); }
.fx { opacity: 0; }
.v-washing .fx-wash, .v-drying .fx-dry, .v-auto_empty .fx-empty { opacity: 1; }
.drop { fill: var(--mx-cyan); animation: mx-drop 1.4s ease-in infinite; }
.d1{animation-delay:.25s}.d2{animation-delay:.5s}.d3{animation-delay:.75s}.d4{animation-delay:1s}
.wave { fill:none; stroke: var(--mx-warn); stroke-width: 2; stroke-linecap: round; animation: mx-rise 2.2s ease-in-out infinite; }
.w1{animation-delay:.6s}.w2{animation-delay:1.2s}
.dust { fill: #cfe8ff; animation: mx-suck 1.2s ease-in infinite; }
.p1{animation-delay:.2s}.p2{animation-delay:.4s}.p3{animation-delay:.6s}.p4{animation-delay:.8s}.p5{animation-delay:1s}
.co-line { fill:none; stroke: var(--mx-line-strong); stroke-width: 1.2; }
.co-dot { fill: var(--mx-cyan); filter: url(#mx-glow); }
.co-box { fill: rgba(8,20,40,.88); stroke: var(--mx-line-strong); }
.co-name { fill: var(--mx-text); font-size: 16px; font-weight: 600; }
.co-val { font-size: 15px; font-weight: 600; fill: var(--mx-dim); }
.s-installed .co-val { fill: var(--mx-ok); } .s-not_installed .co-val { fill: var(--mx-bad); } .s-attention .co-val { fill: var(--mx-warn); }
.s-not_installed .co-dot { fill: var(--mx-bad); } .s-attention .co-dot { fill: var(--mx-warn); }
.state-chip rect { fill: rgba(31,125,255,.35); stroke: var(--mx-line-strong); }
.state-chip text { fill: #fff; font-size: 14px; font-weight: 600; }
.v-paused .state-chip rect { fill: rgba(255,181,71,.3); stroke: var(--mx-warn); }
.v-error .state-chip rect { fill: rgba(255,90,110,.3); stroke: var(--mx-bad); }
@keyframes mx-dash { to { stroke-dashoffset: -24; } }
@keyframes mx-roam { 0%,100% { transform: translate(0,0); } 50% { transform: translate(34px,-6px); } }
@keyframes mx-return { 0% { transform: translate(-12px,4px); } 100% { transform: translate(18px,-4px); } }
@keyframes mx-drop { 0% { transform: translateY(-20px); opacity:0 } 30%{opacity:1} 100% { transform: translateY(14px); opacity:0 } }
@keyframes mx-rise { 0% { transform: translateY(0); opacity:0 } 40%{opacity:.9} 100% { transform: translateY(-46px); opacity:0 } }
@keyframes mx-suck { 0% { transform: translateY(0); opacity:0 } 20%{opacity:1} 100% { transform: translateY(-90px); opacity:0 } }

/* status robota + sterowanie */
.robot-card { display:grid; grid-template-columns: 170px 1fr; gap: 12px; align-items:center; }
.mini-robot { width: 100%; height: auto; }
.mini-glow { fill: rgba(31,125,255,.25); filter: blur(6px); }
.rs-name { font-size: 22px; font-weight: 700; } .rs-model { color: var(--mx-cyan); font-size: 13px; }
.rs-state { margin-top: 6px; display:flex; align-items:center; gap:8px; font-size: 14px; }
.bar { height: 6px; border-radius: 3px; background: rgba(63,216,255,.12); overflow:hidden; margin: 8px 0 4px; }
.bar > i { display:block; height:100%; background: linear-gradient(90deg, var(--mx-blue), var(--mx-cyan)); box-shadow: 0 0 10px var(--mx-cyan); }
.stats3 { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px; }
.stats3 b { font-size: 18px; display:block; } .stats3 span { font-size: 11.5px; color: var(--mx-dim); }
.ctrl-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
.big { padding: 14px 6px; border-radius: 12px; display:flex; flex-direction:column; align-items:center; gap: 6px; font-size: 16px; font-weight: 600; background: rgba(8,20,40,.7); box-shadow: 0 0 0 1px var(--mx-line); }
.big ha-icon { --mdc-icon-size: 30px; }
.big.primary { background: linear-gradient(180deg, #1f7dff, #0d4fc4); box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 22px rgba(31,125,255,.55); }
.opt-group { margin-bottom: 10px; } .opt-group h4 { margin: 0 0 6px; font-size: 13.5px; font-weight: 600; color: var(--mx-dim); }
.opts { display:grid; grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)); gap: 6px; }
.opt { padding: 9px 4px; border-radius: 10px; font-size: 12.5px; background: rgba(8,20,40,.7); box-shadow: 0 0 0 1px var(--mx-line); }
.opt.active { background: linear-gradient(180deg, rgba(31,125,255,.7), rgba(13,79,196,.7)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 12px rgba(63,216,255,.4); }

/* pokoje */
.rooms { display:grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.room { text-align:left; padding: 9px 10px; border-radius: 10px; background: rgba(8,20,40,.7); box-shadow:0 0 0 1px var(--mx-line); position: relative; min-height: 64px; }
.room ha-icon { color: var(--mx-cyan); --mdc-icon-size: 18px; }
.room b { display:block; font-size: 13px; font-weight: 600; margin-top: 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.room span { font-size: 11px; color: var(--mx-dim); }
.room.sel { background: linear-gradient(180deg, rgba(31,125,255,.55), rgba(13,79,196,.4)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 12px rgba(63,216,255,.35); }
.room.cur::after { content:""; position:absolute; top:8px; right:8px; width:8px; height:8px; border-radius:50%; background: var(--mx-ok); box-shadow:0 0 8px var(--mx-ok); }
.room-actions { display:flex; gap:6px; margin-top: 10px; flex-wrap: wrap; }

/* serwis */
.svc { display:grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.svc-item { text-align:center; padding: 8px 4px; border-radius: 10px; background: rgba(8,20,40,.55); box-shadow:0 0 0 1px var(--mx-line); font-size: 12px; }
.ring { width: 58px; height: 58px; display:block; margin: 0 auto 4px; }
.ring .bg { stroke: rgba(63,216,255,.12); } .ring .fg { stroke-linecap: round; transition: stroke-dashoffset .6s; }
.ring text { fill: var(--mx-text); font-size: 15px; font-weight: 700; }
.svc-item small { display:block; color: var(--mx-dim); }
.svc-item button { margin-top: 4px; font-size: 11px; color: var(--mx-cyan); text-decoration: underline; }

/* historia */
.hist { display:flex; flex-direction:column; gap: 8px; }
.h-item { display:grid; grid-template-columns: 64px 1fr auto; gap: 10px; align-items:center; padding: 6px; border-radius: 10px; background: rgba(8,20,40,.55); box-shadow:0 0 0 1px var(--mx-line); }
.h-thumb { width: 64px; height: 44px; border-radius: 6px; object-fit: cover; background: rgba(31,125,255,.15); filter: invert(1) hue-rotate(180deg) saturate(1.4); }
.h-item b { font-size: 13.5px; display:block; } .h-item span { font-size: 11.5px; color: var(--mx-dim); }
.h-ok { color: var(--mx-ok); } .h-bad { color: var(--mx-warn); }

/* ustawienia / przełączniki */
.sw-list { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; }
.sw { display:flex; justify-content:space-between; align-items:center; gap:8px; padding: 8px 10px; border-radius: 10px; background: rgba(8,20,40,.55); box-shadow:0 0 0 1px var(--mx-line); font-size: 13px; text-align:left; }
.tg { width: 36px; height: 20px; border-radius: 10px; background: rgba(127,155,189,.35); position: relative; flex: 0 0 auto; transition: background .2s; }
.tg::after { content:""; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#cfe2f7; transition: left .2s; }
.tg.on { background: var(--mx-blue); box-shadow: 0 0 10px rgba(63,216,255,.5); } .tg.on::after { left: 19px; background:#fff; }
.sel-row { display:flex; justify-content:space-between; align-items:center; gap:8px; padding: 6px 10px; border-radius: 10px; background: rgba(8,20,40,.55); box-shadow:0 0 0 1px var(--mx-line); font-size: 13px; }
.sel-row select { background: #0b1830; color: var(--mx-text); border: 1px solid var(--mx-line); border-radius: 8px; padding: 5px 8px; font: inherit; max-width: 55%; }
.subtabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom: 10px; }
.err-banner { padding: 10px 12px; border-radius: 10px; background: rgba(255,90,110,.15); box-shadow: 0 0 0 1px var(--mx-bad); color: #ffd5db; margin-bottom: 12px; display:flex; gap:8px; align-items:center; }
.toast { position:absolute; bottom: 14px; left: 50%; transform: translateX(-50%); background: rgba(8,20,40,.95); box-shadow: 0 0 0 1px var(--mx-line-strong); padding: 8px 14px; border-radius: 10px; font-size: 13px; z-index: 5; }

/* responsywność */
@container (max-width: 1250px) { .row-c { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@container (max-width: 1020px) {
  .row-a, .row-b { grid-template-columns: 1fr; }
  .layout { grid-template-columns: 1fr; }
  .nav { flex-direction:row; overflow-x:auto; scrollbar-width:none; }
  .nav button { flex: 0 0 auto; padding: 9px 12px; }
}
@container (max-width: 640px) {
  .top { grid-template-columns: 1fr auto; } .tele { grid-column: 1 / -1; order: 3; }
  .row-c { grid-template-columns: 1fr; }
  .station-grid { grid-template-columns: 1fr; }
  .robot-card { grid-template-columns: 1fr; } .mini-robot { max-width: 200px; margin: 0 auto; }
  .map-view { min-height: 280px; }
  .nav button span { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;

// ===== src/views/views.js =====
// Widoki karty — funkcje zwracające HTML. Zero logiki usług (to robi card).







const icon = (i) => `<ha-icon icon="${esc(i)}"></ha-icon>`;
const pct = (v) => Math.max(0, Math.min(100, toNum(v) ?? 0));

// ---------- helpery kontekstu ----------
function makeCtx(hass, config, e, ui) {
  const st = (k) => hass.states[e[k]];
  const fmt = (so) => {
    if (!so) return '—';
    if (isUnavail(so)) return PL.generic.unavailable;
    try { return hass.formatEntityState ? hass.formatEntityState(so) : so.state; } catch (_) { return so.state; }
  };
  return { hass, config, e, ui, st, fmt, vac: hass.states[e.vacuum], cam: hass.states[e.map] };
}

// ---------- nagłówek ----------
function renderTop(c, visual) {
  const a = c.vac?.attributes || {};
  const batt = toNum(c.st('battery')?.state ?? a.battery);
  const now = new Date();
  const chip = (ic, val, lab) => `<div class="chip">${icon(ic)}<div><b>${esc(val)}</b><span>${esc(lab)}</span></div></div>`;
  const charging = toBool(a.charging) || c.st('battery')?.attributes?.icon?.includes('charging');
  return `
  <div class="top">
    <div class="brand">${miniRobotSvg(visual)}<div><h1>${esc(c.config.name || 'Mieciu')}</h1><small>${esc(c.config.model || 'Dreame X50 Ultra')}</small></div></div>
    <div class="tele">
      ${chip(batt === null ? 'mdi:battery-unknown' : charging ? 'mdi:battery-charging' : 'mdi:battery', batt === null ? '—' : `${batt}%`, PL.generic.battery)}
      ${chip('mdi:home-variant', PL.visual[visual] || '—', PL.generic.state)}
      ${chip('mdi:map-outline', a.selected_map || '—', PL.generic.map)}
      ${chip('mdi:set-square', c.st('total_area') ? `${fmtNum(toNum(c.st('total_area').state))} m²` : '—', PL.generic.total)}
      ${chip('mdi:counter', c.st('cleaning_count') ? fmtNum(toNum(c.st('cleaning_count').state)) : '—', PL.generic.cycles)}
      ${chip('mdi:timer-outline', c.st('cleaning_time') ? fmtMinutes(c.st('cleaning_time').state) : '—', PL.generic.last)}
    </div>
    <div class="clock"><b>${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</b>
      <span>${now.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
  </div>`;
}

function renderErrorBanner(c) {
  const err = c.st('error');
  if (!err || isUnavail(err) || err.state === 'no_error') return '';
  const desc = err.attributes?.description || c.fmt(err);
  return `<div class="err-banner">${icon('mdi:alert-circle')}<span>${esc(desc)}</span></div>`;
}

const TABS = [
  ['map', 'mdi:map'], ['cleaning', 'mdi:robot-vacuum'], ['station', 'mdi:home-import-outline'],
  ['rooms', 'mdi:floor-plan'], ['service', 'mdi:tools'], ['history', 'mdi:history'], ['settings', 'mdi:cog-outline'],
];
function renderNav(tab) {
  return `<nav class="nav">${TABS.map(([k, ic]) =>
    `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${icon(ic)}<span>${PL.tabs[k]}</span></button>`).join('')}</nav>`;
}

// ---------- mapa ----------
function renderMap(c, dims) {
  const ui = c.ui;
  const rooms = getRooms(c.vac, c.cam);
  const T = buildTransform(c.cam?.attributes?.calibration_points);
  const cur = toNum(c.vac?.attributes?.current_segment);
  let overlay = '';
  if (dims && T) {
    const r = Math.max(dims.w, dims.h) / 42;
    overlay = `<svg class="map-overlay" viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}">
      ${rooms.filter((rm) => rm.x !== null && rm.visible).map((rm) => {
        const [px, py] = T(rm.x, rm.y);
        const cls = `rm${ui.selected.has(rm.id) ? ' sel' : ''}${rm.id === cur ? ' cur' : ''}`;
        return `<g class="${cls}" data-act="room" data-room="${rm.id}">
          <circle cx="${px}" cy="${py}" r="${r}"/><text x="${px}" y="${py + r * 0.35}" text-anchor="middle" style="font-size:${r}px">${ui.selected.has(rm.id) ? [...ui.selected].indexOf(rm.id) + 1 : rm.id}</text>
          <text x="${px}" y="${py + r * 2.1}" text-anchor="middle" style="font-size:${r * 0.8}px">${esc(rm.name || '')}</text></g>`;
      }).join('')}
    </svg>`;
  }
  const hasImg = !!c.cam?.attributes?.entity_picture && !isUnavail(c.cam);
  return `
  <section class="panel">
    <div class="map-wrap">
      <div class="map-tools">
        <button class="tool ${ui.map3d ? 'active' : ''}" data-act="map3d" title="2D / 3D">${icon('mdi:layers-triple-outline')}</button>
        <button class="tool" data-act="zoom" data-dir="1" title="Przybliż">${icon('mdi:magnify-plus-outline')}</button>
        <button class="tool" data-act="zoom" data-dir="-1" title="Oddal">${icon('mdi:magnify-minus-outline')}</button>
        <button class="tool" data-act="fit" title="Dopasuj">${icon('mdi:fit-to-screen-outline')}</button>
        <button class="tool ${ui.holo ? 'active' : ''}" data-act="holo" title="Filtr holograficzny">${icon('mdi:hologram')}</button>
      </div>
      <div>
        <div class="map-view">
          ${hasImg ? `<div class="map-stage"><div class="map-3d ${ui.map3d ? 'on' : ''}"><div class="img-slot"></div>${overlay}</div></div>`
            : `<div class="map-empty">${icon('mdi:map-marker-off-outline')}<br>${PL.generic.noMap}<br><small>${esc(c.e.map)}</small></div>`}
          <div class="compass">N</div>
        </div>
        <div class="map-modes">
          <button class="pill active">${icon('mdi:selection-marker')}Pokój</button>
          <button class="pill" disabled title="${PL.generic.soon}">${icon('mdi:vector-square')}Strefa</button>
          <button class="pill" disabled title="${PL.generic.soon}">${icon('mdi:map-marker-outline')}Punkt</button>
          <button class="pill" disabled title="${PL.generic.soon}">${icon('mdi:cancel')}Zakazana</button>
        </div>
      </div>
    </div>
  </section>`;
}

// ---------- stacja ----------
function renderStation(c, visual, big = false) {
  const tanks = {
    clean_water: tankStatus(c.st('clean_water_tank')),
    dirty_water: tankStatus(c.st('dirty_water_tank')),
    dust_bag: tankStatus(c.st('dust_bag')),
    detergent: tankStatus(c.st('detergent')),
  };
  const procKeys = ['self_wash_base_status', 'auto_empty_status', 'station_drainage_status', 'hot_water_status', 'low_water_warning', 'drying_left'];
  const procIcons = { self_wash_base_status: 'mdi:dishwasher', auto_empty_status: 'mdi:delete-empty', station_drainage_status: 'mdi:water-pump', hot_water_status: 'mdi:water-thermometer', low_water_warning: 'mdi:water-alert', drying_left: 'mdi:weather-sunny' };
  const procs = procKeys.filter((k) => c.st(k) && !isUnavail(c.st(k))).map((k) => {
    const so = c.st(k);
    const active = !['idle', 'no_warning', 'disabled', '0'].includes(String(so.state));
    const isWarn = k === 'low_water_warning' && so.state !== 'no_warning';
    return `<div class="proc-item ${active && k !== 'hot_water_status' && !isWarn ? 'active' : ''}">${icon(procIcons[k])}<div><span class="dim">${esc(PL.station[k])}</span><b class="${isWarn ? 'warn' : ''}">${esc(c.fmt(so))}</b></div></div>`;
  }).join('');
  const btns = [
    ['btn_auto_empty', 'mdi:delete-empty', 'Opróżnij'], ['btn_self_clean', 'mdi:dishwasher', 'Umyj mopy'],
    ['btn_manual_drying', 'mdi:weather-sunny', 'Susz'], ['btn_base_station_cleaning', 'mdi:car-wash', 'Czyść stację'],
    ['btn_empty_water_tank', 'mdi:waves-arrow-up', 'Opróżnij zbiornik'],
  ].filter(([k]) => c.st(k)).map(([k, ic, lab]) =>
    `<button class="pill" data-act="press" data-entity="${esc(c.e[k])}" data-label="${esc(lab)}" ${c.st(k).state === 'unavailable' ? 'disabled' : ''}>${icon(ic)}${lab}</button>`).join('');
  return `
  <section class="panel">
    <h3 class="ptitle"><span>${icon('mdi:home-import-outline')} Stacja dokująca</span><span class="${STATION_ACTIVE.has(visual) ? 'ok' : 'dim'}">${esc(PL.visual[visual])}</span></h3>
    <div class="station-grid" ${big ? 'style="grid-template-columns:1fr 240px"' : ''}>
      <div>${stationSvg(visual, tanks)}</div>
      <div class="proc">${procs || '<span class="dim">Brak danych procesów</span>'}</div>
    </div>
    <div class="station-actions">${btns}</div>
  </section>`;
}

// ---------- robot + sterowanie ----------
function renderRobot(c, visual) {
  const a = c.vac?.attributes || {};
  const prog = toNum(c.st('cleaning_progress')?.state ?? a.cleaning_progress);
  const room = c.st('current_room');
  const isRunning = visual === 'cleaning' || visual === 'returning';
  const dis = isUnavail(c.vac) ? 'disabled' : '';
  return `
  <section class="panel">
    <div class="robot-card">
      ${miniRobotSvg(visual)}
      <div>
        <div class="rs-name">${esc(c.config.name || 'Mieciu')}</div>
        <div class="rs-model">${esc(c.config.model || 'Dreame X50 Ultra')}</div>
        <div class="rs-state">${icon(visual === 'cleaning' ? 'mdi:broom' : visual === 'error' ? 'mdi:alert' : 'mdi:information-outline')}
          <span><b>${esc(PL.visual[visual])}</b> · <span class="dim">${esc(c.fmt(c.st('status')))}</span></span></div>
        ${room && !isUnavail(room) ? `<div class="dim" style="font-size:13px;margin-top:4px">${PL.generic.currentRoom}: <b style="color:var(--mx-text)">${esc(room.state)}</b></div>` : ''}
        ${prog !== null && visual === 'cleaning' ? `<div class="bar"><i style="width:${pct(prog)}%"></i></div><div class="dim" style="font-size:12px">${PL.generic.progress}: ${prog}%</div>` : ''}
        <div class="stats3">
          <div><b>${c.st('cleaned_area') && !isUnavail(c.st('cleaned_area')) ? `${fmtNum(toNum(c.st('cleaned_area').state))} m²` : '—'}</b><span>${PL.generic.area}</span></div>
          <div><b>${c.st('cleaning_time') && !isUnavail(c.st('cleaning_time')) ? fmtMinutes(c.st('cleaning_time').state) : '—'}</b><span>${PL.generic.time}</span></div>
          <div><b>${esc(c.fmt(c.st('task_status')))}</b><span>Zadanie</span></div>
        </div>
      </div>
    </div>
    <div class="ctrl-row">
      <button class="big primary" data-act="start" ${dis}>${icon('mdi:play')}${visual === 'paused' ? PL.generic.resume : PL.generic.start}</button>
      <button class="big" data-act="pause" ${dis || (!isRunning ? 'disabled' : '')}>${icon('mdi:pause')}${PL.generic.pause}</button>
      <button class="big" data-act="dock" ${dis}>${icon('mdi:home-import-outline')}${PL.generic.dock}</button>
    </div>
  </section>`;
}

function optButtons(c, key) {
  const so = c.st(key);
  if (!so) return '<span class="dim">brak encji</span>';
  const opts = Array.isArray(so.attributes?.options) ? so.attributes.options : (pyParse(so.attributes?.options) || []);
  const dis = isUnavail(so);
  if (dis) return `<span class="dim">${PL.generic.unavailable}</span>`;
  return `<div class="opts">${opts.map((o) =>
    `<button class="opt ${so.state === o ? 'active' : ''}" data-act="select" data-entity="${esc(so.entity_id)}" data-option="${esc(o)}">${esc(optLabel(o))}</button>`).join('')}</div>`;
}

function renderModes(c) {
  return `
  <section class="panel">
    <div class="opt-group"><h4>${PL.generic.cleaningMode}</h4>${optButtons(c, 'cleaning_mode')}</div>
    <div class="opt-group"><h4>${PL.generic.suction}</h4>${optButtons(c, 'suction_level')}</div>
    <div class="opt-group" style="margin-bottom:0"><h4>${PL.generic.humidity}</h4>${optButtons(c, 'mop_pad_humidity')}</div>
  </section>`;
}

// ---------- pokoje ----------
function renderRooms(c, canClean, detailed = false) {
  const rooms = getRooms(c.vac, c.cam);
  const cur = toNum(c.vac?.attributes?.current_segment);
  const sel = c.ui.selected;
  const tiles = rooms.map((r) => {
    const floor = c.hass.states[roomEntity(c.config, r.id, 'floor_material')];
    const extra = detailed && floor && !isUnavail(floor) ? ` · ${optLabel(floor.state)}` : '';
    return `<button class="room ${sel.has(r.id) ? 'sel' : ''} ${r.id === cur ? 'cur' : ''}" data-act="room" data-room="${r.id}">
      ${icon(r.icon || 'mdi:home-outline')}<b>${esc(r.name || `Pokój ${r.id}`)}</b><span>#${r.order ?? r.id}${extra}</span></button>`;
  }).join('');
  return `
  <section class="panel">
    <h3 class="ptitle"><span>${PL.generic.rooms} (${rooms.length})</span><span class="dim" style="font-size:12px">${sel.size ? `wybrano ${sel.size}` : ''}</span></h3>
    <div class="rooms">${tiles || '<span class="dim">Brak danych pokoi</span>'}</div>
    <div class="room-actions">
      <button class="pill active" data-act="clean-rooms" ${!sel.size || !canClean ? 'disabled' : ''} title="${canClean ? '' : 'Brak usługi dreame_vacuum.vacuum_clean_segment'}">${icon('mdi:play')}${PL.generic.cleanSelected}${sel.size ? ` (${sel.size})` : ''}</button>
      <button class="pill" data-act="all-rooms">${PL.generic.selectAll}</button>
      <button class="pill" data-act="clear-rooms" ${!sel.size ? 'disabled' : ''}>${PL.generic.clear}</button>
    </div>
  </section>`;
}

// ---------- ustawienia zaawansowane (wybrane encje) ----------
const ADV = {
  general: { label: 'Ogólne', selects: ['cleaning_route', 'carpet_cleaning'], switches: ['carpet_boost', 'customized_cleaning', 'mop_extend', 'side_reach', 'clean_carpets_first', 'mopping_under_furnitures'] },
  cleangenius: { label: 'CleanGenius', selects: ['cleangenius', 'cleangenius_mode', 'water_temperature'], switches: [] },
  ai: { label: 'AI i przeszkody', selects: [], switches: ['ai_obstacle_detection', 'ai_furniture_detection', 'ai_pet_detection', 'ai_fluid_detection', 'obstacle_avoidance', 'collision_avoidance'] },
  station: { label: 'Stacja', selects: ['washing_mode', 'drying_time', 'auto_empty_mode', 'self_clean_frequency'], switches: ['self_clean', 'auto_drying', 'smart_mop_washing', 'mop_washing_with_detergent', 'mopping_with_detergent', 'silent_drying'] },
};

function selectRow(c, entityId) {
  const so = c.hass.states[entityId];
  if (!so) return '';
  const name = shortName(so);
  if (isUnavail(so)) return `<div class="sel-row"><span>${esc(name)}</span><span class="dim">${PL.generic.unavailable}</span></div>`;
  const opts = Array.isArray(so.attributes?.options) ? so.attributes.options : (pyParse(so.attributes?.options) || []);
  return `<div class="sel-row"><span>${esc(name)}</span><select data-act="select-change" data-entity="${esc(entityId)}">
    ${opts.map((o) => `<option value="${esc(o)}" ${o === so.state ? 'selected' : ''}>${esc(optLabel(o))}</option>`).join('')}</select></div>`;
}

function switchRow(c, entityId) {
  const so = c.hass.states[entityId];
  if (!so || isUnavail(so)) return '';
  return `<button class="sw" data-act="toggle" data-entity="${esc(entityId)}"><span>${esc(shortName(so))}</span><i class="tg ${so.state === 'on' ? 'on' : ''}"></i></button>`;
}

function shortName(so) {
  const fn = so.attributes?.friendly_name || so.entity_id;
  const first = so.entity_id.split('.')[1].split('_')[0];
  const words = fn.split(/\s+/);
  return words.length > 1 && words[0].toLowerCase() === first.toLowerCase() ? words.slice(1).join(' ') : fn;
}

function renderAdvanced(c) {
  const p = c.e.vacuum.split('.')[1];
  const tab = ADV[c.ui.advTab] ? c.ui.advTab : 'general';
  const def = ADV[tab];
  const sel = def.selects.map((k) => selectRow(c, c.e[k] || `select.${p}_${k}`)).join('');
  const sw = def.switches.map((k) => switchRow(c, `switch.${p}_${k}`)).join('');
  return `
  <section class="panel">
    <h3 class="ptitle">Ustawienia zaawansowane</h3>
    <div class="subtabs">${Object.entries(ADV).map(([k, v]) => `<button class="pill ${k === tab ? 'active' : ''}" data-act="advtab" data-tab="${k}">${v.label}</button>`).join('')}</div>
    <div style="display:grid;gap:6px">${sel}${sw || ''}${!sel && !sw ? '<span class="dim">Brak dostępnych encji</span>' : ''}</div>
  </section>`;
}

// ---------- serwis ----------
function ring(v) {
  const n = toNum(v);
  const r = 24, C = 2 * Math.PI * r;
  const col = n === null ? 'var(--mx-dim)' : n > 50 ? 'var(--mx-ok)' : n > 20 ? 'var(--mx-warn)' : 'var(--mx-bad)';
  return `<svg class="ring" viewBox="0 0 58 58"><circle class="bg" cx="29" cy="29" r="${r}" fill="none" stroke-width="5"/>
    <circle class="fg" cx="29" cy="29" r="${r}" fill="none" stroke-width="5" stroke="${col}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (n ?? 0) / 100)}" transform="rotate(-90 29 29)"/>
    <text x="29" y="34" text-anchor="middle">${n === null ? '—' : n}</text></svg>`;
}

function renderService(c, withReset = false) {
  const maint = c.st('maintenance');
  const items = SERVICE_ITEMS.filter((k) => c.st(`svc_${k}_left`)).map((k) => {
    const left = c.st(`svc_${k}_left`), time = c.st(`svc_${k}_time`), rst = c.st(`svc_${k}_reset`);
    const unit = time?.attributes?.unit_of_measurement || '';
    return `<div class="svc-item">${ring(isUnavail(left) ? null : left.state)}${esc(PL.service[k])}
      <small>${time && !isUnavail(time) ? `${fmtNum(toNum(time.state))} ${esc(unit)}` : '—'}</small>
      ${withReset && rst && rst.state !== 'unavailable' ? `<button data-act="press" data-entity="${esc(rst.entity_id)}" data-label="Reset: ${esc(PL.service[k])}">reset</button>` : ''}</div>`;
  }).join('');
  return `
  <section class="panel">
    <h3 class="ptitle"><span>Serwis i konserwacja</span>${maint?.state === 'on' ? `<span class="warn" style="font-size:12px">${icon('mdi:wrench-clock')} wymaga uwagi</span>` : ''}</h3>
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

function renderHistory(c, limit = 4) {
  const items = parseHistory(c.st('history'), c.cam).slice(0, limit);
  return `
  <section class="panel">
    <h3 class="ptitle"><span>Historia sprzątania</span>${limit < 10 ? `<button class="dim" style="font-size:12px" data-act="tab" data-tab="history">Zobacz wszystkie</button>` : ''}</h3>
    <div class="hist">${items.map((h) => `
      <div class="h-item">${h.pic ? `<img class="h-thumb" loading="lazy" src="${esc(h.pic)}" alt="">` : '<div class="h-thumb"></div>'}
        <div><b>${esc(PL.history[h.status] || h.status || 'Sprzątanie')}</b><span>${esc(h.area || '—')} · ${esc(h.time || '—')}</span></div>
        <div style="text-align:right"><span class="dim" style="font-size:11.5px">${h.date ? h.date.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : esc(h.key)}</span><br>
          ${h.completed ? `<span class="h-ok">${icon('mdi:check-circle')}</span>` : `<span class="h-bad" title="Przerwane">${icon('mdi:alert-circle-outline')}</span>`}</div>
      </div>`).join('') || '<span class="dim">Brak historii</span>'}</div>
  </section>`;
}

// ---------- ustawienia (wszystkie przełączniki) ----------
function renderSettings(c) {
  const ids = discoverSwitches(c.hass, c.config);
  return `
  <section class="panel">
    <h3 class="ptitle">Ustawienia urządzenia <span class="dim" style="font-size:12px">niedostępne ukryte</span></h3>
    <div class="sw-list">${ids.map((id) => switchRow(c, id)).join('')}</div>
  </section>`;
}

function renderRoomDetails(c) {
  const rooms = getRooms(c.vac, c.cam);
  const keys = ['order', 'floor_material', 'floor_material_direction', 'cleaning_mode', 'suction_level', 'mop_pad_humidity', 'cleaning_times', 'cleaning_route', 'visibility'];
  const labels = { order: 'Kolejność', floor_material: 'Podłoga', floor_material_direction: 'Kierunek', cleaning_mode: 'Tryb', suction_level: 'Ssanie', mop_pad_humidity: 'Mop', cleaning_times: 'Przejazdy', cleaning_route: 'Trasa', visibility: 'Widoczność' };
  const rows = rooms.map((r) => {
    const cells = keys.map((k) => {
      const so = c.hass.states[roomEntity(c.config, r.id, k)];
      return `<td>${so && !isUnavail(so) ? esc(optLabel(so.state)) : '<span class="dim">—</span>'}</td>`;
    }).join('');
    return `<tr><td><b>${esc(r.name || r.id)}</b> <span class="dim">#${r.id}</span></td>${cells}</tr>`;
  }).join('');
  return `
  <section class="panel" style="overflow-x:auto">
    <h3 class="ptitle">Ustawienia per pokój <span class="dim" style="font-size:12px">tylko odczyt w v0.1.0 · „—” = niedostępne (np. przy wyłączonym Sprzątaniu niestandardowym)</span></h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr><th style="text-align:left">Pokój</th>${keys.map((k) => `<th style="text-align:left;padding:6px">${labels[k]}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table>
  </section>`;
}

// ===== src/mieciu-x50-card.js =====






const VERSION = '0.1.0';

class MieciuX50Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._ui = { tab: 'map', advTab: 'general', selected: new Set(), map3d: false, holo: true };
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
    if (!c.vac) {
      body = `<section class="panel"><b>Nie znaleziono encji ${this._config.entity}</b></section>`;
    } else if (tab === 'map') {
      body = `
        <div class="row-a">${renderMap(c, this._mapDims)}${renderStation(c, visual)}</div>
        <div class="row-b">${renderRobot(c, visual)}${renderModes(c)}</div>
        <div class="row-c">${renderRooms(c, canClean)}${renderAdvanced(c)}${renderService(c)}${renderHistory(c, 4)}</div>`;
    } else if (tab === 'cleaning') {
      body = `<div class="row-b">${renderRobot(c, visual)}${renderModes(c)}</div>
        <div class="row-b">${renderRooms(c, canClean)}${renderAdvanced(c)}</div>`;
    } else if (tab === 'station') {
      body = `${renderStation(c, visual, true)}<div class="row-b">${(() => { const s = this._ui.advTab; this._ui.advTab = 'station'; const h = renderAdvanced(c); this._ui.advTab = s; return h; })()}${renderRobot(c, visual)}</div>`;
    } else if (tab === 'rooms') {
      body = `<div class="row-a">${renderMap(c, this._mapDims)}${renderRooms(c, canClean, true)}</div>${renderRoomDetails(c)}`;
    } else if (tab === 'service') {
      body = renderService(c, true);
    } else if (tab === 'history') {
      body = renderHistory(c, 30);
    } else if (tab === 'settings') {
      body = renderSettings(c);
    }

    this.shadowRoot.innerHTML = `<style>${STYLES}</style>
      <ha-card class="root">
        ${renderTop(c, visual)}
        <div class="layout">${renderNav(tab)}<div class="main">${renderErrorBanner(c)}${body}</div></div>
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
      this._view = { x: 0, y: 0, z: Math.min(vw / w, vh / h) * 0.95 };
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
        case 'map3d': this._ui.map3d = !this._ui.map3d; this._schedule(); break;
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
