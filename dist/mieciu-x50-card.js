/*! Mieciu X50 Card v1.1.0 | MIT | https://github.com/voltronicpl/mieciu-x50-card — autorska karta Lovelace */
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
        x0: toNum(r.x0), y0: toNum(r.y0), x1: toNum(r.x1), y1: toNum(r.y1),
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

// ===== src/adapter/map-render.js =====
// Neonowy render mapy z obrazu kamery integracji.
// Pokoje wyznaczane flood-fill'em od środka pokoju (x,y z atrybutu `rooms`),
// więc kształty są prawdziwe. Powierzchnia = liczba pikseli × skala z kalibracji
// (to szacunek z mapy, oznaczany w UI jako „~”).

const NEON = ['#ff9f3f', '#2f8cff', '#b35cff', '#2fd67b', '#ff5fa8', '#26d4ff'];

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function renderNeonMap(img, rooms, T) {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return null;
  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sctx = src.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(img, 0, 0);
  let data;
  try { data = sctx.getImageData(0, 0, w, h).data; } catch (_) { return null; } // obraz z innej domeny

  const N = w * h;
  const owner = new Int16Array(N).fill(-1);
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
  const near = (a, b, tol) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= tol;
  const bg = px(0);

  // 1) co jest tłem, a co zmapowanym obszarem (podłoga, ściany, napisy, trasa…)
  const isContent = (k) => { const c = px(k); return c[3] >= 20 && !near(c, bg, 14); };

  // 2) prostokąty pokoi z integracji (mm) -> piksele obrazu
  const boxes = rooms.map((r) => {
    if ([r.x0, r.y0, r.x1, r.y1].some((v) => v === null || v === undefined)) return null;
    const pts = [T(r.x0, r.y0), T(r.x1, r.y0), T(r.x0, r.y1), T(r.x1, r.y1)];
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const [cx, cy] = r.x !== null && r.y !== null ? T(r.x, r.y) : [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), cx, cy };
  });

  // 3) przypisanie „rozrostem”: start z pikseli należących tylko do jednego prostokąta,
  //    potem BFS przez zmapowany obszar (ciemne ściany blokują), ograniczony do
  //    własnego prostokąta (+ mały margines). Sporne strefy dzieli odległość po podłodze.
  //    Kolory i napisy integracji są ignorowane — liczy się tylko geometria.
  const [ax0, ay0] = T(0, 0), [ax1, ay1] = T(1000, 0);
  const ppm = Math.hypot(ax1 - ax0, ay1 - ay0) || 80;
  const mg = ppm * 0.12;
  const inBox = (b, x, y) => b && x >= b.x0 - mg && x <= b.x1 + mg && y >= b.y0 - mg && y <= b.y1 + mg;
  const isWall = (k) => { const c = px(k); return (c[0] + c[1] + c[2]) / 3 < 100; };
  const q = new Int32Array(N);
  let qh = 0, qt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      if (!isContent(k) || isWall(k)) continue;
      let hit = -1, cnt = 0;
      for (let r = 0; r < boxes.length; r++) {
        const b = boxes[r];
        if (b && x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) { hit = r; cnt++; if (cnt > 1) break; }
      }
      if (cnt === 1) { owner[k] = hit; q[qt++] = k; }
    }
  }
  while (qh < qt) {
    const k = q[qh++];
    const o = owner[k];
    const x = k % w, y = (k - x) / w;
    const nb = [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1];
    for (const n of nb) {
      if (n < 0 || owner[n] !== -1 || !isContent(n) || isWall(n)) continue;
      const nx = n % w, ny = (n - nx) / w;
      if (!inBox(boxes[o], nx, ny)) continue;
      owner[n] = o; q[qt++] = n;
    }
  }
  // 4) piksele tuż poza prostokątami (ściany, progi) -> sąsiedni pokój, kilka przebiegów
  for (let pass = 0; pass < 6; pass++) {
    const add = [];
    for (let k = 0; k < N; k++) {
      if (owner[k] !== -1 || !isContent(k)) continue;
      const x = k % w;
      const o = [x > 0 ? owner[k - 1] : -1, x < w - 1 ? owner[k + 1] : -1, k >= w ? owner[k - w] : -1, k < N - w ? owner[k + w] : -1].find((v) => v >= 0);
      if (o !== undefined) add.push(k, o);
    }
    for (let j2 = 0; j2 < add.length; j2 += 2) owner[add[j2]] = add[j2 + 1];
  }

  // skala: piksele na metr
  const [ax, ay] = T(0, 0), [bx, by] = T(1000, 0);
  const pxPerM = Math.hypot(bx - ax, by - ay);
  const areas = new Map();

  const out = sctx.createImageData(w, h);
  const o = out.data;
  const colors = rooms.map((r) => hexToRgb(NEON[((r.color ?? r.id) % NEON.length + NEON.length) % NEON.length]));
  const grid = Math.max(4, Math.round(pxPerM / 4)); // kratka co 25 cm
  let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
  // odległość od krawędzi pokoju (chamfer, max G px) -> wewnętrzna poświata
  const G = Math.max(6, Math.round(pxPerM * 0.35));
  const dist = new Uint8Array(N).fill(255);
  for (let k = 0; k < N; k++) {
    const own = owner[k];
    if (own < 0) { dist[k] = 0; continue; }
    const x = k % w;
    if ((x > 0 && owner[k - 1] !== own) || (x < w - 1 && owner[k + 1] !== own) || (k >= w && owner[k - w] !== own) || (k < N - w && owner[k + w] !== own)) dist[k] = 1;
  }
  for (let k = 0; k < N; k++) { const x = k % w; let d = dist[k]; if (x > 0) d = Math.min(d, dist[k - 1] + 1); if (k >= w) d = Math.min(d, dist[k - w] + 1); dist[k] = d; }
  for (let k = N - 1; k >= 0; k--) { const x = k % w; let d = dist[k]; if (x < w - 1) d = Math.min(d, dist[k + 1] + 1); if (k < N - w) d = Math.min(d, dist[k + w] + 1); dist[k] = d; }

  for (let k = 0; k < N; k++) {
    const own = owner[k];
    const x = k % w, y = (k - x) / w;
    if (own >= 0) {
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      areas.set(own, (areas.get(own) || 0) + 1);
      const [r, g, b] = colors[own];
      const d = dist[k];
      const onGrid = x % grid === 0 || y % grid === 0;
      const scan = y % 3 === 0;
      let a, m, wht;
      if (d <= 2) { a = 255; m = 1.25; wht = d === 1 ? 140 : 70; }          // świecąca krawędź
      else if (d <= G) { const t = 1 - (d - 2) / (G - 2); a = 70 + 150 * t * t; m = 1 + 0.35 * t; wht = 30 * t; } // poświata do środka
      else { a = 105; m = 0.95; wht = 0; }                                       // przezroczyste wnętrze
      if (onGrid && d > 2) { a = Math.max(a, 165); m += 0.2; wht += 25; }
      if (scan && d > 2) a *= 0.72;                                             // linie skanowania
      o[k * 4] = Math.min(255, r * m + wht); o[k * 4 + 1] = Math.min(255, g * m + wht); o[k * 4 + 2] = Math.min(255, b * m + wht); o[k * 4 + 3] = a;
      continue;
    }
    {
      const c = px(k);
      if (c[3] < 20 || near(c, bg, 12)) continue;
      const lum = (c[0] + c[1] + c[2]) / 3;
      if (lum < 140) { // ściany / przeszkody -> biało‑cyjanowy neon
        o[k * 4] = 190; o[k * 4 + 1] = 245; o[k * 4 + 2] = 255; o[k * 4 + 3] = 255;
      } else { // pozostałe znane obszary (korytarze bez segmentu itp.)
        o[k * 4] = 40; o[k * 4 + 1] = 120; o[k * 4 + 2] = 255; o[k * 4 + 3] = 60;
      }
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').putImageData(out, 0, 0);
  const areaM2 = new Map();
  for (const [idx, cnt] of areas) areaM2.set(rooms[idx].id, cnt / (pxPerM * pxPerM));
  const bbox = bx1 > bx0 ? { x0: bx0, y0: by0, x1: bx1, y1: by1 } : null;
  return { canvas, areas: areaM2, pxPerM, bbox };
}

// ===== src/graphics/assets.js =====
// Grafiki wycięte z zatwierdzonego mockupu użytkownika (WebP, base64).
// Można je podmienić opcjami robot_image / station_image albo wyłączyć: graphics: svg
const ASSETS = {
  station: 'data:image/webp;base64,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',
  robot: 'data:image/webp;base64,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',
  tank_clean: 'data:image/webp;base64,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',
  tank_dirty: 'data:image/webp;base64,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',
  tank_bag: 'data:image/webp;base64,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',
  tank_det: 'data:image/webp;base64,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',
  robot_top: 'data:image/webp;base64,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',
};

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

// ===== src/graphics/parts.js =====
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

function partSvg(key) {
  const f = PARTS_RAW[key];
  if (!f) return '';
  curKey = `mxp-${key}`;
  return f();
}

// ===== src/styles.js =====
const STYLES = `
:host {
  --mx-bg: #030814; --mx-bg2: #06112a; --mx-panel: rgba(7, 18, 40, .82); --mx-panel2: rgba(10, 26, 56, .72);
  --mx-line: rgba(64, 170, 255, .42); --mx-line-strong: rgba(90, 205, 255, .85);
  --mx-cyan: #3fd8ff; --mx-blue: #1f7dff; --mx-text: #eaf4ff; --mx-dim: #8aa3c4;
  --mx-ok: #38e59b; --mx-warn: #ffb547; --mx-bad: #ff5a6e;
  display: block; font-family: "Saira Semi Condensed", "Rajdhani", "Roboto Condensed", "Arial Narrow", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
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
  background:
    linear-gradient(90deg, transparent 22px, rgba(130,225,255,.95) 22px, rgba(130,225,255,.95) 90px, transparent 90px) top / 100% 2px no-repeat,
    linear-gradient(90deg, transparent calc(100% - 140px), rgba(80,190,255,.55) calc(100% - 140px), rgba(80,190,255,.55) calc(100% - 26px), transparent calc(100% - 26px)) bottom / 100% 2px no-repeat,
    linear-gradient(180deg, var(--mx-panel2), var(--mx-panel));
  box-shadow: 0 0 0 1px rgba(80,190,255,.55), 0 0 12px rgba(31,140,255,.35), 0 0 26px rgba(31,125,255,.16) inset;
}
.panel::before, .panel::after { content:""; position:absolute; width:24px; height:24px; pointer-events:none; border-color: var(--mx-cyan); border-style: solid; opacity:.9; filter: drop-shadow(0 0 4px var(--mx-cyan)); }
.panel::before { top:-1px; left:-1px; border-width: 2.5px 0 0 2.5px; border-top-left-radius: 12px; }
.panel::after { bottom:-1px; right:-1px; border-width: 0 2.5px 2.5px 0; border-bottom-right-radius: 12px; }
.ptitle { font-size: 15px; font-weight: 600; letter-spacing: .3px; margin: 0 0 10px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
h4 { margin: 0 0 6px; font-size: 14px; font-weight: 600; }
.dim { color: var(--mx-dim); } .small { font-size: 12px; font-weight: 500; } .ok { color: var(--mx-ok); } .warn { color: var(--mx-warn); } .bad { color: var(--mx-bad); }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
button:disabled { opacity: .38; cursor: not-allowed; }
ha-icon { --mdc-icon-size: 20px; display: inline-flex; width: var(--mdc-icon-size); height: var(--mdc-icon-size); flex: 0 0 auto; }
.link { color: var(--mx-cyan); font-size: 12.5px; }

/* ===== nagłówek ===== */
.top { display:grid; grid-template-columns: 270px 1fr auto; gap: 12px; align-items: center; margin-bottom: 8px; padding: 4px 12px; border-radius: 14px;
  background: linear-gradient(90deg, rgba(10,26,56,.85), rgba(6,16,36,.6)); box-shadow: 0 0 0 1px var(--mx-line), 0 0 20px rgba(31,125,255,.15) inset; position: relative; }
.brand { display:flex; align-items:center; gap:10px; }
.brand .hero-robot, .brand .hero-img { width: 120px; height: 56px; object-fit: contain; }
.brand h1 { margin:0; font-size: 32px; line-height: .95; font-weight: 700; letter-spacing: .4px; }
.brand small { color: var(--mx-cyan); font-size: 16px; white-space: nowrap; }
.tele { display:flex; gap:8px; overflow-x:auto; scrollbar-width: none; }
.tele::-webkit-scrollbar { display:none; }
.chip { flex: 1 1 auto; min-width: 112px; display:flex; align-items:center; gap:10px; padding: 7px 12px; border-radius: 12px; background: rgba(6,16,36,.85); box-shadow: 0 0 0 1px var(--mx-line), 0 0 14px rgba(31,125,255,.12) inset; }
.chip-ic { width: 36px; height: 36px; display:grid; place-items:center; color: var(--mx-cyan); }
.chip-ic ha-icon { --mdc-icon-size: 30px; filter: drop-shadow(0 0 6px rgba(63,216,255,.7)); }
.chip.c-batt .chip-ic { color: var(--mx-ok); } .chip.c-batt .chip-ic ha-icon { filter: drop-shadow(0 0 6px rgba(56,229,155,.8)); }
.chip b { display:block; font-size: 16px; line-height:1.1; font-weight: 600; white-space: nowrap; }
.chip span { font-size: 11px; color: var(--mx-dim); white-space: nowrap; }
.clock { text-align: right; display:flex; flex-direction:column; gap: 4px; }
.clock-row { display:flex; align-items:center; justify-content:flex-end; gap: 10px; }
.clock b { font-size: 30px; font-weight: 600; line-height:1; }
.clock span { color: var(--mx-cyan); font-size: 16px; }
.wifi { color: var(--mx-ok); --mdc-icon-size: 26px; filter: drop-shadow(0 0 6px rgba(56,229,155,.7)); }
.hbtn { color: var(--mx-cyan); display:inline-flex; } .hbtn.on { color: var(--mx-warn); }

/* ===== siatka ===== */
.row1 { display:grid; grid-template-columns: 150px minmax(0,1.05fr) minmax(0,1fr); gap: 8px; margin-bottom: 8px; }
.row2 { display:grid; grid-template-columns: minmax(0,1.55fr) minmax(0,1fr); gap: 8px; margin-bottom: 8px; }
.row3 { display:grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1.35fr) minmax(0,1fr) minmax(0,1fr); gap: 8px; }
.row-wide { display:grid; gap: 10px; }
.page { display:grid; grid-template-columns: 150px minmax(0,1fr); gap: 10px; }
.page .main { display:grid; gap: 10px; min-width: 0; }

/* ===== nawigacja ===== */
.nav { display:flex; flex-direction:column; gap:10px; padding: 10px 8px; }
.nav button { display:flex; align-items:center; gap:12px; padding: 12px 12px; border-radius: 10px; text-align:left; font-size: 14.5px; font-weight: 500; }
.nav button ha-icon { color: #bfe6ff; --mdc-icon-size: 24px; }
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
.map-view { position: relative; overflow: hidden; border-radius: 10px; flex: 1; min-height: 330px; touch-action: none; cursor: grab;
  background: radial-gradient(circle at 50% 55%, rgba(31,125,255,.18), transparent 70%),
              repeating-linear-gradient(90deg, rgba(63,216,255,.05) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, rgba(63,216,255,.05) 0 1px, transparent 1px 22px); }
.map-view.dragging { cursor: grabbing; }
.map-stage { position:absolute; left:50%; top:50%; transform-origin: 0 0; }
.map-view.dragging .map-stage { transition: none; }
.map-3d { transform-style: preserve-3d; position: relative; }
.map-3d { transform-origin: 50% 50%; }

.img-slot { position: relative; transform-style: preserve-3d; }
.map-stage canvas.neon { display:block; position: relative; filter: brightness(1.15) saturate(1.3) drop-shadow(0 0 2px rgba(160,235,255,.95)) drop-shadow(0 0 14px rgba(31,140,255,.7)); }
.map-3d.on canvas.neon { filter: brightness(1.15) saturate(1.3) drop-shadow(0 0 2px rgba(160,235,255,.95)) drop-shadow(0 0 14px rgba(31,140,255,.7)); }
.neon-layer { position:absolute; left:0; top:0; pointer-events:none; display:none; opacity: .55; }
.map-3d.on .neon-layer { display:block; }
.map-3d::before { content:""; position:absolute; inset: -12%; border-radius: 50%; pointer-events:none;
  background: radial-gradient(closest-side, rgba(31,140,255,.32), rgba(31,125,255,.10) 60%, transparent 75%),
              repeating-linear-gradient(0deg, rgba(63,216,255,.16) 0 2px, transparent 2px 46px), repeating-linear-gradient(90deg, rgba(63,216,255,.16) 0 2px, transparent 2px 46px);
  -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent 100%); mask-image: radial-gradient(closest-side, #000 55%, transparent 100%); transform: translateZ(-30px); }
.holo-scan { position:absolute; inset:0; pointer-events:none; mix-blend-mode: screen;
  overflow: hidden;
  -webkit-mask-image: var(--mask); mask-image: var(--mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.map-view::after { content:""; position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(0deg, rgba(160,230,255,.05) 0 1px, transparent 1px 3px), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(2,6,16,.55) 100%); }
@keyframes mx-holo { 0%,100% { opacity: 1; } 47% { opacity: 1; } 48% { opacity: .86; } 49% { opacity: 1; } 72% { opacity: .94; } }
.holo-scan i { position:absolute; left:0; right:0; top:0; height: 18%; background: linear-gradient(180deg, transparent, rgba(140,235,255,.45), transparent); will-change: transform; animation: mx-scan 5s linear infinite; }
@keyframes mx-scan { from { transform: translateY(-120%); } to { transform: translateY(620%); } }
.furn { fill: rgba(200,230,255,.10); stroke: rgba(220,240,255,.75); stroke-width: 3; }
.map-robot .mr-glow { fill: rgba(63,216,255,.25); stroke: var(--mx-cyan); stroke-width: 3; filter: drop-shadow(0 0 10px var(--mx-cyan)); }
.map-robot .mr-body { fill: #16233a; stroke: var(--mx-cyan); stroke-width: 3; }
.map-charger { fill: rgba(56,229,155,.35); stroke: var(--mx-ok); stroke-width: 3; }
.anc { fill: transparent; }
.map-labels { position:absolute; inset:0; pointer-events:none; }
.mlabel { position:absolute; visibility:hidden; transform: translate(-50%,-50%); pointer-events:auto; display:flex; flex-direction:column; align-items:center; gap:0; padding: 2px 7px 3px; border-radius: 8px; background: rgba(3,10,24,.5); box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc) 60%, transparent), 0 0 10px color-mix(in srgb, var(--rc) 35%, transparent); text-shadow: 0 0 4px rgba(0,0,0,.95); }
.mlabel ha-icon { --mdc-icon-size: 17px; color: #fff; filter: drop-shadow(0 0 4px var(--rc)); }
.mlabel b { font-size: 12.5px; font-weight: 700; white-space: nowrap; color: #fff; } .mlabel span { font-size: 11px; font-weight: 600; color: #e8f3ff; }
.mlabel.sel { background: var(--rc); box-shadow: 0 0 14px var(--rc); color: #04101f; text-shadow: none; } .mlabel.sel span { color: #04101f; } .mlabel.sel ha-icon { color: #04101f; }
.mlabel.cur { box-shadow: 0 0 0 1px var(--mx-ok); }
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
.station-panel { display:grid; grid-template-columns: minmax(0,1.22fr) minmax(0,1fr); gap: 10px; }
.st-head { display:flex; align-items:center; gap: 12px; margin-bottom: 4px; }
.st-ic { width: 46px; height: 46px; border-radius: 10px; display:grid; place-items:center; color: var(--mx-ok); background: rgba(56,229,155,.12); box-shadow: 0 0 0 1px rgba(56,229,155,.55), 0 0 14px rgba(56,229,155,.35); }
.st-ic ha-icon { --mdc-icon-size: 28px; }
.st-head h3 { margin: 0; font-size: 20px; font-weight: 600; line-height: 1.1; } .st-head small { color: var(--mx-cyan); font-size: 15px; }
.st-body { display:grid; grid-template-columns: minmax(0,1fr) 120px; gap: 6px; align-items: center; }
.st-art { min-width: 0; margin-left: -12px; }
.station-svg, .station-img { width: 100%; height: auto; display:block; }
.st-photo { position: relative; }
.st-photo img { width: 100%; height: auto; display:block; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%); }
.st-photo.v-cleaning img, .st-photo.v-returning img, .st-photo.v-paused img {
  -webkit-mask-image: radial-gradient(ellipse 30% 15% at 26% 80%, transparent 55%, #000 100%); mask-image: radial-gradient(ellipse 30% 15% at 26% 80%, transparent 55%, #000 100%); }
.st-photo.v-error img, .st-photo.v-unavailable img { filter: grayscale(.8) brightness(.7); }
.st-badge { position:absolute; left: 50%; bottom: 2%; transform: translateX(-50%); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 10px; background: rgba(31,125,255,.35); box-shadow: 0 0 0 1px var(--mx-line-strong); white-space: nowrap; }
.st-photo.v-docked .st-badge, .st-photo.v-neutral .st-badge { display: none; }
.st-photo.v-paused .st-badge { background: rgba(255,181,71,.3); box-shadow: 0 0 0 1px var(--mx-warn); }
.st-photo.v-error .st-badge { background: rgba(255,90,110,.3); box-shadow: 0 0 0 1px var(--mx-bad); }
.fx-ph { position:absolute; pointer-events:none; opacity:0; border-radius: 50%; }
.fx-ph.fx-wash { left: 10%; right: 30%; bottom: 8%; height: 18%; background: radial-gradient(closest-side, rgba(63,216,255,.75), transparent); }
.fx-ph.fx-dry { left: 10%; right: 30%; bottom: 10%; height: 22%; background: radial-gradient(closest-side, rgba(255,181,71,.55), transparent); }
.fx-ph.fx-empty { left: 30%; width: 30%; top: 30%; bottom: 25%; border-radius: 30%; background: linear-gradient(0deg, rgba(220,240,255,0), rgba(220,240,255,.55), rgba(220,240,255,0)); background-size: 100% 200%; }
.st-photo.v-washing .fx-wash { opacity: 1; animation: mx-pulse 1.4s ease-in-out infinite; }
.st-photo.v-drying .fx-dry { opacity: 1; animation: mx-pulse 2.4s ease-in-out infinite; }
.st-photo.v-auto_empty .fx-empty { opacity: 1; animation: mx-flow 1s linear infinite; }
@keyframes mx-pulse { 50% { opacity: .35; } }
@keyframes mx-flow { from { background-position: 0 100%; } to { background-position: 0 -100%; } }
.rp-photo img { width: 100%; height: auto; display:block; border-radius: 10px; }
.rp-photo:not(.v-cleaning) img { -webkit-mask-image: radial-gradient(ellipse 44% 62% at 52% 56%, #000 72%, transparent 100%); mask-image: radial-gradient(ellipse 44% 62% at 52% 56%, #000 72%, transparent 100%); }
.rp-photo.v-cleaning img { animation: mx-shake 3s ease-in-out infinite; }
@keyframes mx-shake { 50% { transform: translateX(3px); } }
.hdr-robot { width: 104px; height: 70px; object-fit: contain; -webkit-mask-image: radial-gradient(ellipse 50% 50%, #000 75%, transparent 100%); mask-image: radial-gradient(ellipse 50% 50%, #000 75%, transparent 100%); }
.tank-img { width: 100%; height: 100%; max-height: 140px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(63,216,255,.35)); }
.station-img-wrap { position: relative; }
.proc { display:flex; flex-direction:column; gap: 9px; }
.proc-ready { display:flex; align-items:center; gap:8px; color: var(--mx-ok); font-size: 15px; }
.proc-ready ha-icon { --mdc-icon-size: 22px; padding: 4px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(56,229,155,.6), 0 0 10px rgba(56,229,155,.4); }
.proc-ready.bad { color: var(--mx-bad); }
.proc-item { display:flex; align-items:center; gap:8px; font-size: 12px; }
.proc-item .pi { color: #e6f2ff; width: 32px; height: 32px; flex: 0 0 32px; display:grid; place-items:center; border-radius: 9px; box-shadow: 0 0 0 1px var(--mx-line); background: rgba(6,16,36,.85); } .proc-item .pi ha-icon { --mdc-icon-size: 19px; }
.proc-item div span { display:block; color: #d5e6f8; line-height: 1.1; white-space: nowrap; font-size: 11px; }
.proc-item b { display:block; color: var(--mx-ok); font-weight: 600; font-size: 12px; }
.proc-item.busy b { color: var(--mx-cyan); } .proc-item.off b { color: var(--mx-dim); } .proc-item.warn b { color: var(--mx-warn); }
.st-tanks { display:flex; flex-direction:column; padding: 10px; border-radius: 10px; background: rgba(4,12,28,.55); box-shadow: 0 0 0 1px var(--mx-line); }
.st-tanks h4 { font-size: 15px; margin-bottom: 10px; }
.tanks { flex: 1; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); grid-auto-rows: 1fr; gap: 8px; }
.tank { display:grid; grid-template-columns: 42% minmax(0,1fr); align-items:center; gap: 8px; padding: 10px 8px; border-radius: 10px; background: rgba(8,22,48,.75); box-shadow: 0 0 0 1px var(--mx-line), 0 0 14px rgba(31,125,255,.12) inset; min-height: 0; }
.tank-svg { width: 44px; height: 62px; }
.tk-glass { stroke: rgba(220,240,255,.85); stroke-width: 1.4; }
.tk-cap { fill: rgba(220,240,255,.85); } .tk-handle, .tk-fold { fill:none; stroke: rgba(220,240,255,.8); stroke-width: 1.4; } .tk-hl { stroke: rgba(255,255,255,.7); stroke-width: 2; stroke-linecap: round; }
.tk-name { display:block; font-size: 10.5px; line-height: 1.15; color: #d5e6f8; }
.tk-val { display:block; font-size: 10px; letter-spacing: -.1px; font-weight: 600; color: var(--mx-ok); margin-top: 2px; }
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
.robot-panel { display:grid; grid-template-columns: minmax(0,1.1fr) minmax(0,1.2fr) minmax(0,1.45fr); gap: 14px; align-items: center; }
.rp-hero { position: relative; }
.rp-name b { display:block; font-size: 20px; font-weight: 700; line-height: 1; } .rp-name small { color: var(--mx-cyan); font-size: 15px; }
.rp-hero .hero-robot, .rp-hero .hero-img { width: 100%; height: auto; display:block; margin-top: 4px; }
.rp-now { display:flex; align-items:center; gap: 10px; }
.rp-now ha-icon { color: var(--mx-ok); --mdc-icon-size: 26px; }
.rp-now span { display:block; color: var(--mx-ok); font-size: 12px; } .rp-now b { font-size: 15px; font-weight: 600; }
.rp-prog { display:flex; align-items:center; gap: 10px; margin: 8px 0 6px; } .rp-prog b { font-size: 16px; min-width: 44px; text-align: right; }
.bar { flex: 1; height: 8px; border-radius: 4px; background: rgba(63,216,255,.12); overflow:hidden; }
.bar > i { display:block; height:100%; background: linear-gradient(90deg, var(--mx-blue), var(--mx-cyan)); box-shadow: 0 0 12px var(--mx-cyan); border-radius: 4px; }
.stats3 { display:grid; grid-template-columns: repeat(3, 1fr); }
.stats3 > div { padding: 0 8px; border-left: 1px solid var(--mx-line); } .stats3 > div:first-child { border-left: 0; padding-left: 0; }
.stats3 b { font-size: 16px; font-weight: 600; display:block; } .stats3 span { font-size: 10.5px; color: var(--mx-dim); }
.rp-mode { display:flex; align-items:center; gap: 10px; margin-top: 8px; }
.rp-mode ha-icon { --mdc-icon-size: 22px; color: var(--mx-cyan); }
.rp-mode b { display:block; font-size: 12.5px; font-weight: 600; } .rp-mode span { font-size: 11px; color: var(--mx-dim); }
.ctrl-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; height: 100%; }
.big { min-height: 120px; border-radius: 12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 10px; font-size: 18px; font-weight: 500;
  background: linear-gradient(180deg, rgba(14,32,66,.9), rgba(6,16,36,.9)); box-shadow: 0 0 0 1px var(--mx-line), 0 0 16px rgba(31,125,255,.15) inset; }
.big ha-icon { --mdc-icon-size: 40px; }
.big.primary { background: linear-gradient(180deg, #2a8bff, #0b52d0); box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 28px rgba(31,125,255,.7); }

.modes-panel h4 { color: #dbe9fb; }
.opts { display:grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 8px; }
.opts.row { grid-template-columns: repeat(4, 1fr); margin-bottom: 10px; }
.opt { padding: 9px 4px; border-radius: 10px; font-size: 11.5px; display:flex; flex-direction:column; align-items:center; gap: 6px; background: rgba(6,16,36,.8); box-shadow: 0 0 0 1px var(--mx-line); }
.opts.row .opt { flex-direction: row; justify-content: center; gap: 8px; padding: 12px 6px; text-align: left; }
.opt ha-icon { color: var(--mx-cyan); --mdc-icon-size: 24px; }
.opt.active { background: linear-gradient(180deg, rgba(31,125,255,.85), rgba(13,79,196,.75)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 16px rgba(63,216,255,.5); }
.opt.active ha-icon { color: #fff; }
.modes-split { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ===== pomieszczenia ===== */
.seg { display:flex; padding: 3px; border-radius: 9px; box-shadow: 0 0 0 1px var(--mx-line); background: rgba(4,12,28,.7); }
.seg button { padding: 5px 14px; border-radius: 7px; font-size: 11.5px; color: var(--mx-dim); }
.seg button.on { background: linear-gradient(180deg, #2a8bff, #0b52d0); color: #fff; box-shadow: 0 0 10px rgba(31,125,255,.6); }
.rooms { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; }
.room { position: relative; text-align:left; padding: 8px 24px 8px 9px; border-radius: 10px; min-height: 62px; background: rgba(6,16,36,.8); box-shadow:0 0 0 1px var(--mx-line); }
.r-ic ha-icon { color: #9fd6ff; --mdc-icon-size: 20px; filter: drop-shadow(0 0 4px rgba(63,216,255,.6)); }
.room b { display:block; font-size: 12px; font-weight: 600; margin-top: 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.r-sub { font-size: 11px; color: var(--mx-dim); }
.r-arrow { position:absolute; right: 9px; top: 50%; width: 0; height: 0; transform: translateY(-50%); border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 10px solid var(--rc); filter: drop-shadow(0 0 5px var(--rc)); }
.room.sel { background: linear-gradient(180deg, rgba(31,125,255,.75), rgba(13,79,196,.55)); box-shadow:0 0 0 1px var(--mx-line-strong), 0 0 16px rgba(63,216,255,.45); }
.room.sel .r-ic ha-icon { color: #fff; } .room.sel .r-sub { color: #dcecff; }
.room.cur::after { content:""; position:absolute; top:8px; right:8px; width:7px; height:7px; border-radius:50%; background: var(--mx-ok); box-shadow:0 0 8px var(--mx-ok); }
.room-actions { display:none; gap:8px; margin-top: 10px; flex-wrap: wrap; } .room-actions.show { display:flex; }

/* ===== zaawansowane ===== */
.tabs { display:flex; gap: 2px; padding: 3px; border-radius: 9px; background: rgba(4,12,28,.7); box-shadow: 0 0 0 1px var(--mx-line); margin-bottom: 10px; overflow-x: auto; scrollbar-width: none; }
.tabs button { flex: 1 0 auto; padding: 6px 6px; border-radius: 7px; font-size: 11.5px; color: #c9dbf0; white-space: nowrap; }
.tabs button.on { background: linear-gradient(180deg, #2a8bff, #0b52d0); color: #fff; box-shadow: 0 0 10px rgba(31,125,255,.6); }
.adv-cols { display:grid; grid-template-columns: minmax(0,1.15fr) minmax(0,1fr); gap: 10px; }
.adv-left, .adv-right { display:flex; flex-direction:column; gap: 6px; min-width: 0; }
.adv-right { padding-left: 10px; border-left: 1px solid var(--mx-line); }
.genius { padding: 10px; border-radius: 10px; background: rgba(8,22,48,.75); box-shadow: 0 0 0 1px var(--mx-line); display:flex; flex-direction:column; gap: 6px; }
.g-head { display:flex; align-items:center; gap: 10px; }
.g-ic { width: 36px; height: 36px; border-radius: 50%; display:grid; place-items:center; color: #d9a6ff; box-shadow: 0 0 0 1px rgba(200,140,255,.6), 0 0 12px rgba(200,140,255,.45); }
.g-head b { display:block; font-size: 13px; } .g-head small { font-size: 9.5px; display:block; color: var(--mx-dim); }
.g-head .tgbtn { margin-left: auto; }
.g-note { font-size: 11.5px; color: #d5e6f8; }
.sel-row { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size: 11.5px; color: #d5e6f8; }
.sel-row select { background: rgba(4,12,28,.9); color: var(--mx-text); border: 1px solid var(--mx-line); border-radius: 7px; padding: 4px 6px; font: inherit; font-size: 11.5px; width: 56%; min-width: 0; }
.sw { display:flex; justify-content:space-between; align-items:center; gap:8px; padding: 5px 0; font-size: 11.5px; text-align:left; color: #d5e6f8; width: 100%; }
.tg { width: 34px; height: 18px; border-radius: 9px; background: rgba(127,155,189,.35); position: relative; flex: 0 0 auto; transition: background .2s; display:inline-block; }
.tg::after { content:""; position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#cfe2f7; transition: left .2s; }
.tg.on { background: var(--mx-blue); box-shadow: 0 0 10px rgba(63,216,255,.6); } .tg.on::after { left: 18px; background:#fff; }
.sw-list { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 4px 18px; }
.sw-list .sw { border-bottom: 1px solid rgba(63,216,255,.1); padding: 9px 0; font-size: 14px; }

/* ===== serwis ===== */
.svc { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
.svc-item { text-align:center; padding: 8px 4px; border-radius: 10px; background: rgba(6,16,36,.75); box-shadow:0 0 0 1px var(--mx-line); }
.ring { width: 60px; height: 60px; display:block; margin: 0 auto 4px; }
.ring .bg { stroke: rgba(63,216,255,.12); } .ring .fg { stroke-linecap: round; transition: stroke-dashoffset .6s; }
.ring text { fill: var(--mx-text); font-size: 14px; font-weight: 700; }
.svc-item b { display:block; font-size: 10.5px; font-weight: 500; line-height: 1.15; }
.svc-item small { display:block; color: #d5e6f8; font-size: 11px; }
.rst { margin-top: 6px; font-size: 12px; color: var(--mx-cyan); padding: 4px 10px; border-radius: 7px; box-shadow: 0 0 0 1px var(--mx-line); }

/* ===== historia ===== */
.hist { display:flex; flex-direction:column; gap: 8px; }
.h-item { display:grid; grid-template-columns: 64px minmax(0,1fr) auto; gap: 10px; align-items:center; padding: 6px; border-radius: 10px; background: rgba(6,16,36,.75); box-shadow:0 0 0 1px var(--mx-line); }
.h-thumb { width: 64px; height: 46px; border-radius: 6px; object-fit: cover; background: rgba(31,125,255,.15); box-shadow: 0 0 0 1px var(--mx-line); }
.h-txt { min-width:0; } .h-txt b, .h-txt span { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .h-txt b { font-size: 12.5px; font-weight: 600; } .h-txt span { font-size: 11px; color: var(--mx-dim); }
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

.rp-name { display:flex; align-items:center; gap: 8px; } .rp-mini { width: 58px; height: 38px; object-fit: contain; }
.opts.row .opt:nth-child(2) { margin-right: 6px; }

.furn { fill: rgba(220,240,255,.14); stroke: rgba(230,245,255,.85); stroke-width: 2.5; }
.furn-ic { width: var(--s); height: var(--s); display:grid; place-items:center; color: rgba(235,248,255,.95); filter: drop-shadow(0 0 4px rgba(120,220,255,.9)); }
.furn-ic ha-icon { --mdc-icon-size: var(--s); }
.ring .rsub { fill: var(--mx-dim); font-size: 8px; font-weight: 500; }
.top { border: 0; box-shadow: none; background: none; }
.hud-frame { position:absolute; inset: 0; width: 100%; height: 100%; pointer-events:none; overflow: visible; }
.hud-frame path { fill: none; stroke: rgba(90,200,255,.75); stroke-width: 1.5; vector-effect: non-scaling-stroke; filter: drop-shadow(0 0 4px rgba(63,216,255,.8)); }
.hud-frame path.hi { stroke: rgba(150,235,255,1); stroke-width: 2.5; }
.hud-frame path.fill { fill: rgba(8,22,48,.55); stroke: none; filter: none; }
.top > *:not(.hud-frame) { position: relative; }

.mbill { position:absolute; visibility:hidden; width: var(--s, 60px); transform: translate(-50%, -78%); pointer-events:none; z-index: 2; }
.mbill img, .mbill svg { width: 100%; height: auto; display:block; position: relative; filter: drop-shadow(0 6px 8px rgba(0,0,0,.6)) drop-shadow(0 0 10px rgba(63,216,255,.45)); }
.mbill.robot img { -webkit-mask-image: radial-gradient(ellipse 50% 50%, #000 78%, transparent 100%); mask-image: radial-gradient(ellipse 50% 50%, #000 78%, transparent 100%); }
.mbill.charger { width: calc(var(--s, 60px) * 0.9); transform: translate(-50%, -88%); }
.mbill.charger img { -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%); }
.mb-glow { position:absolute; left: 50%; bottom: 2%; width: 120%; height: 36%; transform: translateX(-50%); border-radius: 50%;
  background: radial-gradient(closest-side, rgba(63,216,255,.75), rgba(31,125,255,.25) 60%, transparent); }
.mbill.robot .mb-glow { animation: mx-pulse 2s ease-in-out infinite; }

.big.primary { background: linear-gradient(180deg, rgba(14,32,66,.9), rgba(6,16,36,.9)); box-shadow: 0 0 0 1px var(--mx-line), 0 0 16px rgba(31,125,255,.15) inset; }
.big.primary.lit { background: linear-gradient(180deg, #2a8bff, #0b52d0); box-shadow: 0 0 0 1px var(--mx-line-strong), 0 0 28px rgba(31,125,255,.7); }

/* zakładka Serwis — ilustracje części */
.svc-full { display:grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 12px; }
.svc-big { display:grid; grid-template-columns: 160px minmax(0,1fr) auto; gap: 14px; align-items:center; padding: 12px 14px; border-radius: 12px; background: rgba(6,16,36,.75); box-shadow: 0 0 0 1px var(--mx-line); --pc: #4cc8ff; }
.svc-big.l-mid { box-shadow: 0 0 0 1px rgba(255,181,71,.7); --pc: #ffae3d; }
.svc-big.l-bad { box-shadow: 0 0 0 1px var(--mx-bad), 0 0 14px rgba(255,90,110,.35); --pc: #ff5a72; }
.svc-big.l-unk { --pc: #7f9bbd; }
.sb-art { height: 110px; border-radius: 10px; display:grid; place-items:center; overflow:hidden; color: var(--pc);
  background: radial-gradient(closest-side, color-mix(in srgb, var(--pc) 22%, transparent), transparent),
    repeating-linear-gradient(0deg, rgba(63,216,255,.06) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, rgba(63,216,255,.06) 0 1px, transparent 1px 12px);
  box-shadow: 0 0 0 1px rgba(64,170,255,.25) inset; }
.sb-art svg { width: 160px; height: 110px; transform: scale(1.15); }
.sb-txt b { display:block; font-size: 17px; font-weight: 600; } .sb-txt span { display:block; font-size: 13px; color: var(--mx-dim); margin-top: 2px; }
.sb-st { display:inline-block; font-style: normal; margin-top: 8px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 7px; color: var(--mx-ok); background: rgba(56,229,155,.14); box-shadow: 0 0 0 1px rgba(56,229,155,.5); }
.l-mid .sb-st { color: var(--mx-warn); background: rgba(255,181,71,.14); box-shadow: 0 0 0 1px rgba(255,181,71,.5); }
.l-bad .sb-st { color: var(--mx-bad); background: rgba(255,90,110,.14); box-shadow: 0 0 0 1px rgba(255,90,110,.5); }
.l-unk .sb-st { color: var(--mx-dim); background: none; box-shadow: 0 0 0 1px var(--mx-line); }
.sb-txt .rst { display:block; margin-top: 10px; }
.svc-big .ring { width: 84px; height: 84px; }
@container (max-width: 640px) { .svc-full { grid-template-columns: 1fr; } .svc-big { grid-template-columns: 110px minmax(0,1fr) auto; } .sb-art { height: 84px; } .sb-art svg { width: 110px; height: 80px; } .svc-big .ring { width: 64px; height: 64px; } }

/* obrazek Miecia zależny od stanu */
.rp-photo { position: relative; }
.rp-photo.k-dock img { width: auto; max-width: 100%; height: 150px; object-fit: contain; margin: 0 auto; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 10%, #000 90%, transparent 100%), linear-gradient(0deg, transparent 0, #000 8%); mask-image: linear-gradient(90deg, transparent 0, #000 10%, #000 90%, transparent 100%); filter: drop-shadow(0 0 10px rgba(63,216,255,.35)); }
.rp-photo.k-idle img { width: 78%; margin: 6px auto 0; position: relative; z-index: 1; filter: drop-shadow(0 8px 10px rgba(0,0,0,.6)); }
.rp-photo.k-idle .rp-floor { position:absolute; left: 12%; right: 12%; bottom: -2px; height: 26%; border-radius: 50%; background: radial-gradient(closest-side, rgba(63,216,255,.55), rgba(31,125,255,.18) 60%, transparent); }
.rp-photo.v-error img, .rp-photo.v-unavailable img { filter: grayscale(.85) brightness(.7); }
.rp-photo.v-paused img { filter: drop-shadow(0 0 8px rgba(255,181,71,.45)); }
`;

// ===== src/views/views.js =====
// Widoki karty (układ 1:1 z zatwierdzonym mockupem). Tylko HTML, bez wywołań usług.










const icon = (i, cls = '') => `<ha-icon class="${cls}" icon="${esc(i)}"></ha-icon>`;
const pct = (v) => Math.max(0, Math.min(100, toNum(v) ?? 0));
const ROOM_COLORS = NEON;
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
    <svg class="hud-frame" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
      <path class="fill" d="M6 2 H800 L826 98 H6 Q2 98 2 94 V6 Q2 2 6 2 Z"/>
      <path d="M6 2 H800 L826 98 H6 Q2 98 2 94 V6 Q2 2 6 2 Z"/>
      <path class="hi" d="M2 30 V6 Q2 2 6 2 H60"/>
      <path class="hi" d="M808 30 L826 98 H998"/>
      <path d="M836 2 H998"/>
    </svg>
    <div class="brand">${c.config.graphics === 'svg' ? heroRobotSvg(visual) : `<img class="hdr-robot" src="${esc(c.config.robot_image || ASSETS.robot_top)}" alt="">`}<div><h1>${esc(c.config.name || 'Mieciu')}</h1><small>${esc(c.config.model || 'Dreame X50 Ultra')}</small></div></div>
    <div class="tele">
      ${chip(batt === null ? 'mdi:battery-unknown' : chg === 'charging' ? 'mdi:battery-charging' : 'mdi:battery', batt === null ? '—' : `${batt}%`, battLab, 'c-batt')}
      ${chip('mdi:home', PL.visual[visual] || '—', 'Stan', 'c-home')}
      ${chip('mdi:plus-box-outline', a.selected_map || '—', 'Aktualna mapa')}
      ${chip('mdi:crop-free', c.st('total_area') ? `${fmtNum(toNum(c.st('total_area').state))} m²` : '—', 'Łącznie')}
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
  ['map', 'mdi:map-legend', 'Mapa'], ['cleaning', 'mdi:hand-wash-outline', 'Sprzątanie'], ['station', 'mdi:dishwasher', 'Stacja'],
  ['service', 'mdi:tools', 'Serwis'], ['history', 'mdi:clipboard-arrow-down-outline', 'Historia'], ['settings', 'mdi:cog-box', 'Ustawienia'],
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
  let labels = '';
  let bills = '';
  if (dims && T) {
    const ppm = dims.pxPerM || Math.hypot(T(1000, 0)[0] - T(0, 0)[0], T(1000, 0)[1] - T(0, 0)[1]);
    const furn = pyParse(c.cam?.attributes?.furnitures);
    const furnSvg = Array.isArray(furn) ? furn.map((f) => {
      const x0 = toNum(f.x0), y0 = toNum(f.y0), fw = toNum(f.width), fh = toNum(f.height);
      if ([x0, y0, fw, fh].some((v) => v === null)) return '';
      const pts = [[x0, y0], [x0 + fw, y0], [x0 + fw, y0 + fh], [x0, y0 + fh]].map(([x, y]) => T(x, y).map((v) => v.toFixed(1)).join(',')).join(' ');
      const [cx, cy] = T(x0 + fw / 2, y0 + fh / 2);
      const t = String(f.type || '').toLowerCase();
      const ic = t.includes('podwójne') || t.includes('double') ? 'mdi:bed-king-outline' : t.includes('łóżko') || t.includes('bed') ? 'mdi:bed-single-outline'
        : t.includes('sofa') || t.includes('kanap') ? 'mdi:sofa-outline' : t.includes('stół') || t.includes('table') ? 'mdi:table-furniture'
        : t.includes('szafka') || t.includes('cabinet') ? 'mdi:dresser-outline' : 'mdi:sofa-single-outline';
      const sz = Math.max(18, Math.min(fw, fh) * ppm / 1000 * 0.55);
      return `<polygon class="furn" points="${pts}"/><foreignObject x="${cx - sz / 2}" y="${cy - sz / 2}" width="${sz}" height="${sz}"><div class="furn-ic" style="--s:${sz}px">${icon(ic)}</div></foreignObject>`;
    }).join('') : '';
    const rp = getRobotPosition(c.cam), cp = getChargerPosition(c.cam);
    const rs = Math.max(26, ppm * 0.62);
    const robot = rp ? (() => { const [x, y] = T(rp.x, rp.y); return `<g class="map-robot"><circle cx="${x}" cy="${y}" r="${rs * 0.7}" class="mr-glow"/>${c.config.graphics === 'svg' ? `<circle cx="${x}" cy="${y}" r="${rs / 2}" class="mr-body"/>` : `<image href="${esc(c.config.robot_image || ASSETS.robot_top)}" x="${x - rs / 2}" y="${y - rs * 0.36}" width="${rs}" height="${rs * 0.72}"/>`}</g>`; })() : '';
    const charger = cp ? (() => { const [x, y] = T(cp.x, cp.y); return `<rect class="map-charger" x="${x - ppm * 0.2}" y="${y - ppm * 0.12}" width="${ppm * 0.4}" height="${ppm * 0.24}" rx="${ppm * 0.05}"/>`; })() : '';
    const anchors = rooms.filter((rm) => rm.x !== null && rm.visible).map((rm) => { const [x, y] = T(rm.x, rm.y); return `<circle class="anc" data-anc="${rm.id}" cx="${x}" cy="${y}" r="1"/>`; }).join('');
    const robAnc = rp ? (() => { const [x, y] = T(rp.x, rp.y); return `<circle class="anc map-robot" data-anc="robot" cx="${x}" cy="${y}" r="1"/>`; })() : '';
    const chAnc = cp ? (() => { const [x, y] = T(cp.x, cp.y); return `<circle class="anc" data-anc="charger" cx="${x}" cy="${y}" r="1"/>`; })() : '';
    overlay = `<svg class="map-overlay" viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}">${furnSvg}${anchors}${chAnc}${robAnc}</svg>`;
    // robot i stacja jako stojące obiekty 3D (billboardy), nie spłaszczone z mapą
    const svgMode = c.config.graphics === 'svg';
    bills = `${cp ? `<div class="mbill charger" data-lbl="charger" data-mm="950">${svgMode ? '' : `<img src="${esc(c.config.station_image || ASSETS.station)}" alt="">`}<i class="mb-glow"></i></div>` : ''}
      ${rp && !toBool(c.vac?.attributes?.docked) ? `<div class="mbill robot" data-lbl="robot" data-mm="700"><i class="mb-glow"></i>${svgMode ? heroRobotSvg('docked') : `<img src="${esc(c.config.robot_image || ASSETS.robot_top)}" alt="">`}</div>` : ''}`;
    if (ui.labels || bills) {
      labels = `<div class="map-labels">${bills}${!ui.labels ? '' : rooms.filter((rm) => rm.x !== null && rm.visible).map((rm) => {
        const area = dims.areas?.get(rm.id);
        const sel = ui.selected.has(rm.id);
        return `<button class="mlabel${sel ? ' sel' : ''}${rm.id === cur ? ' cur' : ''}" data-act="room" data-room="${rm.id}" data-lbl="${rm.id}" style="--rc:${roomColor(rm)}">
          ${icon(rm.icon || 'mdi:home-outline')}<b>${sel ? `${[...ui.selected].indexOf(rm.id) + 1}. ` : ''}${esc(rm.name || rm.id)}</b>${area ? `<span>~${fmtNum(area)} m²</span>` : ''}</button>`;
      }).join('')}</div>`;
    }
  }
  const hasImg = !!c.cam?.attributes?.entity_picture && !isUnavail(c.cam);
  const tool = (act, ic, title, active = false, extra = '') => `<button class="tool ${active ? 'active' : ''}" data-act="${act}" ${extra} title="${title}">${icon(ic)}</button>`;
  return `
  <section class="panel map-panel">
    <div class="map-tools">
      ${tool('holo', 'mdi:layers-outline', 'Warstwa holograficzna', ui.holo)}
      ${tool('fit', 'mdi:radiobox-marked', 'Dopasuj widok')}
      ${tool('all-rooms', 'mdi:crop-free', 'Zaznacz wszystkie pokoje')}
      ${tool('robot', 'mdi:map-marker-outline', 'Pokaż robota')}
      ${tool('labels', 'mdi:ruler', 'Etykiety i metraż', ui.labels)}
      ${tool('clear-rooms', 'mdi:vector-arrange-below', 'Wyczyść zaznaczenie')}
      <div class="dim2d3d"><button class="${!ui.map3d ? 'on' : ''}" data-act="map2d">2D</button><i></i><button class="${ui.map3d ? 'on' : ''}" data-act="map3d">3D</button></div>
    </div>
    <div class="map-col">
      <div class="map-view">
        ${hasImg ? `<div class="map-stage"><div class="map-3d ${ui.map3d ? 'on' : ''}"><div class="img-slot"></div>${overlay}</div></div>${labels}`
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
  const row = (ic, label, val, cls) => `<div class="proc-item ${cls}"><span class="pi">${icon(ic)}</span><div><span>${esc(label)}</span><b>${esc(val)}</b></div></div>`;
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
    const img = { clean_water: ASSETS.tank_clean, dirty_water: ASSETS.tank_dirty, dust_bag: ASSETS.tank_bag, detergent: ASSETS.tank_det }[kind];
    return `<div class="tank s-${s}">${c.config.graphics === 'svg' ? tankSvg(kind) : `<img class="tank-img" src="${img}" alt="">`}<div><span class="tk-name">${esc(PL.tankName[kind])}</span><b class="tk-val">${esc(PL.tank[s])}</b></div></div>`;
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
        <div class="st-art">${c.config.graphics === 'svg' ? stationSvg(visual, { image: c.config.station_image }) : `<div class="st-photo v-${visual}"><img src="${esc(c.config.station_image || ASSETS.station)}" alt="Stacja">
          <i class="fx-ph fx-wash"></i><i class="fx-ph fx-dry"></i><i class="fx-ph fx-empty"></i><span class="st-badge">${esc(PL.visual[visual])}</span></div>`}</div>
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
      <div class="rp-name">${c.config.graphics === 'svg' ? '' : `<img class="rp-mini" src="${esc(c.config.robot_image || ASSETS.robot_top)}" alt="">`}<div><b>${esc(c.config.name || 'Mieciu')}</b><small>${esc(c.config.model || 'Dreame X50 Ultra')}</small></div></div>
      ${c.config.graphics === 'svg' ? heroRobotSvg(visual, { sparks: visual === 'cleaning', image: c.config.robot_image }) : (() => {
        // sprząta -> robot w akcji; w stacji / mycie / suszenie / opróżnianie -> robot w stacji; reszta -> robot stojący
        const inDock = ['docked', 'washing', 'drying', 'auto_empty'].includes(visual);
        const img = visual === 'cleaning' ? (c.config.robot_image || ASSETS.robot) : inDock ? (c.config.station_image || ASSETS.station) : ASSETS.robot_top;
        const kind = visual === 'cleaning' ? 'run' : inDock ? 'dock' : 'idle';
        return `<div class="rp-photo v-${visual} k-${kind}"><img src="${esc(img)}" alt="">${kind === 'idle' ? '<i class="rp-floor"></i>' : ''}</div>`;
      })()}
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
      <button class="big primary ${visual === 'cleaning' ? 'lit' : ''}" data-act="start" ${dis}>${icon('mdi:play')}<span>${visual === 'paused' ? PL.generic.resume : PL.generic.start}</span></button>
      <button class="big" data-act="pause" ${dis || (visual !== 'cleaning' && visual !== 'returning' ? 'disabled' : '')}>${icon('mdi:pause')}<span>${PL.generic.pause}</span></button>
      <button class="big" data-act="dock" ${dis}>${icon('mdi:home')}<span>${PL.generic.dock}</span></button>
    </div>
  </section>`;
}

const OPT_ICONS = {
  sweeping: 'mdi:robot-vacuum', sweeping_and_mopping: 'mdi:robot-vacuum-variant', mopping: 'mdi:water-outline', mopping_after_sweeping: 'mdi:robot-vacuum-alert',
  quiet: 'mdi:fan', silent: 'mdi:fan', standard: 'mdi:fan', strong: 'mdi:fan', turbo: 'mdi:fan',
  slightly_dry: 'mdi:weather-windy', moist: 'mdi:water-outline', wet: 'mdi:water-opacity',
};
function optTiles(c, key, cls = '') {
  const so = c.st(key);
  if (!so) return '<span class="dim">brak encji</span>';
  if (isUnavail(so)) return `<span class="dim">${PL.generic.unavailable}</span>`;
  const ORDER = ['sweeping', 'sweeping_and_mopping', 'mopping', 'mopping_after_sweeping'];
  const list = [...opts(so)].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  return `<div class="opts ${cls}">${list.map((o) =>
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
    const area = c.ui.areas?.get(r.id);
    const sub = view === 'order' ? `Kolejność ${ord && !isUnavail(ord) ? ord.state : r.order ?? '—'}` : area ? `~${fmtNum(area)} m²` : floor && !isUnavail(floor) ? optLabel(floor.state) : `#${r.id}`;
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
  cleangenius: { label: 'CleanGenius', genius: true,
    selects: [['water_temperature', 'Temperatura wody'], ['washing_mode', 'Tryb mycia mopów'], ['self_clean_frequency', 'Samoczyszczenie']],
    switches: [
      { sel: 'carpet_cleaning', label: 'Adaptacja do dywanów', on: (v) => v === 'adaptation', onOpt: 'adaptation', offOpt: 'ignore' },
      ['clean_carpets_first', 'Najpierw dywany'],
      { sel: 'auto_recleaning', label: 'Ponowne sprzątanie', on: (v) => v !== 'off', onOpt: 'in_deep_mode', offOpt: 'off' },
      { sel: 'auto_rewashing', label: 'Ponowne mycie', on: (v) => v !== 'off', onOpt: 'in_deep_mode', offOpt: 'off' },
      ['mop_extend', 'Rozszerzanie mopa'],
      ['mopping_under_furnitures', 'Czyszczenie pod meblami'],
    ] },
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

function switchRow(so, label) {
  if (!so || isUnavail(so)) return '';
  return `<button class="sw" data-act="toggle" data-entity="${esc(so.entity_id)}"><span>${esc(label || shortName(so))}</span><i class="tg ${so.state === 'on' ? 'on' : ''}"></i></button>`;
}

// przełącznik oparty o encję select (np. dywany: adaptacja <-> ignoruj)
function selToggleRow(so, def) {
  if (!so || isUnavail(so)) return '';
  const on = def.on(so.state);
  const target = on ? def.offOpt : def.onOpt;
  if (!opts(so).includes(target)) return '';
  return `<button class="sw" data-act="select" data-entity="${esc(so.entity_id)}" data-option="${esc(target)}"><span>${esc(def.label)}</span><i class="tg ${on ? 'on' : ''}"></i></button>`;
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
  left += def.selects.map((k) => (Array.isArray(k) ? selectRow(c, c.ent('select', k[0]), k[1]) : selectRow(c, c.ent('select', k)))).join('');
  const right = def.switches.map((k) => (Array.isArray(k) ? switchRow(c.ent('switch', k[0]), k[1])
    : typeof k === 'object' ? selToggleRow(c.ent('select', k.sel), k) : switchRow(c.ent('switch', k)))).join('');
  return `
  <section class="panel adv-panel">
    <h3 class="ptitle">Ustawienia zaawansowane</h3>
    ${forceTab ? '' : `<div class="tabs">${Object.entries(ADV).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-act="advtab" data-tab="${k}">${v.label}</button>`).join('')}</div>`}
    <div class="adv-cols"><div class="adv-left">${left || '<span class="dim">—</span>'}</div><div class="adv-right">${right || '<span class="dim">—</span>'}</div></div>
  </section>`;
}

// ---------- serwis ----------
function ring(v, sub = '') {
  const n = toNum(v);
  const r = 26, C = 2 * Math.PI * r;
  const col = n === null ? 'var(--mx-dim)' : n > 50 ? 'var(--mx-ok)' : n > 20 ? 'var(--mx-warn)' : 'var(--mx-bad)';
  return `<svg class="ring" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="${r}" fill="none" stroke-width="5"/>
    <circle class="fg" cx="32" cy="32" r="${r}" fill="none" stroke-width="5" stroke="${col}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (n ?? 0) / 100)}" transform="rotate(-90 32 32)" style="filter:drop-shadow(0 0 4px ${col})"/>
    <text x="32" y="${sub ? 33 : 36}" text-anchor="middle">${n === null ? '—' : `${n}%`}</text>${sub ? `<text class="rsub" x="32" y="44" text-anchor="middle">${esc(sub)}</text>` : ''}</svg>`;
}

const SVC_DASH = ['main_brush', 'side_brush', 'filter', 'sensor_dirty', 'silver_ion', 'scale_inhibitor'];
const SVC_LABEL = { ...PL.service, scale_inhibitor: 'Środek do kamienia' };
function renderService(c, full = false) {
  const maint = c.st('maintenance');
  const keys = full ? SERVICE_ITEMS : SVC_DASH;
  const items = keys.filter((k) => c.st(`svc_${k}_left`)).map((k) => {
    const left = c.st(`svc_${k}_left`), time = c.st(`svc_${k}_time`), rst = c.st(`svc_${k}_reset`);
    const unit = time?.attributes?.unit_of_measurement || '';
    const tl = time && !isUnavail(time) ? `${fmtNum(toNum(time.state))} ${unit}` : '—';
    if (full) {
      const n = isUnavail(left) ? null : toNum(left.state);
      const lvl = n === null ? 'unk' : n > 50 ? 'ok' : n > 20 ? 'mid' : 'bad';
      const st = n === null ? 'Brak danych' : n > 50 ? 'OK' : n > 20 ? 'Wkrótce wymiana' : (['wheel_dirty', 'sensor_dirty'].includes(k) ? 'Wyczyść' : 'Wymień');
      return `<div class="svc-big l-${lvl}"><div class="sb-art">${partSvg(k)}</div>
        <div class="sb-txt"><b>${esc(SVC_LABEL[k])}</b><span>Pozostało: ${esc(tl)}</span><i class="sb-st">${st}</i>
          ${rst && rst.state !== 'unavailable' ? `<button class="rst" data-act="press" data-entity="${esc(rst.entity_id)}" data-label="Reset: ${esc(SVC_LABEL[k])}">Resetuj</button>` : ''}</div>
        ${ring(n)}</div>`;
    }
    return `<div class="svc-item">${ring(isUnavail(left) ? null : left.state, tl)}<b>${esc(SVC_LABEL[k])}</b>
      <small>${esc(tl)}</small>
      ${full && rst && rst.state !== 'unavailable' ? `<button class="rst" data-act="press" data-entity="${esc(rst.entity_id)}" data-label="Reset: ${esc(SVC_LABEL[k])}">Resetuj</button>` : ''}</div>`;
  }).join('');
  const items2 = maint?.state === 'on' ? pyParse(maint.attributes?.items) : null;
  return `
  <section class="panel svc-panel">
    <h3 class="ptitle"><span>Serwis i konserwacja</span>${maint?.state === 'on' ? `<span class="warn small">${icon('mdi:wrench-clock')} ${Array.isArray(items2) ? items2.map((x) => SVC_LABEL[`${x}_dirty`] || SVC_LABEL[x] || x).join(', ') : 'wymaga uwagi'}${full ? ' — wymaga uwagi' : ''}</span>` : ''}</h3>
    <div class="${full ? 'svc-full' : 'svc'}">${items || '<span class="dim">Brak danych</span>'}</div>
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







const VERSION = '1.1.0';

// Minimalny „morph”: aktualizuje istniejący DOM do nowego HTML bez jego
// przebudowy. Zachowuje obrazki, canvas mapy, fokus i wysokość karty.
function morphChildren(from, to) {
  const fc = [...from.childNodes];
  const tc = [...to.childNodes];
  tc.forEach((t, i) => {
    if (i < fc.length) morphNode(fc[i], t);
    else from.appendChild(t);
  });
  for (let i = tc.length; i < fc.length; i++) fc[i].remove();
}

function morphNode(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
  if (a.nodeType === 3 || a.nodeType === 8) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.nodeType !== 1) return;
  const keepStyle = a.classList.contains('map-stage') || a.classList.contains('map-3d') || a.classList.contains('mlabel') || a.classList.contains('mbill');
  for (const at of [...a.attributes]) {
    if (!b.hasAttribute(at.name) && !(keepStyle && at.name === 'style')) a.removeAttribute(at.name);
  }
  for (const at of [...b.attributes]) {
    if (keepStyle && at.name === 'style') continue;
    if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
  }
  if (a.classList.contains('img-slot')) return; // zawartość mapy zarządzana ręcznie
  if (a.nodeName === 'HA-ICON' || a.nodeName === 'IMG') return; // komponenty z własną zawartością
  morphChildren(a, b);
  if (a.nodeName === 'SELECT') {
    const sel = b.querySelector('option[selected]');
    if (sel && a.value !== sel.value) a.value = sel.value;
  }
}

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
    // krój pisma jak w mockupie (font-face musi być w dokumencie, nie w shadow DOM)
    if (this._config?.font !== false && !document.getElementById('mieciu-x50-font')) {
      const l = document.createElement('link');
      l.id = 'mieciu-x50-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Saira+Semi+Condensed:wght@400;500;600;700&display=swap';
      document.head.appendChild(l);
    }
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

    // szkielet tworzymy raz; potem tylko „łatamy” różnice (morph), żeby nie
    // przeładowywać obrazków i nie zmieniać wysokości karty (skok przewijania)
    if (!this._root) {
      this.shadowRoot.innerHTML = `<style>${STYLES}</style>
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
        <filter id="mx-holo" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"/>
          <feColorMatrix type="hueRotate" values="180"/>
          <feColorMatrix type="saturate" values="2.8"/>
          <feComponentTransfer><feFuncR type="linear" slope="1.35"/><feFuncG type="linear" slope="1.35"/><feFuncB type="linear" slope="1.5"/></feComponentTransfer>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.6 1.6 1.6 0 -0.12"/>
        </filter></defs></svg>
      <ha-card class="root"></ha-card>`;
      this._root = this.shadowRoot.querySelector('ha-card');
    }
    const tpl = document.createElement('template');
    tpl.innerHTML = `${renderTop(c, visual)}
        ${body}
        ${this._toastMsg ? `<div class="toast">${this._toastMsg.replace(/</g, '&lt;')}</div>` : ''}`;
    morphChildren(this._root, tpl.content);

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
    if (url && url !== this._mapUrl) {
      this._mapUrl = url;
      const pre = new Image();
      pre.onload = () => {
        this._mapImg.src = url;
        const T = buildTransform(c.cam?.attributes?.calibration_points);
        const rooms = getRooms(c.vac, c.cam);
        this._neon = T ? renderNeonMap(pre, rooms, T) : null;
        this._neonMask = null;
        this._neonLayers = null;
        this._scanEl = null;
        if (this._neon) { this._neon.canvas.className = 'neon'; this._ui.areas = this._neon.areas; }
        const dims = { w: pre.naturalWidth, h: pre.naturalHeight, areas: this._neon?.areas, pxPerM: this._neon?.pxPerM };
        const changed = !this._mapDims || dims.w !== this._mapDims.w || dims.h !== this._mapDims.h;
        this._mapDims = dims;
        if (changed) this._view.z = null;
        this._schedule();
      };
      pre.src = url;
    }
    const useNeon = this._ui.holo && this._neon;
    this._mapImg.className = this._ui.holo && !this._neon ? 'holo' : '';
    if (useNeon) {
      // prawdziwa grubość 3D: przyciemnione kopie mapy w głąb (translateZ), bez ciężkich filtrów
      if (!this._neonLayers) {
        this._neonLayers = [1, 2, 3, 4, 5, 6].map((k) => {
          const cv = document.createElement('canvas');
          cv.width = this._neon.canvas.width; cv.height = this._neon.canvas.height;
          const g = cv.getContext('2d');
          g.drawImage(this._neon.canvas, 0, 0);
          g.globalCompositeOperation = 'source-atop';
          g.fillStyle = `rgba(31,${140 - k * 12},255,${0.35 + k * 0.08})`;
          g.fillRect(0, 0, cv.width, cv.height);
          cv.className = 'neon-layer';
          const step = Math.max(2, (this._neon.pxPerM || 80) * 0.045);
          cv.style.transform = `translateZ(${-k * step}px)`;
          cv.style.opacity = String(0.7 - k * 0.08);
          return cv;
        });
      }
      }
    const want = useNeon ? [...this._neonLayers.slice().reverse(), this._neon.canvas] : [this._mapImg];
    if (useNeon) {
      // wiązka skanera tylko na kształcie mapy (tworzona raz)
      if (!this._scanEl) {
        if (!this._neonMask) { try { this._neonMask = this._neon.canvas.toDataURL(); } catch (_) { this._neonMask = ''; } }
        this._scanEl = document.createElement('div');
        this._scanEl.className = 'holo-scan';
        this._scanEl.innerHTML = '<i></i>';
        if (this._neonMask) this._scanEl.style.setProperty('--mask', `url(${this._neonMask})`);
      }
      want.push(this._scanEl);
    }
    const cur = [...slot.children];
    if (cur.length !== want.length || cur.some((el, i) => el !== want[i])) slot.replaceChildren(...want);
    this._applyView();
  }

  _placeLabels() {
    const view = this.shadowRoot.querySelector('.map-view');
    if (!view) return;
    const vr = view.getBoundingClientRect();
    const ppm = this._mapDims?.pxPerM || 80;
    const z = this._view.z || 0.3;
    this.shadowRoot.querySelectorAll('.mlabel, .mbill').forEach((lb) => {
      const anc = this.shadowRoot.querySelector(`[data-anc="${lb.dataset.lbl}"]`);
      if (!anc) return;
      const r = anc.getBoundingClientRect();
      lb.style.left = `${r.left + r.width / 2 - vr.left}px`;
      lb.style.top = `${r.top + r.height / 2 - vr.top}px`;
      if (lb.dataset.mm) lb.style.setProperty('--s', `${Math.max(28, (Number(lb.dataset.mm) / 1000) * ppm * z * 2.2)}px`);
      lb.style.visibility = 'visible';
    });
  }

  _applyView() {
    const view = this.shadowRoot.querySelector('.map-view');
    const stage = this.shadowRoot.querySelector('.map-stage');
    if (!view || !stage || !this._mapDims) return;
    const { w, h } = this._mapDims;
    if (this._view.z === null) {
      const vw = view.clientWidth || 600, vh = view.clientHeight || 340;
      const bb = this._neon?.bbox || { x0: 0, y0: 0, x1: w, y1: h };
      const rot = this._mapRot();
      const sw = rot % 180 === 0;
      const bw = sw ? bb.x1 - bb.x0 : bb.y1 - bb.y0, bh = sw ? bb.y1 - bb.y0 : bb.x1 - bb.x0;
      const z = this._ui.map3d ? Math.min(vw / bw, vh / bh) * 0.86 : Math.min(vw / bw, vh / bh) * 0.92;
      const dx = (bb.x0 + bb.x1) / 2 - w / 2, dy = (bb.y0 + bb.y1) / 2 - h / 2;
      const rad = (rot * Math.PI) / 180;
      const rx = dx * Math.cos(rad) - dy * Math.sin(rad), ry = dx * Math.sin(rad) + dy * Math.cos(rad);
      this._view = { x: -rx * z, y: -ry * z + (this._ui.map3d ? vh * 0.05 : 0), z };
    }
    const { x, y, z } = this._view;
    const m3 = this.shadowRoot.querySelector('.map-3d');
    if (m3) {
      const rot = this._mapRot();
      m3.style.transform = this._ui.map3d ? `perspective(2400px) rotateX(42deg) rotateZ(${rot - 20}deg)` : `rotate(${rot}deg)`;
      const cmp = this.shadowRoot.querySelector('.compass');

    }
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${z}) translate(${-w / 2}px, ${-h / 2}px)`;
    this._placeLabels();
    clearTimeout(this._lblT);
    this._lblT = setTimeout(() => this._placeLabels(), 700);
  }

  // obrót wizualny mapy (nie zmienia ustawień robota): auto = poziomo
  _mapRot() {
    const r = this._config.map_rotate ?? 'auto';
    if (r !== 'auto') return Number(r) || 0;
    const bb = this._neon?.bbox;
    if (!bb) return 0;
    return (bb.y1 - bb.y0) > (bb.x1 - bb.x0) * 1.15 ? -90 : 0;
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
        case 'robot': {
          // wyśrodkuj na robocie (pozycja z atrybutu kamery)
          const view = this.shadowRoot.querySelector('.map-view');
          const rob = this.shadowRoot.querySelector('.map-robot');
          if (view && rob) {
            const vr = view.getBoundingClientRect(), rr = rob.getBoundingClientRect();
            this._view.x += vr.left + vr.width / 2 - (rr.left + rr.width / 2);
            this._view.y += vr.top + vr.height / 2 - (rr.top + rr.height / 2);
            this._applyView();
          }
          break;
        }
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
