export const STYLES = `
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
