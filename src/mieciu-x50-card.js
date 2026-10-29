import { STYLES } from './styles.js';
import { resolveEntities, discoverSwitches } from './adapter/entities.js';
import { Commands } from './adapter/commands.js';
import { deriveRobotVisualState } from './state/visual-state.js';
import { getRooms } from './adapter/map.js';
import {
  makeCtx, renderTop, renderErrorBanner, renderNav, renderMap, renderStation, renderRobot, renderModes,
  renderRooms, renderAdvanced, renderService, renderHistory, renderSettings, renderRoomDetails,
} from './views/views.js';

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
