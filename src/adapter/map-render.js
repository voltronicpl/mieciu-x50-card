// Neonowy render mapy z obrazu kamery integracji.
// Pokoje wyznaczane flood-fill'em od środka pokoju (x,y z atrybutu `rooms`),
// więc kształty są prawdziwe. Powierzchnia = liczba pikseli × skala z kalibracji
// (to szacunek z mapy, oznaczany w UI jako „~”).

export const NEON = ['#ff9f3f', '#2f8cff', '#b35cff', '#2fd67b', '#ff5fa8', '#26d4ff'];

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function renderNeonMap(img, rooms, T) {
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

  const seeds = [];
  rooms.forEach((r, idx) => {
    if (r.x === null || r.y === null) return;
    let [sx, sy] = T(r.x, r.y);
    sx = Math.round(sx); sy = Math.round(sy);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
    seeds.push({ idx, i: sy * w + sx });
  });

  // flood fill każdego pokoju
  const stack = new Int32Array(N);
  for (const { idx, i } of seeds) {
    if (owner[i] !== -1) continue;
    const col = px(i);
    if (col[3] < 20 || near(col, bg, 12)) continue;
    let sp = 0; stack[sp++] = i; owner[i] = idx;
    while (sp) {
      const k = stack[--sp];
      const x = k % w, y = (k - x) / w;
      const nb = [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1];
      for (const n of nb) {
        if (n < 0 || owner[n] !== -1) continue;
        const c = px(n);
        if (c[3] > 20 && near(c, col, 36)) { owner[n] = idx; stack[sp++] = n; }
      }
    }
  }
  // domknij dziury po trasie/ikonach (2 przebiegi dylatacji po pikselach nietłowych)
  for (let pass = 0; pass < 3; pass++) {
    const add = [];
    for (let k = 0; k < N; k++) {
      if (owner[k] !== -1) continue;
      const c = px(k);
      if (c[3] < 20 || near(c, bg, 12)) continue;
      const x = k % w;
      const cand = [x > 0 ? owner[k - 1] : -1, x < w - 1 ? owner[k + 1] : -1, k >= w ? owner[k - w] : -1, k < N - w ? owner[k + w] : -1].filter((o) => o >= 0);
      if (cand.length >= 2 && cand.every((o) => o === cand[0])) add.push(k, cand[0]);
    }
    for (let j = 0; j < add.length; j += 2) owner[add[j]] = add[j + 1];
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
  for (let k = 0; k < N; k++) {
    const own = owner[k];
    const x = k % w, y = (k - x) / w;
    if (own >= 0) {
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      areas.set(own, (areas.get(own) || 0) + 1);
      const [r, g, b] = colors[own];
      const edge = (x > 0 && owner[k - 1] !== own) || (x < w - 1 && owner[k + 1] !== own) || (k >= w && owner[k - w] !== own) || (k < N - w && owner[k + w] !== own);
      const onGrid = x % grid === 0 || y % grid === 0;
      const a = edge ? 255 : onGrid ? 190 : 115;
      const m = edge ? 1.35 : onGrid ? 1.1 : 0.85;
      o[k * 4] = Math.min(255, r * m + (edge ? 60 : 0)); o[k * 4 + 1] = Math.min(255, g * m + (edge ? 60 : 0)); o[k * 4 + 2] = Math.min(255, b * m + (edge ? 60 : 0)); o[k * 4 + 3] = a;
    } else {
      const c = px(k);
      if (c[3] < 20 || near(c, bg, 12)) continue;
      const lum = (c[0] + c[1] + c[2]) / 3;
      if (lum < 140) { // ściany / przeszkody -> jasny cyjan
        o[k * 4] = 120; o[k * 4 + 1] = 230; o[k * 4 + 2] = 255; o[k * 4 + 3] = 235;
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
