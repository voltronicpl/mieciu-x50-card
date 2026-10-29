// Widoki karty — funkcje zwracające HTML. Zero logiki usług (to robi card).

import { PL, optLabel } from '../translations/pl.js';
import { esc, toNum, toBool, fmtNum, fmtMinutes, isUnavail, pyParse } from '../util/parse.js';
import { SERVICE_ITEMS, roomEntity, discoverSwitches } from '../adapter/entities.js';
import { stationSvg, miniRobotSvg } from '../graphics/station.js';
import { tankStatus, STATION_ACTIVE } from '../state/visual-state.js';
import { buildTransform, getRooms } from '../adapter/map.js';

const icon = (i) => `<ha-icon icon="${esc(i)}"></ha-icon>`;
const pct = (v) => Math.max(0, Math.min(100, toNum(v) ?? 0));

// ---------- helpery kontekstu ----------
export function makeCtx(hass, config, e, ui) {
  const st = (k) => hass.states[e[k]];
  const fmt = (so) => {
    if (!so) return '—';
    if (isUnavail(so)) return PL.generic.unavailable;
    try { return hass.formatEntityState ? hass.formatEntityState(so) : so.state; } catch (_) { return so.state; }
  };
  return { hass, config, e, ui, st, fmt, vac: hass.states[e.vacuum], cam: hass.states[e.map] };
}

// ---------- nagłówek ----------
export function renderTop(c, visual) {
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

export function renderErrorBanner(c) {
  const err = c.st('error');
  if (!err || isUnavail(err) || err.state === 'no_error') return '';
  const desc = err.attributes?.description || c.fmt(err);
  return `<div class="err-banner">${icon('mdi:alert-circle')}<span>${esc(desc)}</span></div>`;
}

const TABS = [
  ['map', 'mdi:map'], ['cleaning', 'mdi:robot-vacuum'], ['station', 'mdi:home-import-outline'],
  ['rooms', 'mdi:floor-plan'], ['service', 'mdi:tools'], ['history', 'mdi:history'], ['settings', 'mdi:cog-outline'],
];
export function renderNav(tab) {
  return `<nav class="nav">${TABS.map(([k, ic]) =>
    `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${icon(ic)}<span>${PL.tabs[k]}</span></button>`).join('')}</nav>`;
}

// ---------- mapa ----------
export function renderMap(c, dims) {
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
export function renderStation(c, visual, big = false) {
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
export function renderRobot(c, visual) {
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

export function renderModes(c) {
  return `
  <section class="panel">
    <div class="opt-group"><h4>${PL.generic.cleaningMode}</h4>${optButtons(c, 'cleaning_mode')}</div>
    <div class="opt-group"><h4>${PL.generic.suction}</h4>${optButtons(c, 'suction_level')}</div>
    <div class="opt-group" style="margin-bottom:0"><h4>${PL.generic.humidity}</h4>${optButtons(c, 'mop_pad_humidity')}</div>
  </section>`;
}

// ---------- pokoje ----------
export function renderRooms(c, canClean, detailed = false) {
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

export function renderAdvanced(c) {
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

export function renderService(c, withReset = false) {
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
export function parseHistory(histState, camState) {
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

export function renderHistory(c, limit = 4) {
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
export function renderSettings(c) {
  const ids = discoverSwitches(c.hass, c.config);
  return `
  <section class="panel">
    <h3 class="ptitle">Ustawienia urządzenia <span class="dim" style="font-size:12px">niedostępne ukryte</span></h3>
    <div class="sw-list">${ids.map((id) => switchRow(c, id)).join('')}</div>
  </section>`;
}

export function renderRoomDetails(c) {
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
