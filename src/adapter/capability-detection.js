import { pyParse, isUnavail } from '../util/parse.js';

export function getCapabilities(vacState) {
  const raw = vacState?.attributes?.capabilities;
  const list = Array.isArray(raw) ? raw : pyParse(raw);
  return new Set(Array.isArray(list) ? list : []);
}

export function hasService(hass, domain, service) {
  return !!hass?.services?.[domain]?.[service];
}

// Encja istnieje i nie jest unavailable/unknown.
export function usable(hass, entityId) {
  const st = hass?.states?.[entityId];
  return !!st && !isUnavail(st);
}

export function exists(hass, entityId) {
  return !!hass?.states?.[entityId];
}
