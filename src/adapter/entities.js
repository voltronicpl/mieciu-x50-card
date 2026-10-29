// Rozwiązywanie encji: automatycznie z prefiksu (object_id odkurzacza),
// każdą można nadpisać w YAML:  entities: { battery: sensor.inna_bateria }

export const ENTITY_KEYS = {
  battery: 'sensor.{p}_battery_level',
  status: 'sensor.{p}_status',
  state: 'sensor.{p}_state',
  cleaning_time: 'sensor.{p}_cleaning_time',
  cleaned_area: 'sensor.{p}_cleaned_area',
  cleaning_progress: 'sensor.{p}_cleaning_progress',
  current_room: 'sensor.{p}_current_room',
  total_area: 'sensor.{p}_total_cleaned_area',
  total_time: 'sensor.{p}_total_cleaning_time',
  cleaning_count: 'sensor.{p}_cleaning_count',
  history: 'sensor.{p}_cleaning_history',
  error: 'sensor.{p}_error',
  task_status: 'sensor.{p}_task_status',
  mop_pad: 'sensor.{p}_mop_pad',
  // sprzątanie
  cleaning_mode: 'select.{p}_cleaning_mode',
  suction_level: 'select.{p}_suction_level',
  mop_pad_humidity: 'select.{p}_mop_pad_humidity',
  cleangenius: 'select.{p}_cleangenius',
  cleangenius_mode: 'select.{p}_cleangenius_mode',
  cleaning_route: 'select.{p}_cleaning_route',
  carpet_cleaning: 'select.{p}_carpet_cleaning',
  wetness_level: 'number.{p}_wetness_level',
  // mapa
  selected_map: 'select.{p}_selected_map',
  map_rotation: 'select.{p}_map_rotation',
  // stacja
  clean_water_tank: 'sensor.{p}_clean_water_tank_status',
  dirty_water_tank: 'sensor.{p}_dirty_water_tank_status',
  dust_bag: 'sensor.{p}_dust_bag_status',
  detergent: 'sensor.{p}_detergent_status',
  station_drainage_status: 'sensor.{p}_station_drainage_status',
  hot_water_status: 'sensor.{p}_hot_water_status',
  auto_empty_status: 'sensor.{p}_auto_empty_status',
  self_wash_base_status: 'sensor.{p}_self_wash_base_status',
  low_water_warning: 'sensor.{p}_low_water_warning',
  drying_progress: 'sensor.{p}_drying_progress',
  drying_left: 'sensor.{p}_drying_left',
  drying_time: 'select.{p}_drying_time',
  washing_mode: 'select.{p}_washing_mode',
  auto_empty_mode: 'select.{p}_auto_empty_mode',
  water_temperature: 'select.{p}_water_temperature',
  self_clean_frequency: 'select.{p}_self_clean_frequency',
  btn_auto_empty: 'button.{p}_start_auto_empty',
  btn_self_clean: 'button.{p}_self_clean',
  btn_manual_drying: 'button.{p}_manual_drying',
  btn_empty_water_tank: 'button.{p}_empty_water_tank',
  btn_water_tank_draining: 'button.{p}_water_tank_draining',
  btn_base_station_cleaning: 'button.{p}_base_station_cleaning',
  // serwis
  maintenance: 'binary_sensor.{p}_maintenance',
};

export const SERVICE_ITEMS = ['main_brush', 'side_brush', 'filter', 'sensor_dirty', 'silver_ion', 'wheel_dirty', 'scale_inhibitor'];
export const SERVICE_RESET = {
  main_brush: 'reset_main_brush', side_brush: 'reset_side_brush', filter: 'reset_filter',
  sensor_dirty: 'reset_sensor', silver_ion: 'reset_silver_ion', wheel_dirty: 'reset_wheel',
  scale_inhibitor: 'reset_scale_inhibitor',
};

export function prefixFromConfig(config) {
  if (config.prefix) return config.prefix;
  return String(config.entity || '').split('.')[1] || '';
}

export function resolveEntities(config) {
  const p = prefixFromConfig(config);
  const out = {};
  for (const [k, tpl] of Object.entries(ENTITY_KEYS)) out[k] = tpl.replace('{p}', p);
  for (const it of SERVICE_ITEMS) {
    out[`svc_${it}_left`] = `sensor.${p}_${it}_left`;
    out[`svc_${it}_time`] = `sensor.${p}_${it}_time_left`;
    out[`svc_${it}_reset`] = `button.${p}_${SERVICE_RESET[it]}`;
  }
  out.vacuum = config.entity;
  out.map = config.map_entity || `camera.${p}_map`;
  Object.assign(out, config.entities || {});
  return out;
}

// Encje per pokój — szablon z ID segmentu, nie z nazwy.
export function roomEntity(config, roomId, key) {
  const p = prefixFromConfig(config);
  const domain = key === 'wetness_level' ? 'number' : 'select';
  return `${domain}.${p}_room_${roomId}_${key}`;
}

// Wszystkie przełączniki urządzenia (do zakładki Ustawienia).
export function discoverSwitches(hass, config) {
  const p = prefixFromConfig(config);
  return Object.keys(hass.states)
    .filter((id) => id.startsWith(`switch.${p}_`))
    .sort();
}
