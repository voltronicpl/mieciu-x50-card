// Polskie etykiety. Jeśli HA udostępnia hass.formatEntityState, karta korzysta
// z tłumaczeń integracji; poniższe są tylko awaryjne lub dla elementów karty.

export const PL = {
  tabs: {
    map: 'Mapa', cleaning: 'Sprzątanie', station: 'Stacja', rooms: 'Pomieszczenia',
    service: 'Serwis', history: 'Historia', settings: 'Ustawienia',
  },
  visual: {
    docked: 'W stacji', cleaning: 'Sprząta', returning: 'Wraca do stacji', paused: 'Pauza',
    washing: 'Mycie mopów', drying: 'Suszenie mopów', auto_empty: 'Opróżnianie',
    error: 'Błąd', unavailable: 'Niedostępny', neutral: 'Bezczynny',
  },
  tank: {
    installed: 'Zainstalowany', not_installed: 'Brak', missing: 'Brak',
    unknown: 'Nieznany', attention: 'Wymaga uwagi',
  },
  tankName: {
    clean_water: 'Czysta woda', dirty_water: 'Brudna woda', dust_bag: 'Worek na kurz', detergent: 'Detergent',
  },
  options: {
    // tryby
    sweeping: 'Odkurzanie', mopping: 'Mopowanie', sweeping_and_mopping: 'Odkurzanie i mopowanie',
    mopping_after_sweeping: 'Po odkurzaniu',
    // ssanie
    quiet: 'Cichy', silent: 'Cichy', standard: 'Standard', strong: 'Mocny', turbo: 'Turbo',
    // mop
    slightly_dry: 'Lekko', moist: 'Wilgotno', wet: 'Mokro',
    // CleanGenius
    off: 'Wył.', routine_cleaning: 'Rutynowe', deep_cleaning: 'Dokładne',
    // trasa
    quick: 'Szybka',
    // auto opróżnianie
    high_frequency: 'Często', low_frequency: 'Rzadko',
    // samoczyszczenie
    by_area: 'Wg powierzchni', by_time: 'Wg czasu', by_room: 'Wg pokoju',
    // dywany
    avoidance: 'Omijaj', adaptation: 'Adaptacja', remove_mop: 'Zdejmij mop', ignore: 'Ignoruj', cross: 'Przejedź',
    // podłogi
    tile: 'Płytki', wood: 'Drewno', none: 'Brak', carpet: 'Dywan',
    medium_pile_carpet: 'Dywan średni', low_pile_carpet: 'Dywan niski',
    in_deep_mode: 'W trybie dokładnym', in_all_modes: 'We wszystkich',
  },
  history: {
    'Room cleaning': 'Pokoje', 'Zone cleaning': 'Strefa', 'Spot cleaning': 'Punkt',
    'Cleaning': 'Całe mieszkanie', 'Fast mapping': 'Mapowanie',
  },
  service: {
    main_brush: 'Szczotka główna', side_brush: 'Szczotka boczna', filter: 'Filtr',
    sensor_dirty: 'Czujniki', silver_ion: 'Jony srebra', wheel_dirty: 'Koła', scale_inhibitor: 'Odkamieniacz',
  },
  station: {
    self_wash_base_status: 'Baza myjąca', auto_empty_status: 'Opróżnianie', station_drainage_status: 'Drenaż',
    hot_water_status: 'Gorąca woda', drying_progress: 'Postęp suszenia', drying_left: 'Pozostało suszenia',
    low_water_warning: 'Niski poziom wody', mop_pad: 'Mop',
  },
  generic: {
    rooms: 'Pomieszczenia', selectAll: 'Wszystkie', clear: 'Wyczyść', cleanSelected: 'Sprzątaj wybrane',
    start: 'Start', pause: 'Pauza', dock: 'Do bazy', resume: 'Wznów',
    unavailable: 'niedostępne', noMap: 'Brak obrazu mapy z kamery',
    confirm: 'Na pewno?', soon: 'Dostępne w kolejnej wersji (po audycie API)',
    cleaningMode: 'Tryb sprzątania', suction: 'Moc ssania', humidity: 'Nawilżanie mopów',
    battery: 'Bateria', state: 'Stan', map: 'Mapa', total: 'Łącznie', cycles: 'Cykle', last: 'Ostatnie sprzątanie',
    progress: 'Postęp', area: 'Powierzchnia', time: 'Czas', currentRoom: 'Pokój',
  },
};

export function optLabel(opt) {
  if (opt === null || opt === undefined) return '—';
  const k = String(opt);
  if (PL.options[k]) return PL.options[k];
  return k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
