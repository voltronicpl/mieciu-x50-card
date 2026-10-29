# Changelog

## [1.0.0] — 2026-10-29
### Zmienione
- Wygląd 1:1 z mockupem: ramki HUD, ikony, pierścienie serwisu, przełączniki CleanGenius.
- Mapa holo 3D: warstwy głębi, poświata, skaner, meble z danych integracji.
- Kształty i metraż pokoi liczone z granic pokoi integracji (nie z kolorów obrazka).
- Robot i stacja na mapie jako stojące obiekty 3D.
- Czytelne etykiety pokoi w 2D.
- Przycisk Start podświetlony tylko podczas sprzątania.

### Naprawione
- Kliknięcie w mapę nie przewija już strony do góry (karta aktualizuje tylko zmienione elementy).

## [0.1.0] — 2026-10-29
### Dodane
- Układ 1:1 z zatwierdzonym mockupem: nagłówek telemetrii, mapa 3D z neonowym filtrem, panel stacji z listą procesów i kaflami „Zbiorniki i pojemniki”, rząd robota z dużymi przyciskami, kafle trybu/ssania/mopa z ikonami, pomieszczenia (Wszystkie/Kolejność), ustawienia zaawansowane w zakładkach (Ogólne, Dywany, CleanGenius, AI i przeszkody, Stacja), 6 pierścieni serwisu, historia.
- Opcje `robot_image`, `station_image`, `station_name`, `map_3d`.
- Szkielet karty `custom:mieciu-x50-card` (web component, bez zależności).
- Holograficzny layout: pasek telemetrii, nawigacja 7 zakładek, mapa, stacja, robot, kafle.
- `deriveRobotVisualState()` wg priorytetów ze specyfikacji (błąd → stacja → powrót → pauza → sprzątanie → baza → neutral).
- Autorska grafika SVG stacji i robota; animacje stanów (sprzątanie, powrót, mycie, suszenie, opróżnianie) z obsługą `prefers-reduced-motion`.
- Nakładki zbiorników: tylko status z sensorów (Zainstalowany / Brak / Nieznany / Wymaga uwagi) — bez wymyślonych litrów i %.
- Mapa: obraz z `camera.*_map`, pan/zoom, widok 2D/3D, filtr holo, znaczniki pokoi z `calibration_points`.
- Sterowanie: Start / Pauza / Do bazy (`vacuum.*`), tryb / ssanie / mop (`select.select_option`), przełączniki (`switch.toggle`).
- Sprzątanie wybranych pokoi przez `dreame_vacuum.vacuum_clean_segment` (po ID segmentu).
- Akcje stacji i resety serwisowe (`button.press`) zawsze z potwierdzeniem.
- Serwis (pierścienie), historia z miniaturami, ustawienia per pokój (odczyt), lista przełączników.
- Testy jednostkowe (`node --test`), skrypt budowania bez zależności.

### Świadomie pominięte (v0.2+)
- Sprzątanie stref i punktów, edycja mapy, wirtualne ściany — dopiero po audycie API i testach.
- Zmiana ustawień per pokój.
