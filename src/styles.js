export const STYLES = `
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
.ctrl-row { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; height: 100%; }
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

/* --- tryby mapy: strefy / punkt / zakazane / edycja --- */
.map-overlay .hit { fill: transparent; pointer-events: none; }
.map-view.drawing .map-overlay .hit { pointer-events: all; cursor: crosshair; }
.map-view.drawing .map-labels .mlabel { pointer-events: none; opacity: .55; }
.map-view.drawing { cursor: crosshair; }
.sh { vector-effect: non-scaling-stroke; }
.sh.zone { fill: rgba(63,216,255,.18); stroke: var(--mx-cyan); cursor: pointer; filter: drop-shadow(0 0 6px rgba(63,216,255,.7)); }
.sh.nogo { fill: rgba(255,64,96,.2); stroke: #ff4060; cursor: pointer; }
.sh.nomop { fill: rgba(255,190,60,.18); stroke: #ffbe3c; cursor: pointer; }
.sh.wall { stroke: #ff4060; stroke-linecap: round; cursor: pointer; }
.sh.draft { fill: rgba(255,255,255,.12); stroke: #fff; stroke-dasharray: 8 6; }
.sh.split { stroke: #fff; stroke-dasharray: 10 6; }
.sh.pt { fill: var(--mx-cyan); } .sh.pt-ring { fill: rgba(63,216,255,.15); stroke: var(--mx-cyan); }
.sh-txt { fill: #fff; font-weight: 700; text-anchor: middle; dominant-baseline: central; pointer-events: none; text-shadow: 0 0 4px #000; }
.mode-bar { display:flex; flex-wrap: wrap; align-items:center; justify-content: space-between; gap:10px; margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(6,16,36,.7); box-shadow: 0 0 0 1px var(--mx-line); }
.mb-hint { display:flex; align-items:center; gap:8px; font-size: 13px; color: var(--mx-dim); } .mb-hint ha-icon { --mdc-icon-size: 18px; color: var(--mx-cyan); }
.mb-act { display:flex; flex-wrap: wrap; gap: 8px; align-items:center; }
.mb-act .seg ha-icon { --mdc-icon-size: 16px; }
.zone-list { display:flex; flex-direction:column; gap:8px; }
.zone-item { display:flex; align-items:center; gap:12px; padding: 8px 12px; border-radius: 10px; box-shadow: 0 0 0 1px var(--mx-line); }
.zone-item span { color: var(--mx-dim); font-size: 13px; flex: 1; }
.rtable select { background: rgba(6,16,36,.9); color: inherit; border: 1px solid var(--mx-line); border-radius: 6px; padding: 3px 4px; font: inherit; font-size: 12px; }
.rtable .link ha-icon { --mdc-icon-size: 14px; }
`;
