// Narzędzia do bezpiecznego parsowania wartości z HA.
// W żywym HA atrybuty są natywnymi typami (dict/list/bool), ale w eksportach
// z Edytora szablonów bywają stringami w składni Pythona. Obsługujemy oba.

export function toBool(v) {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return ['true', '1', 'on', 'yes'].includes(v.trim().toLowerCase());
  return false;
}

export function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function isUnavail(stateObj) {
  return !stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown';
}

// Parser literałów Pythona (dict/list/tuple/str/int/float/True/False/None,
// datetime.datetime(...)) -> wartości JS. Nie wykonuje żadnego kodu.
export function pyParse(input) {
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
export function parsePosition(v) {
  if (!v) return null;
  if (typeof v === 'object' && !Array.isArray(v) && 'x' in v) return { x: toNum(v.x), y: toNum(v.y), a: toNum(v.a) ?? 0 };
  if (Array.isArray(v)) return { x: toNum(v[0]), y: toNum(v[1]), a: toNum(v[2]) ?? 0 };
  const nums = String(v).match(/-?\d+(\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  return { x: Number(nums[0]), y: Number(nums[1]), a: nums[2] ? Number(nums[2]) : 0 };
}

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmtNum(n, digits = 0) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('pl-PL', { maximumFractionDigits: digits });
}

export function fmtMinutes(min) {
  const m = toNum(min);
  if (m === null) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}
