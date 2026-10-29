// deriveRobotVisualState — kolejność priorytetów ze specyfikacji (pkt 5).
// Nie opieramy się tylko na sensor.status (sleeping współistnieje z docked).

import { toBool, isUnavail } from '../util/parse.js';

const AE_IDLE = new Set(['', 'idle', '0', 'none', 'not_performed', 'unavailable', 'unknown', 'off']);

export function deriveRobotVisualState(vac) {
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

export const STATION_ACTIVE = new Set(['washing', 'drying', 'auto_empty']);

// Status zbiornika -> etykieta karty. Bez wymyślania % napełnienia.
export function tankStatus(stateObj) {
  if (isUnavail(stateObj)) return 'unknown';
  const s = String(stateObj.state).toLowerCase();
  if (s === 'installed' || s === 'enabled' || s === 'normal') return 'installed';
  if (s.includes('not_installed') || s === 'missing' || s === 'removed' || s === 'no_bag' || s === 'not_detected') return 'not_installed';
  return 'attention'; // np. full, low, check, error
}
