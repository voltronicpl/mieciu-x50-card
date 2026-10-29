// Widoki karty (układ 1:1 z zatwierdzonym mockupem). Tylko HTML, bez wywołań usług.

import { PL, optLabel } from '../translations/pl.js';
import { esc, toNum, toBool, fmtNum, fmtMinutes, isUnavail, pyParse } from '../util/parse.js';
import { SERVICE_ITEMS, roomEntity, discoverSwitches } from '../adapter/entities.js';
import { stationSvg, heroRobotSvg, tankSvg } from '../graphics/station.js';
import { tankStatus, STATION_ACTIVE } from '../state/visual-state.js';
import { buildTransform, getRooms, getRobotPosition, getChargerPosition } from '../adapter/map.js';
import { ASSETS } from '../graphics/assets.js';
import { partSvg } from '../graphics/parts.js';
import { NEON } from '../adapter/map-render.js';

const icon = (i, cls = '') => `<ha-icon class="${cls}" icon="${esc(i)}"></ha-icon>`;
const pct = (v) => Math.max(0, Math.min(100, toNum(v) ?? 0));
export const ROOM_COLORS = NEON;
const roomColor = (r) => ROOM_COLORS[((r.color ?? r.id) % ROOM_COLORS.length + ROOM_COLORS.length) % ROOM_COLORS.length];
const opts = (so) => (Array.isArray(so?.attributes?.options) ? so.attributes.options : (pyParse(so?.attributes?.options) || []));

// ---------- kontekst ----------
export function makeCtx(hass, config, e, ui) {
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
export function renderTop(c, visual) {
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

export function renderErrorBanner(c) {
  const err = c.st('error');
  if (!err || isUnavail(err) || err.state === 'no_error') return '';
  return `<div class="err-banner">${icon('mdi:alert-circle')}<span>${esc(err.attributes?.description || c.fmt(err))}</span></div>`;
}

const TABS = [
  ['map', 'mdi:map-legend', 'Mapa'], ['cleaning', 'mdi:hand-wash-outline', 'Sprzątanie'], ['station', 'mdi:dishwasher', 'Stacja'],
  ['service', 'mdi:tools', 'Serwis'], ['history', 'mdi:clipboard-arrow-down-outline', 'Historia'], ['settings', 'mdi:cog-box', 'Ustawienia'],
];
export function renderNav(tab) {
  return `<nav class="nav panel">${TABS.map(([k, ic, lab]) =>
    `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${icon(ic)}<span>${lab}</span></button>`).join('')}</nav>`;
}

// ---------- mapa ----------
export function renderMap(c, dims) {
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

export function renderStation(c, visual, withActions = false) {
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
export function renderRobot(c, visual) {
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

export function renderModes(c) {
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
export function renderRooms(c, canClean) {
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

export function renderAdvanced(c, forceTab) {
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
export function renderService(c, full = false) {
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

export function renderHistory(c, limit = 4) {
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
export function renderSettings(c) {
  const ids = discoverSwitches(c.hass, c.config);
  return `
  <section class="panel">
    <h3 class="ptitle">Ustawienia urządzenia <span class="dim small">niedostępne ukryte</span></h3>
    <div class="sw-list">${ids.map((id) => switchRow(c.hass.states[id])).join('')}</div>
  </section>`;
}

export function renderRoomDetails(c) {
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
