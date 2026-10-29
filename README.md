# Mieciu X50 Card

Autorska, darmowa karta Lovelace dla **Dreame X50 Ultra** w Home Assistant — styl sci‑fi holograficzny.
Działa na encjach integracji **[Tasshack/dreame-vacuum](https://github.com/Tasshack/dreame-vacuum)** (integracja pozostaje nienaruszona).

> Status: **v0.1.0** — pierwsze wydanie. Sprawdź na swoim HA zanim zaufasz każdej funkcji.

## Instalacja

### HACS (repozytorium niestandardowe)
1. HACS → menu ⋮ → *Niestandardowe repozytoria*.
2. URL tego repo, kategoria **Dashboard** (Lovelace).
3. Zainstaluj **Mieciu X50 Card**, przeładuj przeglądarkę (Ctrl+F5).

### Ręcznie
1. Skopiuj `dist/mieciu-x50-card.js` do `/config/www/mieciu-x50-card.js`.
2. Ustawienia → Dashboardy → ⋮ → Zasoby → Dodaj: `/local/mieciu-x50-card.js`, typ **Moduł JavaScript**.

## Konfiguracja

```yaml
type: custom:mieciu-x50-card
entity: vacuum.mieciu
map_entity: camera.mieciu_map   # opcjonalnie, domyślnie camera.<prefix>_map
name: Mieciu
```

| Opcja | Domyślnie | Opis |
|---|---|---|
| `entity` | — (wymagane) | encja `vacuum.*` |
| `map_entity` | `camera.<prefix>_map` | kamera mapy z integracji |
| `name` | `Mieciu` | nazwa w nagłówku |
| `model` | `Dreame X50 Ultra` | podpis pod nazwą |
| `prefix` | object_id odkurzacza | prefiks do auto‑wykrywania encji |
| `entities` | — | ręczne nadpisanie dowolnej encji, np. `battery: sensor.inna` |
| `map_filter` | `holo` | `none` = mapa w oryginalnych kolorach |
| `default_tab` | `map` | `map`, `cleaning`, `station`, `rooms`, `service`, `history`, `settings` |

Najlepiej na pełnej szerokości (widok *Panel* lub sekcja na całą szerokość).

## Co działa w v0.1.0

- Stan robota liczony z wielu atrybutów (nie tylko `status`) → grafika: w stacji / sprząta / wraca / pauza / mycie / suszenie / opróżnianie / błąd.
- Stacja: zbiorniki pokazują **tylko status** z sensorów. Integracja nie podaje poziomu wody w litrach ani %, więc karta ich nie wymyśla.
- Mapa z kamery + pan/zoom + 2D/3D, klikalne środki pokoi.
- Start / Pauza / Do bazy, tryb, moc ssania, nawilżanie mopa.
- Sprzątanie wybranych pokoi (`dreame_vacuum.vacuum_clean_segment`).
- Akcje stacji i resety eksploatacji — zawsze z oknem potwierdzenia.
- Serwis, historia z miniaturami, ustawienia per pokój (podgląd), wszystkie przełączniki.

## Czego jeszcze NIE ma

Strefy, punkty, strefy zakazane, edycja mapy, zmiana ustawień per pokój — przyciski są widoczne, ale wyłączone do czasu audytu API.

## Budowanie

```bash
npm run build   # -> dist/mieciu-x50-card.js (bez zależności)
npm test
```

## Prywatność

Repo nie zawiera map, tokenów kamer, SSID ani IP. Nie wrzucaj eksportów stanów do repo (`.gitignore` je blokuje).

## Licencja

MIT. Projekt niezależny — nie zawiera kodu ani grafik z płatnych kart.
