import { STYLES } from './styles.js';
import { resolveEntities, discoverSwitches } from './adapter/entities.js';
import { Commands } from './adapter/commands.js';
import { deriveRobotVisualState } from './state/visual-state.js';
import { getRooms, buildTransform } from './adapter/map.js';
import { renderNeonMap } from './adapter/map-render.js';
import {
  makeCtx, renderTop, renderErrorBanner, renderNav, renderMap, renderStation, renderRobot, renderModes,
  renderRooms, renderAdvanced, renderService, renderHistory, renderSettings, renderRoomDetails,
} from './views/views.js';

const VERSION = '0.1.0';

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
