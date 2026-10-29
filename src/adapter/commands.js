// Wszystkie akcje karty w jednym miejscu. Tylko usługi potwierdzone:
//  - vacuum.start / vacuum.pause / vacuum.return_to_base (standard HA)
//  - dreame_vacuum.vacuum_clean_segment {segments: [id,...]} (docs Tasshack)
//  - select.select_option, switch.toggle, button.press (standard HA)
//  - dreame_vacuum.vacuum_clean_zone / vacuum_clean_spot / vacuum_goto
//  - dreame_vacuum.vacuum_set_restricted_zone (nadpisuje WSZYSTKIE strefy -> zawsze pełna lista)
//  - dreame_vacuum.vacuum_rename_segment / vacuum_merge_segments / vacuum_split_segments
// (zweryfikowane w services.yaml / vacuum.py integracji Tasshack)

import { hasService } from './capability-detection.js';

const dv = (hass, svc, vac, data) => hass.callService('dreame_vacuum', svc, { entity_id: vac, ...data });

export const Commands = {
  can: (hass, svc) => hasService(hass, 'dreame_vacuum', svc),
  cleanZones: (hass, vac, zones, repeats = 1) => dv(hass, 'vacuum_clean_zone', vac, { zone: zones, repeats: Number(repeats) }),
  cleanSpot: (hass, vac, points, repeats = 1) => dv(hass, 'vacuum_clean_spot', vac, { points, repeats: Number(repeats) }),
  goto: (hass, vac, x, y) => dv(hass, 'vacuum_goto', vac, { x, y }),
  setRestricted: (hass, vac, r) => dv(hass, 'vacuum_set_restricted_zone', vac, { walls: r.walls, zones: r.zones, no_mops: r.no_mops }),
  renameSegment: (hass, vac, id, name) => dv(hass, 'vacuum_rename_segment', vac, { segment_id: Number(id), segment_name: name }),
  mergeSegments: (hass, vac, ids) => dv(hass, 'vacuum_merge_segments', vac, { segments: ids.map(Number) }),
  splitSegment: (hass, vac, id, line) => dv(hass, 'vacuum_split_segments', vac, { segment: Number(id), line }),

  start: (hass, vac) => hass.callService('vacuum', 'start', { entity_id: vac }),
  pause: (hass, vac) => hass.callService('vacuum', 'pause', { entity_id: vac }),
  dock: (hass, vac) => hass.callService('vacuum', 'return_to_base', { entity_id: vac }),

  canCleanSegments: (hass) => hasService(hass, 'dreame_vacuum', 'vacuum_clean_segment'),
  cleanSegments: (hass, vac, segments) =>
    hass.callService('dreame_vacuum', 'vacuum_clean_segment', { entity_id: vac, segments: segments.map(Number) }),

  selectOption: (hass, entityId, option) =>
    hass.callService('select', 'select_option', { entity_id: entityId, option }),
  toggle: (hass, entityId) => hass.callService('switch', 'toggle', { entity_id: entityId }),
  press: (hass, entityId) => hass.callService('button', 'press', { entity_id: entityId }),
};
