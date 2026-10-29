// Mapa: obraz z kamery integracji + warstwa nakładek liczona z
// calibration_points (punkty współrzędnych robota -> piksele obrazu).
// Nie zgadujemy geometrii pokoi z obrazu; używamy tylko środków (x,y)
// pokoi podanych przez integrację w atrybucie `rooms` kamery.

import { pyParse, parsePosition, toNum } from '../util/parse.js';

export function buildTransform(calibration) {
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
export function getRooms(vacState, mapState) {
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

// Odwrotność transformacji: piksele obrazu -> współrzędne robota (mm).
export function invertTransform(T) {
  if (!T) return null;
  const [ox, oy] = T(0, 0), [ax, ay] = T(1, 0), [bx, by] = T(0, 1);
  const a = ax - ox, c = bx - ox, b = ay - oy, d = by - oy;
  const det = a * d - b * c;
  if (!det) return null;
  return (px, py) => {
    const dx = px - ox, dy = py - oy;
    return [Math.round((d * dx - c * dy) / det), Math.round((-b * dx + a * dy) / det)];
  };
}

// Istniejące strefy zakazane / bez mopa / ściany z atrybutów kamery,
// sprowadzone do [x0,y0,x1,y1] (prostokąty) i [x0,y0,x1,y1] (linie).
function rects(list) {
  if (!Array.isArray(list)) return [];
  return list.map((a) => {
    const xs = [a.x0, a.x1, a.x2, a.x3].map(toNum).filter((v) => v !== null);
    const ys = [a.y0, a.y1, a.y2, a.y3].map(toNum).filter((v) => v !== null);
    if (xs.length < 2 || ys.length < 2) return null;
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(Math.round);
  }).filter(Boolean);
}
export function getRestricted(mapState) {
  const at = mapState?.attributes || {};
  const walls = (pyParse(at.virtual_walls) || []);
  return {
    zones: rects(pyParse(at.no_go_areas)),
    no_mops: rects(pyParse(at.no_mopping_areas)),
    walls: Array.isArray(walls) ? walls.map((w) => [w.x0, w.y0, w.x1, w.y1].map((v) => Math.round(toNum(v)))).filter((w) => w.every(Number.isFinite)) : [],
  };
}

export function getRobotPosition(mapState) {
  return parsePosition(mapState?.attributes?.vacuum_position);
}
export function getChargerPosition(mapState) {
  return parsePosition(mapState?.attributes?.charger_position);
}
