// Wszystkie akcje karty w jednym miejscu. Tylko usługi potwierdzone:
//  - vacuum.start / vacuum.pause / vacuum.return_to_base (standard HA)
//  - dreame_vacuum.vacuum_clean_segment {segments: [id,...]} (docs Tasshack)
//  - select.select_option, switch.toggle, button.press (standard HA)
// Strefy, punkty i edycja mapy celowo NIE są tu zaimplementowane (v0.2+).

import { hasService } from './capability-detection.js';

export const Commands = {
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
