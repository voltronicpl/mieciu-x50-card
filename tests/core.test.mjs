import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pyParse, parsePosition, toBool } from '../src/util/parse.js';
import { deriveRobotVisualState, tankStatus } from '../src/state/visual-state.js';
import { buildTransform, getRooms } from '../src/adapter/map.js';
import { resolveEntities, roomEntity } from '../src/adapter/entities.js';
import { parseHistory } from '../src/views/views.js';

const vac = (attrs, state = 'docked') => ({ state, attributes: attrs });

test('pyParse: dict z kluczami liczbowymi, True/None, krotka', () => {
  const v = pyParse("{1: {'name': 'Kuchnia', 'ok': True, 'x': None, 'p': (1, -2)}}");
  assert.deepEqual(v, { 1: { name: 'Kuchnia', ok: true, x: null, p: [1, -2] } });
});

test('pyParse: datetime i lista', () => {
  const v = pyParse("[{'id': 24, 'date': datetime.datetime(2026, 10, 29, 12, 21, 8), 'custom_name': None}]");
  assert.equal(v[0].id, 24);
  assert.equal(typeof v[0].date, 'string');
});

test('pyParse: natywne wartości przechodzą bez zmian', () => {
  const o = { a: 1 };
  assert.equal(pyParse(o), o);
});

test('parsePosition', () => {
  assert.deepEqual(parsePosition('(-187, -757, a = 0)'), { x: -187, y: -757, a: 0 });
  assert.deepEqual(parsePosition({ x: 5, y: 6, a: 90 }), { x: 5, y: 6, a: 90 });
});

test('toBool', () => {
  assert.equal(toBool('True'), true);
  assert.equal(toBool('False'), false);
  assert.equal(toBool(true), true);
});

test('stan: w stacji (sleeping + docked)', () => {
  assert.equal(deriveRobotVisualState(vac({ docked: true, status: 'sleeping', vacuum_state: 'charging_completed', auto_empty_status: 'Idle' })), 'docked');
});
test('stan: stringi z eksportu', () => {
  assert.equal(deriveRobotVisualState(vac({ docked: 'True', washing: 'False', auto_empty_status: 'Idle' })), 'docked');
});
test('stan: mycie ma pierwszeństwo przed docked', () => {
  assert.equal(deriveRobotVisualState(vac({ docked: true, washing: true })), 'washing');
});
test('stan: suszenie', () => {
  assert.equal(deriveRobotVisualState(vac({ docked: true, drying: true })), 'drying');
});
test('stan: opróżnianie', () => {
  assert.equal(deriveRobotVisualState(vac({ docked: true, auto_empty_status: 'Active' })), 'auto_empty');
});
test('stan: powrót przed sprzątaniem', () => {
  assert.equal(deriveRobotVisualState(vac({ running: true, returning: true }, 'returning')), 'returning');
});
test('stan: pauza przed sprzątaniem', () => {
  assert.equal(deriveRobotVisualState(vac({ started: true, paused: true }, 'paused')), 'paused');
});
test('stan: sprzątanie segmentów', () => {
  assert.equal(deriveRobotVisualState(vac({ running: true, segment_cleaning: true }, 'cleaning')), 'cleaning');
});
test('stan: błąd i niedostępny', () => {
  assert.equal(deriveRobotVisualState(vac({ has_error: true, docked: true })), 'error');
  assert.equal(deriveRobotVisualState({ state: 'unavailable', attributes: {} }), 'unavailable');
  assert.equal(deriveRobotVisualState(undefined), 'unavailable');
});
test('stan: brak pewności -> neutral', () => {
  assert.equal(deriveRobotVisualState(vac({}, 'idle')), 'neutral');
});

test('zbiorniki: tylko status, bez %', () => {
  assert.equal(tankStatus({ state: 'installed' }), 'installed');
  assert.equal(tankStatus({ state: 'not_installed' }), 'not_installed');
  assert.equal(tankStatus({ state: 'unavailable' }), 'unknown');
  assert.equal(tankStatus(undefined), 'unknown');
  assert.equal(tankStatus({ state: 'full' }), 'attention');
});

test('kalibracja mapy: transform afiniczny', () => {
  const T = buildTransform([
    { vacuum: { x: 0, y: 0 }, map: { x: 100, y: 500 } },
    { vacuum: { x: 1000, y: 0 }, map: { x: 180, y: 500 } },
    { vacuum: { x: 0, y: 1000 }, map: { x: 100, y: 420 } },
  ]);
  assert.deepEqual(T(0, 0), [100, 500]);
  assert.deepEqual(T(1000, 1000), [180, 420]);
  assert.deepEqual(T(-500, 250), [60, 480]);
});

test('pokoje: po ID, posortowane wg kolejności, z kamery i odkurzacza', () => {
  const cam = { attributes: { rooms: "{2: {'room_id': 2, 'name': 'B', 'order': 1, 'x': 1, 'y': 2, 'visibility': 'Visible'}, 1: {'room_id': 1, 'name': 'A', 'order': 2, 'x': 3, 'y': 4, 'visibility': 'Visible'}}" } };
  const v = { attributes: { selected_map: 'M', rooms: { M: [{ id: 1, name: 'A', icon: 'mdi:a' }, { id: 3, name: 'C' }] } } };
  const rooms = getRooms(v, cam);
  assert.deepEqual(rooms.map((r) => r.id), [2, 1, 3]);
  assert.equal(rooms.find((r) => r.id === 1).icon, 'mdi:a');
});

test('encje: prefiks z vacuum i nadpisania', () => {
  const e = resolveEntities({ entity: 'vacuum.robo', entities: { battery: 'sensor.x' } });
  assert.equal(e.battery, 'sensor.x');
  assert.equal(e.cleaning_mode, 'select.robo_cleaning_mode');
  assert.equal(e.map, 'camera.robo_map');
  assert.equal(roomEntity({ entity: 'vacuum.robo' }, 4, 'wetness_level'), 'number.robo_room_4_wetness_level');
});

test('historia: parsowanie i sortowanie', () => {
  const hist = { attributes: {
    '10-01 08:00': "{'timestamp': 100.0, 'cleaning_time': '7 min', 'cleaned_area': '7 m²', 'status': 'Room cleaning', 'completed': True}",
    '10-02 08:00': { timestamp: 200, cleaning_time: '9 min', cleaned_area: '8 m²', status: 'Zone cleaning', completed: false },
    friendly_name: 'x', icon: 'y', device_class: 'timestamp',
  } };
  const h = parseHistory(hist, { attributes: { cleaning_history_picture: { a: '/api/p?index=1&v=200' } } });
  assert.equal(h.length, 2);
  assert.equal(h[0].ts, 200);
  assert.equal(h[0].completed, false);
  assert.equal(h[0].pic, '/api/p?index=1&v=200');
  assert.equal(h[1].completed, true);
});
